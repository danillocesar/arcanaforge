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

/**
 * Classifica erros do endpoint de token.
 * Retorna 'auth' se é falha de credencial por-usuário (só invalid_grant).
 * Retorna 'other' para erros de config ou requisição.
 */
function classifyTokenError(status, body) {
  if (body && body.error === 'invalid_grant') {
    return 'auth';
  }
  return 'other';
}

/**
 * Classifica erros da API do Google Calendar.
 * 401 → 'auth' (credencial inválida)
 * 403 com razão de rate limit → 'transient'
 * 403 com outra razão → 'auth'
 * 404 → 'other' (o chamador decide o significado)
 * Outros → 'other'
 */
function classifyCalendarError(status, body) {
  if (status === 401) {
    return 'auth';
  }

  if (status === 403) {
    // Procura a razão do erro em body.error.errors[0].reason
    const reason = body?.error?.errors?.[0]?.reason;
    if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded' || reason === 'quotaExceeded' || reason === 'backendError') {
      return 'transient';
    }
    // Qualquer outro 403 é tratado como credencial/permissão
    return 'auth';
  }

  return 'other';
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

  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch (_) {
    // Resposta não é JSON (e.g. HTML). Inclui um trecho do texto para diagnóstico.
    const truncated = text.slice(0, 100);
    if (!res.ok) {
      throw new Error(`Google ${res.status}: resposta não-JSON: ${truncated}`);
    }
    return body;
  }

  if (!res.ok) {
    const classification = classifyTokenError(res.status, body);
    if (classification === 'auth') {
      throw new GoogleAuthError(body.error_description || body.error || 'credencial inválida');
    }
    throw new Error(`Google ${res.status}: ${body.error_description || body.error || text.slice(0, 100)}`);
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
  return res;
}

async function createAppCalendar(accessToken, timeZone) {
  const res = await calendarFetch(accessToken, '/calendars', {
    method: 'POST',
    body: JSON.stringify({ summary: 'ArcanaForge', timeZone }),
  });

  let body = {};
  try {
    body = await res.json();
  } catch (_) {
    // Não é JSON
  }

  if (!res.ok) {
    const classification = classifyCalendarError(res.status, body);
    if (classification === 'auth') {
      throw new GoogleAuthError(`Calendar ${res.status}`);
    }
    throw new Error(`Falha ao criar calendário: ${res.status}`);
  }
  return body.id;
}

/**
 * O calendário existe e é alcançável com ESTE access token.
 *
 * Serve para decidir, ao religar, se o `calendarId` guardado ainda vale. Cobre
 * as duas formas de ele não valer mais: apagado no Google, e pertencente a
 * outra conta — `calendar.app.created` só alcança os calendários que o app
 * criou na conta que autorizou, então um calendário de outra conta é
 * inalcançável por este token.
 */
async function calendarExists(accessToken, calendarId) {
  const res = await calendarFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}`);
  if (res.ok) return true;

  // 404/410 = não existe; 403 = este token não alcança. Nos três o calendário
  // guardado não serve — e nenhum é sinal de credencial morta, porque o token
  // acabou de sair de uma autorização bem-sucedida.
  if (res.status === 403 || res.status === 404 || res.status === 410) return false;

  let responseBody = {};
  try {
    responseBody = await res.json();
  } catch (_) {
    // Não é JSON
  }

  // Sobra o que não dá pra concluir (401, rate limit, 5xx). Classifica no mesmo
  // lugar que o resto e lança: religar falhar e ser repetido é melhor do que
  // criar um calendário órfão ou reaproveitar um morto no escuro.
  if (classifyCalendarError(res.status, responseBody) === 'auth') {
    throw new GoogleAuthError(`Calendar ${res.status}`);
  }
  throw new Error(`Falha ao checar calendário: ${res.status}`);
}

async function insertEvent(accessToken, calendarId, body) {
  const res = await calendarFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: 'POST', body: JSON.stringify(body) },
  );

  let responseBody = {};
  try {
    responseBody = await res.json();
  } catch (_) {
    // Não é JSON
  }

  // Calendário apagado pela pessoa no Google: tratado como credencial quebrada.
  if (res.status === 404) {
    throw new GoogleAuthError('calendário não encontrado');
  }

  if (!res.ok) {
    const classification = classifyCalendarError(res.status, responseBody);
    if (classification === 'auth') {
      throw new GoogleAuthError(`Calendar ${res.status}`);
    }
    if (classification === 'transient') {
      throw new Error(`Falha transiente ao criar evento: ${res.status}`);
    }
    throw new Error(`Falha ao criar evento: ${res.status}`);
  }
  return responseBody.id;
}

async function deleteEvent(accessToken, calendarId, eventId) {
  const res = await calendarFetch(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' },
  );
  // Já não existe é o estado desejado.
  if (res.ok || res.status === 404 || res.status === 410) return;

  let responseBody = {};
  try {
    responseBody = await res.json();
  } catch (_) {
    // Não é JSON
  }

  const classification = classifyCalendarError(res.status, responseBody);
  if (classification === 'auth') {
    throw new GoogleAuthError(`Calendar ${res.status}`);
  }
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
  calendarExists,
  insertEvent,
  deleteEvent,
  classifyTokenError,
  classifyCalendarError,
};
