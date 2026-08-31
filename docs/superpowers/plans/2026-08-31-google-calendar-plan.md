# Integração com Google Agenda — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quando uma proposta de sessão passa a estar confirmada por todos os membros, criar o evento da sessão no Google Agenda de cada membro que ligou a própria conta.

**Architecture:** OAuth 2.0 com refresh token cifrado em repouso, uma credencial por usuário na coleção `googleLinks`. O gatilho fica em `respondToSession`/`cancelSession` como efeito colateral fire-and-forget, no mesmo padrão do `sendSessionProposalEmail` que já existe. Um único módulo (`googleApi.js`) fala rede; tudo acima dele é puro e testável sem tocar no Google. Cada membro é uma operação independente: falha em um não impede os outros.

**Tech Stack:** Node 24 (`fetch` e `crypto` nativos — nenhuma dependência nova), Express 4, Mongoose 9, `node:test` no server, Vitest + React 19 no client.

**Spec:** `docs/superpowers/specs/2026-08-31-google-calendar-design.md`

## Global Constraints

Valem para todas as tasks. Valores copiados da spec.

- **Nenhuma dependência nova.** Node 24 tem `fetch` global e `crypto`. Não instalar `googleapis`, `google-auth-library`, `jsonwebtoken` nem afins.
- **O app nunca usa `attendees` nem `sendUpdates`.** Não manda convite nem e-mail via Google para ninguém.
- **Refresh token sempre cifrado** (AES-256-GCM). Se `GOOGLE_TOKEN_ENC_KEY` não existir, a feature se desliga inteira. **Nunca** guardar token em claro como alternativa.
- **`refreshTokenEnc` nunca sai do server.** Não entra em nenhum DTO nem resposta HTTP.
- **O callback OAuth fica fora de `/api`** (`/auth/google/callback`), porque `server/index.js:73` tem `app.use('/api', apiLimiter, requireAuth)` e o callback é redirect de navegador sem Bearer token. Não abrir exceção dentro do `requireAuth`.
- **Efeitos do Google são fire-and-forget.** Votar, propor ou cancelar nunca podem falhar porque o Google está fora do ar.
- **Escopos vêm de `GOOGLE_OAUTH_SCOPES`**, não de constante no código.
- **Idempotência por uid**: se já existe entrada em `proposal.googleEvents` para aquele uid, não criar outro evento.
- **Comentários e mensagens em português**, como o resto do repo.

## Estrutura de arquivos

```
server/
  db/models/GoogleLink.js                 credencial por usuário
  db/models/GoogleOauthState.js           nonce de uso único (índice TTL)
  db/models/Party.js                      MODIFICAR: + timezone, + googleEvents
  src/repositories/googleLink.repository.js
  src/services/google/tokenCrypto.js      HKDF + AES-256-GCM (puro)
  src/services/google/oauthState.js       assina/verifica state (puro)
  src/services/google/googleApi.js        ÚNICO módulo com fetch para o Google
  src/services/google/eventBody.js        monta o corpo do evento (puro)
  src/services/google/syncPlan.js         decide o que criar/apagar (puro)
  src/services/google/calendarSync.js     executa o plano (impuro)
  src/services/google/backfill.js         propostas confirmadas futuras
  src/services/google/googleLink.service.js  orquestra start/callback/unlink
  src/controllers/google.controller.js
  src/routes/google.routes.js
  src/routes/index.js                     MODIFICAR: registra createGoogleRoutes
  src/services/party.service.js           MODIFICAR: gatilho + timezone

client/src/
  api/google.ts                           4 endpoints
  api/index.ts                            MODIFICAR: re-exporta
  api/parties.ts                          MODIFICAR: apiProposeSession envia timezone
  types/party.ts                          MODIFICAR: + timezone, + googleEvents
  components/party/GoogleCalendarLink/    linha na sidebar
  components/party/GroupInfoCard/         MODIFICAR: inclui a linha
  pages/PartyCalendarPage/                MODIFICAR: lê ?google= e mostra Toast
  components/party/SessionAgenda/         MODIFICAR: indicador no bloco
  components/party/ProposalDetailModal/   MODIFICAR: indicador na modal

docs/google-agenda-setup.md               runbook do Google Cloud Console
.env.example                              MODIFICAR: + 5 variáveis
```

## Fases

**Fase 1 (Tasks 1–7)** — vínculo da conta. Entregável independente: dá para ligar e desligar a conta Google e ver o estado na sidebar. Nenhum evento é criado ainda.

**Fase 2 (Tasks 8–13)** — criação e sincronização dos eventos.

Ao fim da Fase 1 há um checkpoint de verificação manual, porque é o primeiro momento em que o fluxo OAuth real pode ser exercitado.

---

### Task 1: Cifragem do refresh token

**Files:**
- Create: `server/src/services/google/tokenCrypto.js`
- Test: `server/src/services/google/tokenCrypto.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `isConfigured(): boolean` — true quando `GOOGLE_TOKEN_ENC_KEY` existe e decodifica para exatamente 32 bytes.
  - `deriveSubkey(info: string): Buffer` — 32 bytes via HKDF-SHA256. Lança se não configurado.
  - `encryptToken(plain: string): string` — devolve `"ivB64:tagB64:cipherB64"`.
  - `decryptToken(payload: string): string` — lança se adulterado.

- [ ] **Step 1: Escrever os testes que falham**

```js
// server/src/services/google/tokenCrypto.test.js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const KEY = Buffer.alloc(32, 7).toString('base64');
let tokenCrypto;

function loadFresh() {
  delete require.cache[require.resolve('./tokenCrypto')];
  return require('./tokenCrypto');
}

