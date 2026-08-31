const { AppError } = require('../../errors/AppError');
const repo = require('../../repositories/googleLink.repository');
const tokenCrypto = require('./tokenCrypto');
const googleApi = require('./googleApi');
const { signState, verifyState } = require('./oauthState');

function isEnabled() {
  return googleApi.isConfigured() && tokenCrypto.isConfigured();
}

function defaultTimezone() {
  return process.env.DEFAULT_TIMEZONE || 'America/Sao_Paulo';
}

/**
 * Só caminho relativo de mesma origem. Sem isso o returnTo é um open redirect:
 * bastaria mandar `https://malicioso/` para o callback jogar o navegador lá.
 */
function safeReturnTo(value) {
  const v = String(value || '');
  if (!/^\/[A-Za-z0-9/_-]*$/.test(v)) return '/';
  if (v.startsWith('//')) return '/';
  return v;
}

/**
 * Calendário a usar depois de uma autorização. Reaproveita o guardado só
 * enquanto ele ainda serve; fora disso, cria um novo.
 *
 * Antes o `calendarId` gravado era reaproveitado sempre que estivesse
 * preenchido, e nada nunca o limpava. Consequência: quem apagou o calendário
 * "ArcanaForge" no Google, ou autorizou outra conta, ficava com um link
 * permanentemente morto — a UI dizia "Conectada", e a confirmação seguinte
 * quebrava o link de novo, para sempre. Spec §2.2 passo 4 promete o oposto
 * ("religar cria um calendário novo").
 *
 * Duas checagens, e a segunda é a que decide: o e-mail que acabou de autorizar
 * tem que bater com o gravado (conta diferente = calendário de outra conta), e o
 * calendário tem que ser alcançável com o token novo. Quando um dos e-mails é
 * desconhecido (link antigo sem e-mail, ou id_token sem o campo) não dá pra
 * afirmar que a conta mudou, e aí a alcançabilidade responde sozinha — ela é
 * autoritativa, porque o token é da conta que acabou de autorizar.
 */
async function resolveCalendarId(anterior, email, accessToken) {
  const guardado = anterior?.calendarId;
  if (guardado) {
    const contaPodeSerAMesma = !anterior.email || !email || anterior.email === email;
    if (contaPodeSerAMesma && (await googleApi.calendarExists(accessToken, guardado))) {
      return guardado;
    }
  }
  return googleApi.createAppCalendar(accessToken, defaultTimezone());
}

async function startOAuth(uid, returnTo) {
  if (!isEnabled()) throw new AppError(503, 'Integração com Google Agenda não configurada');
  const { state, nonce, expiresAt } = signState(uid);
  await repo.createState(nonce, uid, expiresAt, safeReturnTo(returnTo));
  return googleApi.buildConsentUrl(state);
}

async function handleCallback({ code, state }) {
  if (!isEnabled()) throw new AppError(503, 'Integração com Google Agenda não configurada');
  if (!code) throw new AppError(400, 'code ausente');

  const verificado = verifyState(state);
  if (!verificado) throw new AppError(400, 'state inválido ou expirado');

  // Uso único: se o nonce já foi consumido, é replay.
  const guardado = await repo.consumeState(verificado.nonce);
  if (!guardado || guardado.uid !== verificado.uid) {
    throw new AppError(400, 'state já utilizado');
  }

  try {
    const { refreshToken, accessToken, scope, email } = await googleApi.exchangeCode(code);

    const anterior = await repo.findByUid(verificado.uid);
    const calendarId = await resolveCalendarId(anterior, email, accessToken);

    await repo.upsert(verificado.uid, {
      email,
      refreshTokenEnc: tokenCrypto.encryptToken(refreshToken),
      scope,
      calendarId,
    });

    // Sem isso, quem liga a conta depois de uma confirmação não vê nada na agenda
    // e conclui que a integração não funcionou.
    // O require fica inline de propósito: backfill -> calendarSync ->
    // googleLink.service fecha um ciclo, e resolvê-lo em tempo de chamada evita
    // o módulo parcialmente carregado.
    require('./backfill')
      .backfillForUid(verificado.uid)
      .catch((err) => console.error('Falha no backfill:', err.message));

    return { uid: verificado.uid, returnTo: safeReturnTo(guardado.returnTo) };
  } catch (err) {
    // Daqui em diante o returnTo já é conhecido (state consumido e validado):
    // anexa no erro para o controller devolver o navegador pra aba certa mesmo
    // quando a troca de código com o Google falha. Não reclassifica nem
    // engole o erro, só anota.
    err.returnTo = safeReturnTo(guardado.returnTo);
    throw err;
  }
}

async function getLinkState(uid) {
  if (!isEnabled()) return { linked: false, email: '', lastError: null };
  const link = await repo.findByUid(uid);
  if (!link) return { linked: false, email: '', lastError: null };
  return { linked: true, email: link.email || '', lastError: link.lastError || null };
}

async function unlink(uid) {
  if (!isEnabled()) return;
  const link = await repo.findByUid(uid);
  if (!link) return;
  if (link.refreshTokenEnc && tokenCrypto.isConfigured()) {
    try {
      await googleApi.revokeToken(tokenCrypto.decryptToken(link.refreshTokenEnc));
    } catch (_) {
      // Token já inválido: seguir com a remoção local de qualquer forma.
    }
  }
  await repo.remove(uid);
}

/**
 * Access token pronto para uso, ou null quando não há vínculo utilizável.
 * Traduz GoogleAuthError em "link quebrado" — é aqui que a expiração e a
 * revogação viram estado visível na UI.
 */
async function getAccessTokenFor(uid) {
  if (!isEnabled()) return null;
  const link = await repo.findByUid(uid);
  if (!link || link.lastError) return null;
  try {
    const accessToken = await googleApi.refreshAccessToken(
      tokenCrypto.decryptToken(link.refreshTokenEnc),
    );
    return { accessToken, calendarId: link.calendarId };
  } catch (err) {
    if (err instanceof googleApi.GoogleAuthError) {
      await repo.setLastError(uid, err.message);
      return null;
    }
    throw err;
  }
}

module.exports = {
  isEnabled,
  defaultTimezone,
  safeReturnTo,
  startOAuth,
  handleCallback,
  getLinkState,
  unlink,
  getAccessTokenFor,
};
