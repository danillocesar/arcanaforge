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