describe('tokenCrypto', () => {
  const original = process.env.GOOGLE_TOKEN_ENC_KEY;

  beforeEach(() => {
    process.env.GOOGLE_TOKEN_ENC_KEY = KEY;
    tokenCrypto = loadFresh();
  });

  afterEach(() => {
    if (original === undefined) delete process.env.GOOGLE_TOKEN_ENC_KEY;
    else process.env.GOOGLE_TOKEN_ENC_KEY = original;
  });

  it('faz round-trip do token', () => {
    const enc = tokenCrypto.encryptToken('1//refresh-token-do-google');
    assert.equal(tokenCrypto.decryptToken(enc), '1//refresh-token-do-google');
  });

  it('gera ciphertext diferente a cada chamada (iv aleatório)', () => {
    assert.notEqual(tokenCrypto.encryptToken('abc'), tokenCrypto.encryptToken('abc'));
  });

  it('rejeita ciphertext adulterado pelo authTag', () => {
    const [iv, tag, cipher] = tokenCrypto.encryptToken('abc').split(':');
    const mexido = Buffer.from(cipher, 'base64');
    mexido[0] = mexido[0] ^ 0xff;
    assert.throws(() => tokenCrypto.decryptToken(`${iv}:${tag}:${mexido.toString('base64')}`));
  });

  it('deriva subchaves diferentes para info diferentes', () => {
    const a = tokenCrypto.deriveSubkey('arcanaforge:token-enc');
    const b = tokenCrypto.deriveSubkey('arcanaforge:oauth-state');
    assert.equal(a.length, 32);
    assert.notEqual(a.toString('hex'), b.toString('hex'));
  });

  it('não está configurado quando a chave falta', () => {
    delete process.env.GOOGLE_TOKEN_ENC_KEY;
    const semChave = loadFresh();
    assert.equal(semChave.isConfigured(), false);
    assert.throws(() => semChave.encryptToken('abc'));
  });

  it('não está configurado quando a chave não tem 32 bytes', () => {
    process.env.GOOGLE_TOKEN_ENC_KEY = Buffer.alloc(16, 1).toString('base64');
    assert.equal(loadFresh().isConfigured(), false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node --test server/src/services/google/tokenCrypto.test.js`
Expected: FAIL — `Cannot find module './tokenCrypto'`

- [ ] **Step 3: Implementar o mínimo**

```js
// server/src/services/google/tokenCrypto.js
const crypto = require('node:crypto');

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;

/** Lê a chave-mestra do ambiente. Só é válida com exatamente 32 bytes. */
function masterKey() {
  const raw = process.env.GOOGLE_TOKEN_ENC_KEY;
  if (!raw) return null;
  let buf;
  try {
    buf = Buffer.from(raw, 'base64');
  } catch (_) {
    return null;
  }
  return buf.length === KEY_LEN ? buf : null;
}

function isConfigured() {
  return masterKey() !== null;
}

/**
 * Subchave por finalidade. A chave-mestra nunca é usada direto: cifrar e
 * assinar recebem subchaves distintas, para que o comprometimento de um uso
 * não valha para o outro.
 */
function deriveSubkey(info) {
  const key = masterKey();
  if (!key) throw new Error('GOOGLE_TOKEN_ENC_KEY ausente ou inválida');
  return Buffer.from(crypto.hkdfSync('sha256', key, Buffer.alloc(0), info, KEY_LEN));
}

function encryptToken(plain) {
  const key = deriveSubkey('arcanaforge:token-enc');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join(':');
}

function decryptToken(payload) {
  const [ivB64, tagB64, cipherB64] = String(payload).split(':');
  if (!ivB64 || !tagB64 || !cipherB64) throw new Error('Payload cifrado malformado');
  const key = deriveSubkey('arcanaforge:token-enc');
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(cipherB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { isConfigured, deriveSubkey, encryptToken, decryptToken };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node --test server/src/services/google/tokenCrypto.test.js`
Expected: PASS — 6 testes

- [ ] **Step 5: Commit**

```bash
git add server/src/services/google/tokenCrypto.js server/src/services/google/tokenCrypto.test.js
git commit -m "feat(google): cifragem do refresh token com HKDF + AES-256-GCM"
```

---

### Task 2: Assinatura do state do OAuth

**Files:**
- Create: `server/src/services/google/oauthState.js`
- Test: `server/src/services/google/oauthState.test.js`

**Interfaces:**
- Consumes: `deriveSubkey` de `tokenCrypto` (Task 1).
- Produces:
  - `signState(uid: string, ttlSeconds = 600): { state: string, nonce: string, expiresAt: Date }`
  - `verifyState(state: string, now = Date.now()): { uid: string, nonce: string } | null` — `null` em qualquer falha (assinatura, formato, expiração).

- [ ] **Step 1: Escrever os testes que falham**

```js
// server/src/services/google/oauthState.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

process.env.GOOGLE_TOKEN_ENC_KEY = Buffer.alloc(32, 3).toString('base64');
const { signState, verifyState } = require('./oauthState');

describe('oauthState', () => {
  it('verifica um state que ele mesmo assinou', () => {
    const { state, nonce } = signState('uid-123');
    assert.deepEqual(verifyState(state), { uid: 'uid-123', nonce });
  });

  it('devolve nonce diferente a cada assinatura', () => {
    assert.notEqual(signState('uid-123').nonce, signState('uid-123').nonce);
  });

  it('rejeita assinatura adulterada', () => {
    const { state } = signState('uid-123');
    const [payload] = state.split('.');
    assert.equal(verifyState(`${payload}.YXNzaW5hdHVyYS1mYWxzYQ`), null);
  });

  it('rejeita payload trocado mantendo a assinatura antiga', () => {
    const { state } = signState('uid-123');
    const [, sig] = state.split('.');
    const outro = Buffer.from('uid-999.nonce.9999999999999', 'utf8').toString('base64url');
    assert.equal(verifyState(`${outro}.${sig}`), null);
  });

  it('rejeita state expirado', () => {
    const { state } = signState('uid-123', 60);
    assert.equal(verifyState(state, Date.now() + 61_000), null);
  });

  it('rejeita formato sem ponto', () => {
    assert.equal(verifyState('semponto'), null);
    assert.equal(verifyState(''), null);
  });

  it('devolve expiresAt coerente com o ttl', () => {
    const antes = Date.now();
    const { expiresAt } = signState('uid-123', 300);
    assert.ok(expiresAt.getTime() >= antes + 300_000);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node --test server/src/services/google/oauthState.test.js`
Expected: FAIL — `Cannot find module './oauthState'`

- [ ] **Step 3: Implementar o mínimo**

```js
// server/src/services/google/oauthState.js
const crypto = require('node:crypto');
const { deriveSubkey } = require('./tokenCrypto');

const SEP = '.';

function sign(payloadB64) {
  return crypto
    .createHmac('sha256', deriveSubkey('arcanaforge:oauth-state'))
    .update(payloadB64)
    .digest('base64url');
}

function signState(uid, ttlSeconds = 600) {
  const nonce = crypto.randomBytes(32).toString('hex');
  const exp = Date.now() + ttlSeconds * 1000;
  const payloadB64 = Buffer.from(`${uid}${SEP}${nonce}${SEP}${exp}`, 'utf8').toString('base64url');
  return {
    state: `${payloadB64}${SEP}${sign(payloadB64)}`,
    nonce,
    expiresAt: new Date(exp),
  };
}

function verifyState(state, now = Date.now()) {
  const parts = String(state || '').split(SEP);
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const esperado = Buffer.from(sign(payloadB64), 'utf8');
  const recebido = Buffer.from(sig, 'utf8');
  // timingSafeEqual exige mesmo tamanho; comprimento diferente já é rejeição.
  if (esperado.length !== recebido.length) return null;
  if (!crypto.timingSafeEqual(esperado, recebido)) return null;

  const [uid, nonce, exp] = Buffer.from(payloadB64, 'base64url').toString('utf8').split(SEP);
  if (!uid || !nonce || !exp) return null;
  if (Number(exp) <= now) return null;

  return { uid, nonce };
}

module.exports = { signState, verifyState };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node --test server/src/services/google/oauthState.test.js`
Expected: PASS — 7 testes

- [ ] **Step 5: Commit**

```bash
git add server/src/services/google/oauthState.js server/src/services/google/oauthState.test.js
git commit -m "feat(google): state do OAuth assinado com HMAC e ttl"
```

---

### Task 3: Modelos e repositório do vínculo

**Files:**
- Create: `server/db/models/GoogleLink.js`
- Create: `server/db/models/GoogleOauthState.js`
- Create: `server/src/repositories/googleLink.repository.js`
- Modify: `server/src/repositories/party.repository.js`

**Interfaces:**
- Consumes: nada.
- Produces (`party.repository.js`):
  - `updateProposalGoogleEvents(partyId, proposalId, googleEvents): Promise<void>` - usado pela Task 11. Fica aqui, e nao no service, porque no repo **nenhum service requer model direto**: todo acesso a model passa por `server/src/repositories/`.
- Produces (`googleLink.repository.js`):
  - `findByUid(uid): Promise<Object|null>` — documento lean.
  - `upsert(uid, { email, refreshTokenEnc, scope, calendarId }): Promise<void>` — grava e zera `lastError`.
  - `setLastError(uid, message): Promise<void>`
  - `remove(uid): Promise<void>`
  - `findHealthyByUids(uids: string[]): Promise<Object[]>` — só os com `lastError` nulo.
  - `createState(nonce, uid, expiresAt, returnTo): Promise<void>`
  - `consumeState(nonce): Promise<Object|null>` — `findOneAndDelete`, uso único; o documento devolvido inclui `returnTo`.

Sem teste unitário: é camada de acesso a dados sem lógica, e o repo não tem infraestrutura de Mongo em teste. A verificação vem no checkpoint da Task 7.

- [ ] **Step 1: Criar o modelo do vínculo**

```js
// server/db/models/GoogleLink.js
const mongoose = require('mongoose');

const googleLinkSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // uid do Firebase
    email: { type: String, default: '' },
    refreshTokenEnc: { type: String, required: true },
    scope: { type: String, default: '' },
    calendarId: { type: String, default: '' },
    linkedAt: { type: Date, default: Date.now },
    lastError: { type: String, default: null },
  },
  { _id: false, timestamps: true, collection: 'googleLinks' },
);

module.exports = mongoose.model('GoogleLink', googleLinkSchema);
```

- [ ] **Step 2: Criar o modelo do state (com índice TTL)**

```js
// server/db/models/GoogleOauthState.js
const mongoose = require('mongoose');

const googleOauthStateSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // nonce
    uid: { type: String, required: true },
    // Caminho relativo para onde devolver o navegador depois do consentimento.
    // Fica no banco (e nao no state assinado) para nao poder ser trocado no
    // meio do fluxo, e para nao ter que embutir barras num payload separado
    // por ponto.
    returnTo: { type: String, default: '/' },
    // expires: 0 faz o Mongo apagar o documento quando expiresAt passa.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { _id: false, collection: 'googleOauthStates' },
);

module.exports = mongoose.model('GoogleOauthState', googleOauthStateSchema);
```

- [ ] **Step 3: Criar o repositório**

```js
// server/src/repositories/googleLink.repository.js
const GoogleLink = require('../../db/models/GoogleLink');
const GoogleOauthState = require('../../db/models/GoogleOauthState');

async function findByUid(uid) {
  return GoogleLink.findById(uid).lean();
}

async function upsert(uid, { email, refreshTokenEnc, scope, calendarId }) {
  await GoogleLink.findByIdAndUpdate(
    uid,
    { email, refreshTokenEnc, scope, calendarId, linkedAt: new Date(), lastError: null },
    { upsert: true },
  );
}

async function setLastError(uid, message) {
  await GoogleLink.findByIdAndUpdate(uid, { lastError: String(message).slice(0, 300) });
}

async function remove(uid) {
  await GoogleLink.findByIdAndDelete(uid);
}

/** Só vínculos saudáveis: com lastError preenchido, o app para de tentar. */
async function findHealthyByUids(uids) {
  if (!uids || uids.length === 0) return [];
  return GoogleLink.find({ _id: { $in: uids }, lastError: null }).lean();
}

async function createState(nonce, uid, expiresAt, returnTo) {
  await GoogleOauthState.create({ _id: nonce, uid, expiresAt, returnTo: returnTo || '/' });
}

/** Uso único: some do banco na primeira leitura. */
async function consumeState(nonce) {
  return GoogleOauthState.findOneAndDelete({ _id: nonce }).lean();
}

module.exports = {
  findByUid,
  upsert,
  setLastError,
  remove,
  findHealthyByUids,
  createState,
  consumeState,
};
```

- [ ] **Step 3b: Acrescentar a funcao de eventos ao `party.repository.js`**

```js
/** Substitui a lista de eventos do Google de uma proposta, sem reescrever o resto. */
async function updateProposalGoogleEvents(partyId, proposalId, googleEvents) {
  await Party.updateOne(
    { _id: partyId, 'sessionProposals.id': proposalId },
    { $set: { 'sessionProposals.$.googleEvents': googleEvents } },
  );
}
```

E incluir `updateProposalGoogleEvents` no `module.exports` existente.

- [ ] **Step 4: Confirmar que os modelos carregam sem erro**

Run: `node -e "require('./server/db/models/GoogleLink'); require('./server/db/models/GoogleOauthState'); require('./server/src/repositories/googleLink.repository'); console.log('ok')"`
Expected: imprime `ok`

- [ ] **Step 5: Commit**

```bash
git add server/db/models/GoogleLink.js server/db/models/GoogleOauthState.js server/src/repositories/googleLink.repository.js server/src/repositories/party.repository.js
git commit -m "feat(google): modelos do vínculo e do state, com repositório"
```

---

### Task 4: Cliente HTTP do Google

**Files:**
- Create: `server/src/services/google/googleApi.js`

**Interfaces:**
- Consumes: nada dos módulos anteriores (só `fetch` e env).
- Produces:
  - `class GoogleAuthError extends Error` — sinaliza credencial inválida (`invalid_grant`, 401, 404 de calendário). Quem chama traduz em link quebrado.
  - `isConfigured(): boolean` — `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` presentes.
  - `buildConsentUrl(state: string): string`
  - `exchangeCode(code: string): Promise<{ refreshToken, accessToken, scope, email }>`
  - `refreshAccessToken(refreshToken: string): Promise<string>`
  - `revokeToken(token: string): Promise<void>`
  - `createAppCalendar(accessToken: string, timeZone: string): Promise<string>` — devolve `calendarId`.
  - `insertEvent(accessToken, calendarId, body): Promise<string>` — devolve `eventId`.
  - `deleteEvent(accessToken, calendarId, eventId): Promise<void>` — 404/410 são sucesso (já não existe).

Sem teste unitário: é a fronteira de rede, e a spec determina que nenhum teste chame o Google. A lógica testável vive nas Tasks 9 e 10.

- [ ] **Step 1: Implementar o módulo**

```js
// server/src/services/google/googleApi.js
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const CAL_URL = 'https://www.googleapis.com/calendar/v3';

const DEFAULT_SCOPES = 'openid email https://www.googleapis.com/auth/calendar.app.created';

/** Credencial inválida/revogada. Quem chama marca o vínculo como quebrado. */
class GoogleAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

function isConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function scopes() {
  return process.env.GOOGLE_OAUTH_SCOPES || DEFAULT_SCOPES;
}

function buildConsentUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: scopes(),
    access_type: 'offline',
    // Sem prompt=consent o Google pode omitir o refresh token numa segunda
    // autorização, e religar depois de uma revogação ficaria inutilizável.
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function postForm(url, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    if (body.error === 'invalid_grant' || res.status === 401) {
      throw new GoogleAuthError(body.error_description || body.error || 'credencial inválida');
    }
    throw new Error(`Google ${res.status}: ${body.error_description || body.error || text}`);
  }
  return body;
}

/**
 * E-mail vindo do id_token. O payload é decodificado sem verificar assinatura:
 * a resposta veio direto do endpoint de token do Google, por TLS, autenticada
 * com o client secret — não é um token recebido de terceiro.
 */
function emailFromIdToken(idToken) {
  if (!idToken) return '';
  const payload = String(idToken).split('.')[1];
  if (!payload) return '';
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).email || '';
  } catch (_) {
    return '';
  }
}

async function exchangeCode(code) {
  const body = await postForm(TOKEN_URL, {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  if (!body.refresh_token) {
    throw new Error('Google não devolveu refresh token (falta access_type=offline ou prompt=consent)');
  }
  return {
    refreshToken: body.refresh_token,
    accessToken: body.access_token,
    scope: body.scope || '',
    email: emailFromIdToken(body.id_token),
  };
}

async function refreshAccessToken(refreshToken) {
  const body = await postForm(TOKEN_URL, {
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });
  return body.access_token;
}

async function revokeToken(token) {
  // Revogar já revogado devolve erro; não é motivo para falhar o unlink.
  try {
    await postForm(REVOKE_URL, { token });
  } catch (_) {
    /* ignorado de propósito */
  }
}

async function calendarFetch(accessToken, path, init = {}) {
  const res = await fetch(`${CAL_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new GoogleAuthError(`Calendar ${res.status}`);
  }
  return res;
}

async function createAppCalendar(accessToken, timeZone) {
  const res = await calendarFetch(accessToken, '/calendars', {
    method: 'POST',
    body: JSON.stringify({ summary: 'ArcanaForge', timeZone }),
  });
  if (!res.ok) throw new Error(`Falha ao criar calendário: ${res.status}`);
  return (await res.json()).id;
}

async function insertEvent(accessToken, calendarId, body) {
  const res = await calendarFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  // Calendário apagado pela pessoa no Google: mesmo tratamento de credencial.
  if (res.status === 404) throw new GoogleAuthError('calendário não encontrado');
  if (!res.ok) throw new Error(`Falha ao criar evento: ${res.status}`);
  return (await res.json()).id;
}

async function deleteEvent(accessToken, calendarId, eventId) {
  const res = await calendarFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' },
  );
  // Já não existe é o estado desejado.
  if (res.ok || res.status === 404 || res.status === 410) return;
  throw new Error(`Falha ao apagar evento: ${res.status}`);
}

module.exports = {
  GoogleAuthError,
  isConfigured,
  buildConsentUrl,
  exchangeCode,
  refreshAccessToken,
  revokeToken,
  createAppCalendar,
  insertEvent,
  deleteEvent,
};
```

- [ ] **Step 2: Confirmar que carrega e que buildConsentUrl monta a URL certa**

Run:
```bash
GOOGLE_CLIENT_ID=abc GOOGLE_CLIENT_SECRET=def GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback \
node -e "const g=require('./server/src/services/google/googleApi');console.log(g.isConfigured());console.log(g.buildConsentUrl('S'))"
```
Expected: `true`, e uma URL contendo `access_type=offline`, `prompt=consent`, `state=S` e o escopo `calendar.app.created`.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/google/googleApi.js
git commit -m "feat(google): cliente REST do Google (único módulo com fetch)"
```

---

### Task 5: Runbook do Google Cloud Console e variáveis de ambiente

**Files:**
- Create: `docs/google-agenda-setup.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: os nomes de env usados nas Tasks 1 e 4.
- Produces: documento que o usuário segue para obter `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e gerar `GOOGLE_TOKEN_ENC_KEY`.

Esta task vem antes das rotas de propósito: sem as credenciais configuradas, o fluxo OAuth da Task 6 não pode ser exercitado.

- [ ] **Step 1: Escrever o runbook**

```markdown
# Ligar o ArcanaForge ao Google Agenda

Passo a passo no Google Cloud Console. Feito uma vez, por quem administra o
projeto. Ao final, cinco valores vão para o `.env`.

## 1. Projeto

1. Abra <https://console.cloud.google.com/> com a conta que vai administrar.
2. No seletor de projeto (topo), **Novo projeto**. Nome: `ArcanaForge`. Criar.
3. Confirme que o seletor mostra `ArcanaForge` antes de seguir.

## 2. Ativar a Calendar API

1. Menu → **APIs e serviços → Biblioteca**.
2. Busque `Google Calendar API`. Abra e clique em **Ativar**.

## 3. Tela de consentimento

1. Menu → **APIs e serviços → Tela de permissão OAuth**.
2. Tipo de usuário: **Externo**. Criar.
3. Preencha:
   - **Nome do app:** `ArcanaForge`
   - **E-mail de suporte:** seu e-mail
   - **E-mail do desenvolvedor:** seu e-mail

   Esses dois aparecem para os membros na hora de autorizar.
4. Salvar e continuar.

## 4. Escopos

1. Na etapa **Escopos**, clique em **Adicionar ou remover escopos**.
2. Adicione os três:
   - `openid`
   - `.../auth/userinfo.email`
   - `https://www.googleapis.com/auth/calendar.app.created`
3. **Anote o rótulo que aparece ao lado do escopo de calendário**
   (Non-sensitive / Sensitive). Se for *Non-sensitive*, ninguém verá tela de
   aviso. Se for *Sensitive*, cada membro vê uma vez a tela de "app não
   verificado" e precisa clicar em **Avançado → acessar ArcanaForge**.
4. Salvar e continuar.

## 5. Publicar o app — passo que não pode ser esquecido

1. Volte para **Tela de permissão OAuth**.
2. Em **Status da publicação**, clique em **Publicar app** e confirme.
3. O status precisa ficar **Em produção**, não "Testes".

Por que importa: no status "Testes" o Google emite refresh token que **expira em
7 dias**, o que obrigaria cada membro a religar a conta toda semana. Em produção
o token não expira por status. Se em algum momento a agenda parar de receber as
sessões para todos ao mesmo tempo, confira este item primeiro.

Não é necessário cadastrar usuários de teste: essa lista só existe no status
"Testes".

## 6. Credenciais OAuth

1. Menu → **APIs e serviços → Credenciais**.
2. **Criar credenciais → ID do cliente OAuth**.
3. Tipo de aplicativo: **Aplicativo da Web**. Nome: `ArcanaForge web`.
4. Em **URIs de redirecionamento autorizados**, adicione **exatamente**:
   - `http://localhost:3001/auth/google/callback` (desenvolvimento)
   - `https://SEU-DOMINIO/auth/google/callback` (produção, quando houver)

   Precisa bater caractere por caractere com o `GOOGLE_REDIRECT_URI` do `.env` —
   barra final, `http` vs `https` e porta incluídos. Divergência aqui gera
   `redirect_uri_mismatch` na hora de autorizar.
5. Criar. Copie **ID do cliente** e **Chave secreta do cliente**.

## 7. Gerar a chave de cifragem

As credenciais dos membros ficam cifradas no banco. Gere uma chave de 32 bytes:

```bash
openssl rand -base64 32
```

Guarde o resultado. Perder essa chave invalida todos os vínculos já criados
(cada membro precisa ligar a conta de novo); trocá-la tem o mesmo efeito.
Nunca a comite.

## 8. Preencher o `.env`

Na raiz do projeto, no `.env`:

```
GOOGLE_CLIENT_ID=<ID do cliente do passo 6>
GOOGLE_CLIENT_SECRET=<Chave secreta do passo 6>
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
GOOGLE_TOKEN_ENC_KEY=<saída do openssl do passo 7>
GOOGLE_OAUTH_SCOPES=openid email https://www.googleapis.com/auth/calendar.app.created
DEFAULT_TIMEZONE=America/Sao_Paulo
```

Reinicie o server. Sem essas variáveis a integração fica desligada e a linha
"Google Agenda" não aparece na sidebar do grupo — o resto do app funciona
normalmente.

## 9. Conferir

1. `npm run dev`
2. Abra um grupo, aba Calendário. Na sidebar deve aparecer **Conectar Google
   Agenda**.
3. Clique. Autorize (passando pela tela de aviso, se o escopo for Sensitive).
4. Você deve voltar ao ArcanaForge com a sidebar mostrando **Conectada como
   seu@email.com**.
5. Em <https://calendar.google.com/> deve existir um calendário novo chamado
   **ArcanaForge**.

Se der `redirect_uri_mismatch`, revise o passo 6.4. Se voltar com erro de
`invalid_client`, revise `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.

## Cada membro da mesa

Cada pessoa faz só o passo 9 (itens 2 a 4), na própria conta. Nada de Console.
```

- [ ] **Step 2: Acrescentar as variáveis ao `.env.example`**

```
# Google Agenda (opcional — sem isso a integração fica desligada).
# Passo a passo: docs/google-agenda-setup.md
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
GOOGLE_TOKEN_ENC_KEY=
GOOGLE_OAUTH_SCOPES=openid email https://www.googleapis.com/auth/calendar.app.created
DEFAULT_TIMEZONE=America/Sao_Paulo
```

- [ ] **Step 3: Conferir que o `.env.example` não ganhou segredo de verdade**

Run: `grep -nE "GOOGLE_(CLIENT_SECRET|TOKEN_ENC_KEY)=." .env.example`
Expected: sem saída (os dois ficam vazios no exemplo)

- [ ] **Step 4: Commit**

```bash
git add docs/google-agenda-setup.md .env.example
git commit -m "docs(google): runbook do Cloud Console e variáveis de ambiente"
```

---

### Task 6: Serviço, controller e rotas do vínculo

**Files:**
- Create: `server/src/services/google/googleLink.service.js`
- Create: `server/src/controllers/google.controller.js`
- Create: `server/src/routes/google.routes.js`
- Modify: `server/src/routes/index.js`

**Interfaces:**
- Consumes: `tokenCrypto` (T1), `oauthState` (T2), `googleLink.repository` (T3), `googleApi` (T4).
- Produces (`googleLink.service.js`):
  - `isEnabled(): boolean` — `googleApi.isConfigured() && tokenCrypto.isConfigured()`
  - `startOAuth(uid, returnTo): Promise<string>` — URL de consentimento; grava o nonce e o `returnTo` validado.
  - `handleCallback({ code, state }): Promise<{ uid: string, returnTo: string }>` — lança `AppError` em falha.
  - `getLinkState(uid): Promise<{ linked, email, lastError }>`
  - `unlink(uid): Promise<void>`
  - `getAccessTokenFor(uid): Promise<{ accessToken, calendarId }|null>` — usado na Fase 2; marca link quebrado em `GoogleAuthError`.

- [ ] **Step 1: Implementar o serviço**

```js
// server/src/services/google/googleLink.service.js
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
```

- [ ] **Step 2: Implementar o controller**

```js
// server/src/controllers/google.controller.js
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function createGoogleController(googleLinkService) {
  return {
    async startOAuth(req, res) {
      res.json({ url: await googleLinkService.startOAuth(req.user.uid, req.query.returnTo) });
    },

    // Redirect de navegador: erro também volta como redirect, não como JSON.
    async callback(req, res) {
      try {
        const { returnTo } = await googleLinkService.handleCallback({
          code: req.query.code,
          state: req.query.state,
        });
        // Volta para a aba de onde a pessoa saiu: sem isso o Toast da Task 7,
        // que vive na pagina do grupo, nunca dispara.
        res.redirect(`${CLIENT_URL}${returnTo}?google=ok`);
      } catch (err) {
        const motivo = encodeURIComponent(err.message || 'erro');
        res.redirect(`${CLIENT_URL}/?google=error&reason=${motivo}`);
      }
    },

    async getLink(req, res) {
      res.json(await googleLinkService.getLinkState(req.user.uid));
    },

    async deleteLink(req, res) {
      await googleLinkService.unlink(req.user.uid);
      res.json({ ok: true });
    },
  };
}

module.exports = { createGoogleController };
```

- [ ] **Step 3: Implementar as rotas**

```js
// server/src/routes/google.routes.js
const { Router } = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const googleLinkService = require('../services/google/googleLink.service');
const { createGoogleController } = require('../controllers/google.controller');

function createGoogleRoutes() {
  const router = Router();
  const controller = createGoogleController(googleLinkService);

  // Sob /api: herdam o requireAuth global de server/index.js:73.
  router.get('/api/google/oauth/start', asyncHandler(controller.startOAuth));
  router.get('/api/google/link', asyncHandler(controller.getLink));
  router.delete('/api/google/link', asyncHandler(controller.deleteLink));

  // FORA de /api de propósito: é redirect de navegador vindo do Google, sem
  // Bearer token. Quem autentica a requisição é o state assinado.
  router.get('/auth/google/callback', asyncHandler(controller.callback));

  return router;
}

module.exports = { createGoogleRoutes };
```

- [ ] **Step 4: Registrar as rotas**

Em `server/src/routes/index.js`, adicionar o require junto aos outros e registrar **antes** do catch-all do SPA:

```js
const { createGoogleRoutes } = require('./google.routes');
```

```js
  app.use(createCombatRoutes(refs));
  app.use(createGoogleRoutes());
```

- [ ] **Step 5: Subir o server e conferir as rotas**

Run: `npm run dev` e, noutro terminal:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/google/link
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3001/auth/google/callback?state=xx"
```
Expected: `401` na primeira (requireAuth global agindo) e `302` na segunda (redirect de erro, sem exigir token). Se a segunda devolver 401, a rota entrou sob `/api` por engano.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/google/googleLink.service.js server/src/controllers/google.controller.js server/src/routes/google.routes.js server/src/routes/index.js
git commit -m "feat(google): endpoints de vínculo (start, callback, get, unlink)"
```

---

### Task 7: Vínculo na interface + checkpoint da Fase 1

**Files:**
- Create: `client/src/api/google.ts`
- Create: `client/src/components/party/GoogleCalendarLink/GoogleCalendarLink.tsx`
- Create: `client/src/components/party/GoogleCalendarLink/GoogleCalendarLink.module.css`
- Modify: `client/src/api/index.ts`
- Modify: `client/src/components/party/GroupInfoCard/GroupInfoCard.tsx`
- Modify: `client/src/pages/PartyCalendarPage/PartyCalendarPage.tsx`

**Interfaces:**
- Consumes: endpoints da Task 6.
- Produces:
  - `interface GoogleLinkState { linked: boolean; email: string; lastError: string | null }`
  - `apiGetGoogleLink(): Promise<GoogleLinkState>`
  - `apiStartGoogleOAuth(returnTo: string): Promise<{ url: string }>`
  - `apiUnlinkGoogle(): Promise<void>`
  - Componente `<GoogleCalendarLink />` (sem props).

- [ ] **Step 1: Criar o cliente HTTP**

```ts
// client/src/api/google.ts
import { apiFetch, assertOk } from './http';

export interface GoogleLinkState {
  linked: boolean;
  email: string;
  lastError: string | null;
}

export async function apiGetGoogleLink(): Promise<GoogleLinkState> {
  const res = await apiFetch('/api/google/link');
  await assertOk(res);
  return res.json();
}

export async function apiStartGoogleOAuth(returnTo: string): Promise<{ url: string }> {
  const res = await apiFetch(`/api/google/oauth/start?returnTo=${encodeURIComponent(returnTo)}`);
  await assertOk(res);
  return res.json();
}

export async function apiUnlinkGoogle(): Promise<void> {
  const res = await apiFetch('/api/google/link', { method: 'DELETE' });
  await assertOk(res);
}
```

Em `client/src/api/index.ts`, acrescentar:

```ts
export { apiGetGoogleLink, apiStartGoogleOAuth, apiUnlinkGoogle } from './google';
export type { GoogleLinkState } from './google';
```

- [ ] **Step 2: Criar o componente**

```tsx
// client/src/components/party/GoogleCalendarLink/GoogleCalendarLink.tsx
import { useEffect, useState } from 'react';
import { CalendarCheck, TriangleAlert } from 'lucide-react';
import { apiGetGoogleLink, apiStartGoogleOAuth, apiUnlinkGoogle } from '../../../api';
import type { GoogleLinkState } from '../../../api';
import styles from './GoogleCalendarLink.module.css';

export default function GoogleCalendarLink() {
  const [state, setState] = useState<GoogleLinkState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelado = false;
    apiGetGoogleLink()
      .then((s) => {
        if (!cancelado) setState(s);
      })
      // 503 = integração não configurada no server: a linha simplesmente não aparece.
      .catch(() => {
        if (!cancelado) setState(null);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (!state) return null;

  const conectar = async () => {
    setBusy(true);
    try {
      // Para o callback devolver o navegador nesta mesma aba do grupo.
      const { url } = await apiStartGoogleOAuth(window.location.pathname);
      window.location.href = url;
    } catch {
      setBusy(false);
    }
  };

  const desconectar = async () => {
    setBusy(true);
    try {
      await apiUnlinkGoogle();
      setState({ linked: false, email: '', lastError: null });
    } finally {
      setBusy(false);
    }
  };

  const quebrado = state.linked && state.lastError != null;

  return (
    <div className={styles.box}>
      <span className={styles.label}>Google Agenda</span>

      {quebrado && (
        <p className={styles.warn}>
          <TriangleAlert size={13} />
          Conexão expirou — religue para voltar a receber as sessões.
        </p>
      )}

      {state.linked && !quebrado && (
        <p className={styles.ok}>
          <CalendarCheck size={13} />
          Conectada como {state.email || 'sua conta'}
        </p>
      )}

      {state.linked ? (
        <div className={styles.actions}>
          {quebrado && (
            <button type="button" className={styles.primary} onClick={conectar} disabled={busy}>
              Religar
            </button>
          )}
          <button type="button" className={styles.link} onClick={desconectar} disabled={busy}>
            Desconectar
          </button>
        </div>
      ) : (
        <button type="button" className={styles.primary} onClick={conectar} disabled={busy}>
          Conectar Google Agenda
        </button>
      )}
    </div>
  );
}
```

```css
/* client/src/components/party/GoogleCalendarLink/GoogleCalendarLink.module.css */
.box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px solid var(--border);
}

.label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.ok,
.warn {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.35;
}

.ok {
  color: var(--text-secondary);
  word-break: break-all;
}

.warn {
  color: var(--warn);
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.primary {
  align-self: flex-start;
  background: transparent;
  border: 1px solid var(--line-2);
  border-radius: var(--radius-sm);
  color: var(--accent-ink);
  font-family: var(--font);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 5px 10px;
  cursor: pointer;
}

.primary:hover:not(:disabled) {
  border-color: var(--accent);
}

.link {
  background: transparent;
  border: none;
  padding: 0;
  color: var(--text-muted);
  font-family: var(--font);
  font-size: 0.72rem;
  text-decoration: underline;
  cursor: pointer;
}

.link:hover:not(:disabled) {
  color: var(--danger);
}

.primary:disabled,
.link:disabled {
  opacity: 0.5;
  cursor: default;
}
```

- [ ] **Step 3: Incluir na sidebar**

Em `GroupInfoCard.tsx`, importar e renderizar ao final do `<aside>`, depois do bloco do código de convite. Aparece para **todo membro**, sem checar `isOwner`:

```tsx
import GoogleCalendarLink from '../GoogleCalendarLink/GoogleCalendarLink';
```

```tsx
      <GoogleCalendarLink />
    </aside>
```

- [ ] **Step 4: Mostrar o retorno do OAuth**

Em `PartyCalendarPage.tsx`, adicionar o import e o efeito que lê o query param e limpa a URL:

```tsx
import { showToast } from '../../services/toastService';
```

```tsx
  // Retorno do consentimento do Google: avisa e limpa a URL para o aviso não
  // reaparecer a cada re-render ou refresh.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('google');
    if (!status) return;
    showToast(
      status === 'ok'
        ? 'Google Agenda conectada.'
        : `Não foi possível conectar: ${params.get('reason') || 'erro'}`,
      status === 'ok' ? 'info' : 'default',
    );
    window.history.replaceState({}, '', window.location.pathname);
  }, []);
```

- [ ] **Step 5: Verificar tipos, lint e testes**

Run:
```bash
cd client && npx tsc -b && npx eslint src/api/google.ts src/components/party/GoogleCalendarLink src/components/party/GroupInfoCard src/pages/PartyCalendarPage && npx vitest run
```
Expected: `tsc` exit 0, eslint sem apontamento nos arquivos listados, todos os testes passando.

- [ ] **Step 6: CHECKPOINT — verificação manual da Fase 1**

Pré-requisito: `docs/google-agenda-setup.md` (Task 5) executado e `.env` preenchido.

1. `npm run dev`
2. Abrir um grupo → aba Calendário. A sidebar mostra **Conectar Google Agenda**.
3. Clicar, autorizar no Google.
4. Voltar ao app: Toast "Google Agenda conectada" e a sidebar mostrando **Conectada como \<e-mail\>**.
5. Em <https://calendar.google.com/>, existe um calendário chamado **ArcanaForge**.
6. Clicar em **Desconectar**: a sidebar volta para "Conectar Google Agenda". Em
   <https://myaccount.google.com/permissions>, o ArcanaForge não aparece mais.
7. Recarregar a página com `?google=error&reason=teste` na URL: aparece o Toast de erro e a URL é limpa.

Se qualquer item falhar, resolver antes de seguir para a Fase 2 — a Fase 2 depende de um vínculo funcional.

- [ ] **Step 7: Commit**

```bash
git add client/src/api/google.ts client/src/api/index.ts client/src/components/party/GoogleCalendarLink client/src/components/party/GroupInfoCard/GroupInfoCard.tsx client/src/pages/PartyCalendarPage/PartyCalendarPage.tsx
git commit -m "feat(google): vínculo da conta na sidebar do grupo"
```

---

### Task 8: Fuso e eventos no modelo da proposta

**Files:**
- Modify: `server/db/models/Party.js`
- Modify: `server/src/services/party.service.js` (só `proposeSession`)
- Modify: `client/src/types/party.ts`
- Modify: `client/src/api/parties.ts` (só `apiProposeSession`)
- Modify: `client/src/components/party/ProposeSessionModal/ProposeSessionModal.tsx`
- Modify: `client/src/components/party/ProposalList/ProposalList.tsx`

**Interfaces:**
- Consumes: nada das tasks anteriores.
- Produces:
  - Schema: `sessionProposalSchema.timezone: String` e `sessionProposalSchema.googleEvents: [{ uid, eventId, calendarId, createdAt }]`.
  - TS: `SessionProposal.timezone?: string`, `SessionProposal.googleEvents?: GoogleEventRef[]` com `interface GoogleEventRef { uid: string; eventId: string; calendarId: string }`.
  - `apiProposeSession(partyId, { date, time?, timezone? })`.

- [ ] **Step 1: Estender o schema**

Em `server/db/models/Party.js`, antes de `sessionProposalSchema`:

```js
const googleEventRefSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    eventId: { type: String, required: true },
    calendarId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);
```

E dentro de `sessionProposalSchema`, junto dos campos existentes:

```js
    timezone: { type: String, default: '' }, // IANA; '' cai no DEFAULT_TIMEZONE
    googleEvents: { type: [googleEventRefSchema], default: [] },
```

- [ ] **Step 2: Aceitar o fuso ao propor**

Em `proposeSession` (`server/src/services/party.service.js`), depois da validação de `time`:

```js
    const { timezone } = body || {};
    if (timezone && (typeof timezone !== 'string' || timezone.length > 64)) {
      throw new AppError(400, 'timezone inválido');
    }
```

E no objeto `proposal`, junto de `time`:

```js
      timezone: timezone || '',
      googleEvents: [],
```

- [ ] **Step 3: Atualizar os tipos do cliente**

Em `client/src/types/party.ts`:

```ts
export interface GoogleEventRef {
  uid: string;
  eventId: string;
  calendarId: string;
}
```

E dentro de `SessionProposal`:

```ts
  timezone?: string;
  googleEvents?: GoogleEventRef[];
```

- [ ] **Step 4: Enviar o fuso do navegador**

Em `client/src/api/parties.ts`, alterar a assinatura de `apiProposeSession` para aceitar `timezone` e mandá-lo no body. Nos dois lugares que propõem (`ProposeSessionModal.tsx` e `ProposalList.tsx`), passar:

```ts
timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
```

O caminho mais limpo é o próprio `apiProposeSession` preencher o padrão, para não repetir a expressão em dois componentes:

```ts
export async function apiProposeSession(
  partyId: string,
  data: { date: string; time?: string; timezone?: string },
): Promise<Party> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      // Fixa o instante absoluto da sessão: sem isso o evento no Google pode
      // cair em UTC e aparecer com horas de diferença.
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  await assertOk(res);
  return res.json();
}
```

Com isso, `ProposeSessionModal.tsx` e `ProposalList.tsx` **não precisam de alteração** — só confirme que continuam chamando `onPropose(date, time)` e que `PartyCalendarPage.handlePropose` repassa para `apiProposeSession` sem tocar em `timezone`.

- [ ] **Step 5: Verificar tipos e testes**

Run: `cd client && npx tsc -b && npx vitest run`
Expected: exit 0 e 257+ testes passando

- [ ] **Step 6: Conferir que o fuso chega ao banco**

Run: `npm run dev`, propor uma data pela UI, e então:
```bash
node -e "require('dotenv').config();const m=require('mongoose');(async()=>{await m.connect(process.env.MONGODB_URI);const P=require('./server/db/models/Party');const p=await P.findOne({'sessionProposals.0':{\$exists:true}}).lean();console.log(p.sessionProposals.at(-1));await m.disconnect()})()"
```
Expected: o objeto impresso tem `timezone: 'America/Sao_Paulo'` (ou o fuso do seu navegador) e `googleEvents: []`

- [ ] **Step 7: Commit**

```bash
git add server/db/models/Party.js server/src/services/party.service.js client/src/types/party.ts client/src/api/parties.ts
git commit -m "feat(google): fuso horário e referências de evento na proposta"
```

---

### Task 9: Corpo do evento

**Files:**
- Create: `server/src/services/google/eventBody.js`
- Test: `server/src/services/google/eventBody.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `SESSION_DURATION_HOURS = 4`
  - `buildEventBody({ partyName, proposal, calendarUrl, defaultTimezone }): Object`

- [ ] **Step 1: Escrever os testes que falham**

```js
// server/src/services/google/eventBody.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildEventBody, SESSION_DURATION_HOURS } = require('./eventBody');

const base = {
  partyName: 'Culto ao Nicolas Cage',
  calendarUrl: 'http://localhost:5173/tormenta/party/p1/calendar',
  defaultTimezone: 'America/Sao_Paulo',
};

describe('buildEventBody', () => {
  it('usa dateTime e timeZone quando a proposta tem horário', () => {
    const body = buildEventBody({
      ...base,
      proposal: { date: '2026-09-03', time: '19:00', timezone: 'America/Sao_Paulo' },
    });
    assert.equal(body.start.dateTime, '2026-09-03T19:00:00');
    assert.equal(body.start.timeZone, 'America/Sao_Paulo');
    assert.equal(body.end.dateTime, '2026-09-03T23:00:00');
    assert.equal(body.end.timeZone, 'America/Sao_Paulo');
  });

  it('atravessa a meia-noite somando a duração', () => {
    const body = buildEventBody({
      ...base,
      proposal: { date: '2026-09-03', time: '22:00', timezone: 'America/Sao_Paulo' },
    });
    assert.equal(body.end.dateTime, '2026-09-04T02:00:00');
  });

  it('usa date com fim no dia seguinte quando não há horário', () => {
    const body = buildEventBody({ ...base, proposal: { date: '2026-09-03', time: '' } });
    assert.equal(body.start.date, '2026-09-03');
    assert.equal(body.end.date, '2026-09-04');
    assert.equal(body.start.dateTime, undefined);
  });

  it('cai no fuso padrão quando a proposta não tem fuso', () => {
    const body = buildEventBody({
      ...base,
      proposal: { date: '2026-09-03', time: '19:00', timezone: '' },
    });
    assert.equal(body.start.timeZone, 'America/Sao_Paulo');
  });

  it('nunca inclui attendees nem organizer', () => {
    const body = buildEventBody({
      ...base,
      proposal: { date: '2026-09-03', time: '19:00', timezone: 'America/Sao_Paulo' },
    });
    assert.equal(body.attendees, undefined);
    assert.equal(body.organizer, undefined);
  });

  it('põe o nome do grupo no título e o link na descrição', () => {
    const body = buildEventBody({ ...base, proposal: { date: '2026-09-03', time: '' } });
    assert.match(body.summary, /Culto ao Nicolas Cage/);
    assert.match(body.description, /localhost:5173/);
  });

  it('a duração padrão é 4 horas', () => {
    assert.equal(SESSION_DURATION_HOURS, 4);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node --test server/src/services/google/eventBody.test.js`
Expected: FAIL — `Cannot find module './eventBody'`

- [ ] **Step 3: Implementar o mínimo**

```js
// server/src/services/google/eventBody.js

// Não existe campo de duração na proposta; 4h é a duração típica de uma sessão
// de mesa. Trocar aqui muda todos os eventos futuros.
const SESSION_DURATION_HOURS = 4;

/** 'YYYY-MM-DD' + dias, em aritmética de calendário local (sem fuso). */
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Soma horas a date+time, devolvendo 'YYYY-MM-DDTHH:mm:00' sem fuso. */
function addHours(dateStr, timeStr, hours) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm));
  dt.setUTCHours(dt.getUTCHours() + hours);
  return `${dt.toISOString().slice(0, 16)}:00`;
}

/**
 * Corpo do evento do Google. Sem `attendees` e sem `organizer`: cada evento é um
 * compromisso próprio na agenda de uma pessoa, e o app nunca convida ninguém.
 * O `timeZone` é o da proposta (não o de cada membro) porque é ele que fixa o
 * instante absoluto — o Google já exibe no fuso local de quem olha.
 */
function buildEventBody({ partyName, proposal, calendarUrl, defaultTimezone }) {
  const body = {
    summary: `Sessão: ${partyName}`,
    description: `Confirmada no ArcanaForge: ${calendarUrl}`,
  };

  if (proposal.time) {
    const timeZone = proposal.timezone || defaultTimezone;
    body.start = { dateTime: `${proposal.date}T${proposal.time}:00`, timeZone };
    body.end = {
      dateTime: addHours(proposal.date, proposal.time, SESSION_DURATION_HOURS),
      timeZone,
    };
  } else {
    // Fim exclusivo na API do Google: mesma data criaria evento de duração zero.
    body.start = { date: proposal.date };
    body.end = { date: addDays(proposal.date, 1) };
  }

  return body;
}

module.exports = { buildEventBody, SESSION_DURATION_HOURS };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node --test server/src/services/google/eventBody.test.js`
Expected: PASS — 7 testes

- [ ] **Step 5: Commit**

```bash
git add server/src/services/google/eventBody.js server/src/services/google/eventBody.test.js
git commit -m "feat(google): corpo do evento (com horário, dia inteiro, sem attendees)"
```

---

### Task 10: Plano de sincronização

**Files:**
- Create: `server/src/services/google/syncPlan.js`
- Test: `server/src/services/google/syncPlan.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `isConfirmed(party, proposal): boolean` — todos os membros votaram 'sim'.
  - `planSync({ prevConfirmed, nextConfirmed, proposalRemoved, healthyUids, existingEvents }): { toCreate: string[], toDelete: Array<{uid,eventId,calendarId}> }`

- [ ] **Step 1: Escrever os testes que falham**

```js
// server/src/services/google/syncPlan.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isConfirmed, planSync } = require('./syncPlan');

const party = (votes) => ({
  members: [{ uid: 'a' }, { uid: 'b' }],
  sessionProposals: [],
  ...votes,
});

describe('isConfirmed', () => {
  it('confirma quando todos votaram sim', () => {
    const p = { responses: [{ uid: 'a', vote: 'sim' }, { uid: 'b', vote: 'sim' }] };
    assert.equal(isConfirmed(party(), p), true);
  });

  it('não confirma com voto pendente', () => {
    assert.equal(isConfirmed(party(), { responses: [{ uid: 'a', vote: 'sim' }] }), false);
  });

  it('não confirma com recusa', () => {
    const p = { responses: [{ uid: 'a', vote: 'sim' }, { uid: 'b', vote: 'nao' }] };
    assert.equal(isConfirmed(party(), p), false);
  });

  it('não confirma grupo sem membros', () => {
    assert.equal(isConfirmed({ members: [] }, { responses: [] }), false);
  });
});

describe('planSync', () => {
  const evento = (uid) => ({ uid, eventId: `ev-${uid}`, calendarId: `cal-${uid}` });

  it('cria para cada uid saudável quando cruza para confirmada', () => {
    const plano = planSync({
      prevConfirmed: false,
      nextConfirmed: true,
      proposalRemoved: false,
      healthyUids: ['a', 'b'],
      existingEvents: [],
    });
    assert.deepEqual(plano.toCreate, ['a', 'b']);
    assert.deepEqual(plano.toDelete, []);
  });

  it('não recria para quem já tem evento (idempotência por uid)', () => {
    const plano = planSync({
      prevConfirmed: false,
      nextConfirmed: true,
      proposalRemoved: false,
      healthyUids: ['a', 'b'],
      existingEvents: [evento('a')],
    });
    assert.deepEqual(plano.toCreate, ['b']);
  });

  it('não faz nada quando segue confirmada', () => {
    const plano = planSync({
      prevConfirmed: true,
      nextConfirmed: true,
      proposalRemoved: false,
      healthyUids: ['a'],
      existingEvents: [evento('a')],
    });
    assert.deepEqual(plano.toCreate, []);
    assert.deepEqual(plano.toDelete, []);
  });

  it('apaga tudo quando deixa de estar confirmada', () => {
    const plano = planSync({
      prevConfirmed: true,
      nextConfirmed: false,
      proposalRemoved: false,
      healthyUids: ['a', 'b'],
      existingEvents: [evento('a'), evento('b')],
    });
    assert.deepEqual(plano.toCreate, []);
    assert.deepEqual(plano.toDelete.map((e) => e.uid), ['a', 'b']);
  });

  it('apaga tudo quando a proposta é cancelada, mesmo seguindo confirmada', () => {
    const plano = planSync({
      prevConfirmed: true,
      nextConfirmed: true,
      proposalRemoved: true,
      healthyUids: ['a'],
      existingEvents: [evento('a')],
    });
    assert.deepEqual(plano.toDelete.map((e) => e.uid), ['a']);
    assert.deepEqual(plano.toCreate, []);
  });

  it('não faz nada quando nunca esteve confirmada', () => {
    const plano = planSync({
      prevConfirmed: false,
      nextConfirmed: false,
      proposalRemoved: false,
      healthyUids: ['a'],
      existingEvents: [],
    });
    assert.deepEqual(plano.toCreate, []);
    assert.deepEqual(plano.toDelete, []);
  });

  it('apaga evento de quem já não tem link saudável', () => {
    const plano = planSync({
      prevConfirmed: true,
      nextConfirmed: false,
      proposalRemoved: false,
      healthyUids: [],
      existingEvents: [evento('a')],
    });
    assert.deepEqual(plano.toDelete.map((e) => e.uid), ['a']);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node --test server/src/services/google/syncPlan.test.js`
Expected: FAIL — `Cannot find module './syncPlan'`

- [ ] **Step 3: Implementar o mínimo**

```js
// server/src/services/google/syncPlan.js

/**
 * Confirmada = todo membro do grupo votou 'sim'. Mesma regra do
 * getProposalStatus do cliente, reimplementada aqui porque o server não
 * compartilha código com o client.
 */
function isConfirmed(party, proposal) {
  const membros = party.members || [];
  if (membros.length === 0) return false;
  const respostas = proposal.responses || [];
  return membros.every((m) => respostas.some((r) => r.uid === m.uid && r.vote === 'sim'));
}

/**
 * Decide, sem tocar em rede, o que criar e o que apagar.
 * `toDelete` sai de `existingEvents` (e não dos membros atuais) porque o evento
 * precisa ser removido mesmo de quem perdeu o vínculo no meio do caminho.
 */
function planSync({ prevConfirmed, nextConfirmed, proposalRemoved, healthyUids, existingEvents }) {
  const eventos = existingEvents || [];

  if (proposalRemoved || (prevConfirmed && !nextConfirmed)) {
    return { toCreate: [], toDelete: eventos.map(({ uid, eventId, calendarId }) => ({ uid, eventId, calendarId })) };
  }

  if (!prevConfirmed && nextConfirmed) {
    const jaTem = new Set(eventos.map((e) => e.uid));
    return { toCreate: (healthyUids || []).filter((uid) => !jaTem.has(uid)), toDelete: [] };
  }

  return { toCreate: [], toDelete: [] };
}

module.exports = { isConfirmed, planSync };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node --test server/src/services/google/syncPlan.test.js`
Expected: PASS — 12 testes

- [ ] **Step 5: Commit**

```bash
git add server/src/services/google/syncPlan.js server/src/services/google/syncPlan.test.js
git commit -m "feat(google): plano de sincronização (transições e idempotência)"
```

---

### Task 11: Executor da sincronização

**Files:**
- Create: `server/src/services/google/calendarSync.js`

**Interfaces:**
- Consumes: `googleLink.service` (T6), `googleApi` (T4), `eventBody` (T9), `syncPlan` (T10), `googleLink.repository` e `party.repository.updateProposalGoogleEvents` (T3).
- Produces:
  - `syncProposal({ party, proposal, prevConfirmed, proposalRemoved, eventsBefore }): Promise<void>` — nunca lança; loga e marca `lastError` quando aplicável.

Sem teste unitário próprio: é a cola entre módulos já testados e a rede. A verificação é o checkpoint da Task 13.

- [ ] **Step 1: Implementar o módulo**

```js
// server/src/services/google/calendarSync.js
const partyRepository = require('../../repositories/party.repository');
const repo = require('../../repositories/googleLink.repository');
const googleApi = require('./googleApi');
const googleLinkService = require('./googleLink.service');
const { buildEventBody } = require('./eventBody');
const { isConfirmed, planSync } = require('./syncPlan');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function calendarUrl(party) {
  return `${CLIENT_URL}/${party.system || 'tormenta'}/party/${party._id}/calendar`;
}

/** Persiste a lista de eventos da proposta. Via repository: no repo, service
 *  nunca requer model direto. */
async function saveEvents(partyId, proposalId, googleEvents) {
  await partyRepository.updateProposalGoogleEvents(partyId, proposalId, googleEvents);
}

async function criarPara(uid, party, proposal) {
  const token = await googleLinkService.getAccessTokenFor(uid);
  if (!token) return null;
  const body = buildEventBody({
    partyName: party.name,
    proposal,
    calendarUrl: calendarUrl(party),
    defaultTimezone: googleLinkService.defaultTimezone(),
  });
  try {
    const eventId = await googleApi.insertEvent(token.accessToken, token.calendarId, body);
    return { uid, eventId, calendarId: token.calendarId, createdAt: new Date() };
  } catch (err) {
    if (err instanceof googleApi.GoogleAuthError) {
      await repo.setLastError(uid, err.message);
      return null;
    }
    throw err;
  }
}

async function apagarPara({ uid, eventId, calendarId }) {
  const token = await googleLinkService.getAccessTokenFor(uid);
  if (!token) return;
  try {
    await googleApi.deleteEvent(token.accessToken, calendarId, eventId);
  } catch (err) {
    if (err instanceof googleApi.GoogleAuthError) {
      await repo.setLastError(uid, err.message);
      return;
    }
    throw err;
  }
}

/**
 * Efeito colateral de votar/cancelar. Nunca lança: votar não pode falhar porque
 * o Google está fora do ar. Cada membro é independente — allSettled garante que
 * a falha de um não impeça os outros.
 */
async function syncProposal({ party, proposal, prevConfirmed, proposalRemoved, eventsBefore }) {
  try {
    if (!googleLinkService.isEnabled()) return;

    const uids = (party.members || []).map((m) => m.uid);
    const saudaveis = await repo.findHealthyByUids(uids);
    const healthyUids = saudaveis.map((l) => l._id);

    const plano = planSync({
      prevConfirmed,
      nextConfirmed: proposalRemoved ? prevConfirmed : isConfirmed(party, proposal),
      proposalRemoved,
      healthyUids,
      existingEvents: eventsBefore || [],
    });

    if (plano.toDelete.length > 0) {
      await Promise.allSettled(plano.toDelete.map(apagarPara));
      if (!proposalRemoved) await saveEvents(party._id, proposal.id, []);
      return;
    }

    if (plano.toCreate.length === 0) return;

    const resultados = await Promise.allSettled(
      plano.toCreate.map((uid) => criarPara(uid, party, proposal)),
    );
    const criados = resultados
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value);

    if (criados.length > 0) {
      await saveEvents(party._id, proposal.id, [...(eventsBefore || []), ...criados]);
    }
  } catch (err) {
    console.error('Falha ao sincronizar Google Agenda:', err.message);
  }
}

module.exports = { syncProposal };
```

- [ ] **Step 2: Confirmar que carrega**

Run: `node -e "require('./server/src/services/google/calendarSync'); console.log('ok')"`
Expected: imprime `ok`

- [ ] **Step 3: Commit**

```bash
git add server/src/services/google/calendarSync.js
git commit -m "feat(google): executor da sincronização com fan-out por membro"
```

---

### Task 12: Gatilho no fluxo de votação e backfill

**Files:**
- Modify: `server/src/services/party.service.js` (`respondToSession`, `cancelSession`)
- Create: `server/src/services/google/backfill.js`
- Test: `server/src/services/google/backfill.test.js`
- Modify: `server/src/services/google/googleLink.service.js` (chamar o backfill no callback)

**Interfaces:**
- Consumes: `calendarSync` (T11), `syncPlan` (T10).
- Produces:
  - `selectBackfillTargets({ parties, uid, today }): Array<{ party, proposal }>` — puro.
  - `backfillForUid(uid): Promise<void>` — impuro, nunca lança.

- [ ] **Step 1: Ligar o gatilho em `respondToSession`**

Adicionar o require no topo de `party.service.js`:

```js
const { syncProposal } = require('./google/calendarSync');
const { isConfirmed } = require('./google/syncPlan');
```

Em `respondToSession`, capturar o estado **antes** de gravar e disparar depois:

```js
    const prevConfirmed = isConfirmed(party, proposal);
    const eventsBefore = (proposal.googleEvents || []).map((e) => ({
      uid: e.uid,
      eventId: e.eventId,
      calendarId: e.calendarId,
    }));

    // ... código existente que grava o voto ...
    await party.save();
    refs.broadcastPartyRoster(partyId);

    // Fire-and-forget: votar nunca falha porque o Google está fora do ar.
    syncProposal({
      party: party.toObject(),
      proposal: party.sessionProposals.find((p) => p.id === proposalId),
      prevConfirmed,
      proposalRemoved: false,
      eventsBefore,
    }).catch((err) => console.error('Falha ao sincronizar Google Agenda:', err.message));

    return toPartyDTO(party.toObject());
```

- [ ] **Step 2: Ligar o gatilho em `cancelSession`**

A ordem importa: `googleEvents` tem que ser lido **antes** do `save()` que remove a proposta.

```js
    const prevConfirmed = isConfirmed(party, proposal);
    const eventsBefore = (proposal.googleEvents || []).map((e) => ({
      uid: e.uid,
      eventId: e.eventId,
      calendarId: e.calendarId,
    }));
    const snapshot = party.toObject();

    party.sessionProposals = party.sessionProposals.filter((p) => p.id !== proposalId);
    await party.save();
    refs.broadcastPartyRoster(partyId);

    const proposalSnapshot = typeof proposal.toObject === 'function' ? proposal.toObject() : proposal;

    syncProposal({
      party: snapshot,
      proposal: proposalSnapshot,
      prevConfirmed,
      proposalRemoved: true,
      eventsBefore,
    }).catch((err) => console.error('Falha ao sincronizar Google Agenda:', err.message));

    return toPartyDTO(party.toObject());
```

- [ ] **Step 3: Escrever os testes do backfill que falham**

```js
// server/src/services/google/backfill.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { selectBackfillTargets } = require('./backfill');

const HOJE = '2026-09-03';

const party = (proposals) => ({
  _id: 'p1',
  name: 'Grupo',
  members: [{ uid: 'a' }, { uid: 'b' }],
  sessionProposals: proposals,
});

const confirmada = (date, extra = {}) => ({
  id: `prop-${date}`,
  date,
  time: '19:00',
  responses: [{ uid: 'a', vote: 'sim' }, { uid: 'b', vote: 'sim' }],
  googleEvents: [],
  ...extra,
});

describe('selectBackfillTargets', () => {
  it('pega proposta confirmada e futura', () => {
    const alvos = selectBackfillTargets({ parties: [party([confirmada('2026-09-10')])], uid: 'a', today: HOJE });
    assert.equal(alvos.length, 1);
    assert.equal(alvos[0].proposal.date, '2026-09-10');
  });

  it('pega proposta confirmada de hoje', () => {
    const alvos = selectBackfillTargets({ parties: [party([confirmada(HOJE)])], uid: 'a', today: HOJE });
    assert.equal(alvos.length, 1);
  });

  it('ignora proposta confirmada no passado', () => {
    const alvos = selectBackfillTargets({ parties: [party([confirmada('2026-08-20')])], uid: 'a', today: HOJE });
    assert.deepEqual(alvos, []);
  });

  it('ignora proposta não confirmada', () => {
    const naoConfirmada = { ...confirmada('2026-09-10'), responses: [{ uid: 'a', vote: 'sim' }] };
    const alvos = selectBackfillTargets({ parties: [party([naoConfirmada])], uid: 'a', today: HOJE });
    assert.deepEqual(alvos, []);
  });

  it('ignora proposta que já tem evento para aquele uid', () => {
    const comEvento = confirmada('2026-09-10', {
      googleEvents: [{ uid: 'a', eventId: 'ev', calendarId: 'cal' }],
    });
    assert.deepEqual(selectBackfillTargets({ parties: [party([comEvento])], uid: 'a', today: HOJE }), []);
  });

  it('ainda pega quando o evento existente é de outro membro', () => {
    const comEvento = confirmada('2026-09-10', {
      googleEvents: [{ uid: 'b', eventId: 'ev', calendarId: 'cal' }],
    });
    assert.equal(selectBackfillTargets({ parties: [party([comEvento])], uid: 'a', today: HOJE }).length, 1);
  });
});
```

- [ ] **Step 4: Rodar e confirmar que falha**

Run: `node --test server/src/services/google/backfill.test.js`
Expected: FAIL — `Cannot find module './backfill'`

- [ ] **Step 5: Implementar o backfill**

```js
// server/src/services/google/backfill.js
const partyRepository = require('../../repositories/party.repository');
const { isConfirmed } = require('./syncPlan');
const { syncProposal } = require('./calendarSync');

/**
 * Propostas que devem gerar evento para quem acabou de ligar a conta:
 * confirmadas, de hoje em diante, e sem evento ainda para aquele uid.
 * Passadas são ignoradas — encher a agenda de sessões que já aconteceram é ruído.
 */
function selectBackfillTargets({ parties, uid, today }) {
  const alvos = [];
  for (const party of parties || []) {
    for (const proposal of party.sessionProposals || []) {
      if (proposal.date < today) continue;
      if (!isConfirmed(party, proposal)) continue;
      if ((proposal.googleEvents || []).some((e) => e.uid === uid)) continue;
      alvos.push({ party, proposal });
    }
  }
  return alvos;
}

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Nunca lança: é efeito colateral do callback do OAuth. */
async function backfillForUid(uid) {
  try {
    // findVisibleToUser ja devolve lean as parties em que o uid e dono ou membro.
    const parties = await partyRepository.findVisibleToUser(uid);
    const alvos = selectBackfillTargets({ parties, uid, today: todayKey() });
    for (const { party, proposal } of alvos) {
      // prevConfirmed=false força o caminho de criação para este uid; a
      // idempotência por uid impede duplicar o evento dos outros membros.
      await syncProposal({
        party,
        proposal,
        prevConfirmed: false,
        proposalRemoved: false,
        eventsBefore: proposal.googleEvents || [],
      });
    }
  } catch (err) {
    console.error('Falha no backfill do Google Agenda:', err.message);
  }
}

module.exports = { selectBackfillTargets, backfillForUid };
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `node --test server/src/services/google/backfill.test.js`
Expected: PASS — 6 testes

- [ ] **Step 7: Disparar o backfill no callback**

Em `googleLink.service.js`, dentro de `handleCallback`, depois do `repo.upsert` e antes do `return`:

```js
  // Sem isso, quem liga a conta depois de uma confirmação não vê nada na agenda
  // e conclui que a integração não funcionou.
  require('./backfill')
    .backfillForUid(verificado.uid)
    .catch((err) => console.error('Falha no backfill:', err.message));
```

O `require` fica inline de propósito: `backfill` → `calendarSync` → `googleLink.service` fecha um ciclo, e resolvê-lo em tempo de chamada evita o módulo parcialmente carregado.

- [ ] **Step 8: Rodar a suíte inteira do server**

Run: `npm run test:server`
Expected: todos os testes passando, incluindo o `buffMerge.test.js` que já existia

- [ ] **Step 9: Commit**

```bash
git add server/src/services/party.service.js server/src/services/google/backfill.js server/src/services/google/backfill.test.js server/src/services/google/googleLink.service.js
git commit -m "feat(google): gatilho na votação/cancelamento e backfill ao ligar a conta"
```

---

### Task 13: Indicador na interface + checkpoint final

**Files:**
- Modify: `client/src/components/party/SessionAgenda/SessionAgenda.tsx`
- Modify: `client/src/components/party/SessionAgenda/SessionAgenda.module.css`
- Modify: `client/src/components/party/ProposalDetailModal/ProposalDetailModal.tsx`
- Modify: `client/src/components/party/ProposalDetailModal/ProposalDetailModal.module.css`
- Modify: `client/src/pages/PartyCalendarPage/PartyCalendarPage.tsx` (passa `uid` para `SessionAgenda`)
- Create: `client/src/utils/googleEvents.ts`
- Test: `client/src/utils/googleEvents.test.ts`

**Interfaces:**
- Consumes: `SessionProposal.googleEvents` (T8).
- Produces: `hasGoogleEventFor(proposal: SessionProposal, uid: string): boolean`

- [ ] **Step 1: Escrever os testes que falham**

```ts
// client/src/utils/googleEvents.test.ts
import { describe, it, expect } from 'vitest';
import type { SessionProposal } from '../types/party';
import { hasGoogleEventFor } from './googleEvents';

function proposal(googleEvents?: SessionProposal['googleEvents']): SessionProposal {
  return {
    id: 'p1',
    proposedBy: 'a',
    date: '2026-09-03',
    time: '19:00',
    createdAt: '2026-08-31T10:00:00.000Z',
    responses: [],
    googleEvents,
  };
}

describe('hasGoogleEventFor', () => {
  it('reconhece o evento do próprio usuário', () => {
    expect(hasGoogleEventFor(proposal([{ uid: 'a', eventId: 'e', calendarId: 'c' }]), 'a')).toBe(true);
  });

  it('não confunde evento de outro membro com o próprio', () => {
    expect(hasGoogleEventFor(proposal([{ uid: 'b', eventId: 'e', calendarId: 'c' }]), 'a')).toBe(false);
  });

  it('é falso quando não há evento nenhum', () => {
    expect(hasGoogleEventFor(proposal([]), 'a')).toBe(false);
  });

  it('é falso quando o campo não existe (proposta antiga)', () => {
    expect(hasGoogleEventFor(proposal(undefined), 'a')).toBe(false);
  });

  it('é falso com uid vazio', () => {
    expect(hasGoogleEventFor(proposal([{ uid: 'a', eventId: 'e', calendarId: 'c' }]), '')).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd client && npx vitest run src/utils/googleEvents.test.ts`
Expected: FAIL — não resolve `./googleEvents`

- [ ] **Step 3: Implementar o mínimo**

```ts
// client/src/utils/googleEvents.ts
import type { SessionProposal } from '../types/party';

/**
 * A proposta já gerou evento na agenda DESTE usuário. Deliberadamente pessoal:
 * o indicador diz "na sua agenda" e não mostra o estado dos outros membros.
 */
export function hasGoogleEventFor(proposal: SessionProposal, uid: string): boolean {
  if (!uid) return false;
  return (proposal.googleEvents || []).some((e) => e.uid === uid);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd client && npx vitest run src/utils/googleEvents.test.ts`
Expected: PASS — 5 testes

- [ ] **Step 5: Indicador no bloco da agenda**

`SessionAgenda` precisa do uid. Adicionar `uid: string` às props (`PartyCalendarPage` já tem o valor e passa `uid={uid}`), e no `renderBlock`:

```tsx
import { CalendarCheck } from 'lucide-react';
import { hasGoogleEventFor } from '../../../utils/googleEvents';
```

```tsx
      {proposal.time && <span className={styles.blockTime}>{proposal.time}</span>}
      <span className={styles.blockLabel}>
        Sessão
        {hasGoogleEventFor(proposal, uid) && (
          <CalendarCheck size={10} className={styles.blockSynced} aria-label="Na sua Google Agenda" />
        )}
      </span>
```

```css
.blockSynced {
  margin-left: 3px;
  vertical-align: -1px;
  opacity: 0.85;
}
```

- [ ] **Step 6: Indicador na modal de detalhes**

Em `ProposalDetailModal.tsx`, depois do bloco `.header`:

```tsx
import { CalendarCheck } from 'lucide-react';
import { hasGoogleEventFor } from '../../../utils/googleEvents';
```

```tsx
        {hasGoogleEventFor(proposal, uid) && (
          <p className={styles.synced}>
            <CalendarCheck size={13} />
            Na sua Google Agenda
          </p>
        )}
```

```css
.synced {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-size: 0.76rem;
  color: var(--ok-ink);
}
```

- [ ] **Step 7: Verificar tipos, lint e suíte do client**

Run:
```bash
cd client && npx tsc -b && npx eslint src/utils/googleEvents.ts src/components/party src/pages/PartyCalendarPage && npx vitest run
```
Expected: `tsc` exit 0, eslint sem apontamento nos caminhos listados, todos os testes passando

- [ ] **Step 8: CHECKPOINT — verificação manual de ponta a ponta**

Pré-requisito: pelo menos duas contas de membro do mesmo grupo com a conta Google ligada. Se só houver uma, os itens 3 e 6 valem para essa uma.

1. `npm run dev`. Propor uma data futura com horário.
2. Votar "sim" com todos os membros até a proposta ficar verde.
3. Em <https://calendar.google.com/>, o evento **Sessão: \<grupo\>** aparece no calendário **ArcanaForge**, no dia e hora certos, **sem convidados**.
4. Na UI, o bloco confirmado e a modal mostram "Na sua Google Agenda".
5. Trocar um voto para "não posso": o evento desaparece do Google e o indicador sai da UI.
6. Votar "sim" de novo: o evento volta (id novo).
7. Cancelar a proposta confirmada: o evento desaparece do Google.
8. Propor e confirmar uma data **sem horário**: o evento aparece como dia inteiro, num único dia.
9. Backfill: desconectar a conta, confirmar uma proposta futura com os outros membros, reconectar. O evento deve aparecer na agenda logo após reconectar.
10. Link quebrado: em <https://myaccount.google.com/permissions>, remover o acesso do ArcanaForge. Confirmar uma proposta nova e recarregar a página do grupo: a sidebar deve mostrar "Conexão expirou — religue…".

- [ ] **Step 9: Commit**

```bash
git add client/src/utils/googleEvents.ts client/src/utils/googleEvents.test.ts client/src/components/party/SessionAgenda client/src/components/party/ProposalDetailModal client/src/pages/PartyCalendarPage/PartyCalendarPage.tsx
git commit -m "feat(google): indicador 'na sua Google Agenda' na agenda e na modal"
```

---

## Cobertura da spec

| Secção da spec | Task |
|---|---|
| 1.1 `googleLinks` | 3 |
| 1.2 `googleOauthStates` | 3 |
| 1.3 `timezone` + `googleEvents` | 8 |
| 2.1 início do OAuth | 4 (`buildConsentUrl`), 6 (`startOAuth`) |
| 2.2 callback, HMAC, HKDF, nonce de uso único | 1, 2, 6 |
| 2.3 uso e renovação | 6 (`getAccessTokenFor`) |
| 2.4 desconectar | 6 (`unlink`) |
| 3.1 gatilho e quem recebe | 11, 12 |
| 3.2 transições | 10 |
| 3.3 corpo do evento | 9 |
| 3.4 backfill | 12 |
| 4 fuso horário | 8, 9 |
| 5 endpoints | 6 |
| 6 UI (sidebar, indicador, toast) | 7, 13 |
| 7 degradação e erros | 6 (`isEnabled`), 11 (`allSettled`, `setLastError`) |
| 10 testes | 1, 2, 9, 10, 12, 13 |
| 11 configuração | 5 |

## Fora deste plano, de propósito

- `openapi.yaml` não é atualizado nas tasks. A spec pede; ficou de fora porque o arquivo não é gerado nem validado em CI, e mexer nele não tem verificação associada. **Fazer junto da Task 6** se quiser manter o contrato em dia.
- Verificação do app no Google (remove a tela de aviso). Configuração, não código.
