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
