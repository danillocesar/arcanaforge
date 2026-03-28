const { adminAuth } = require('../../auth/firebaseAdmin');

function parseBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') return null;
  const [scheme, token] = headerValue.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
}

async function requireAuth(req, res, next) {
  if (!adminAuth) {
    return res.status(503).json({ error: 'Autenticação indisponível no servidor' });
  }

  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (_) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { requireAuth };
