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

  const { refreshToken, accessToken, scope, email } = await googleApi.exchangeCode(code);

  const anterior = await repo.findByUid(verificado.uid);
  const calendarId = anterior?.calendarId
    || (await googleApi.createAppCalendar(accessToken, defaultTimezone()));

  await repo.upsert(verificado.uid, {
    email,
    refreshTokenEnc: tokenCrypto.encryptToken(refreshToken),
    scope,
    calendarId,
  });

  return { uid: verificado.uid, returnTo: safeReturnTo(guardado.returnTo) };
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
