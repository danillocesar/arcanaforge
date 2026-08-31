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
