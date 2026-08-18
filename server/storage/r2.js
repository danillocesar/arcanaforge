const crypto = require('crypto');
const path = require('path');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    return null;
  }
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBase: publicBase.replace(/\/$/, ''),
  };
}

function createClient() {
  const cfg = getR2Config();
  if (!cfg) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

let cachedClient = null;
function getClient() {
  if (!cachedClient) cachedClient = createClient();
  return cachedClient;
}

/**
 * Pasta por utilizador legível no bucket: `user_at_domain.com`
 */
function sanitizeEmailForPath(email) {
  if (!email || typeof email !== 'string') return '';
  return email
    .trim()
    .toLowerCase()
    .replace(/@/g, '_at_')
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Segmentos do nome do ficheiro (original, nome do personagem). */
function sanitizeFileSegment(str, maxLen) {
  const lim = maxLen || 48;
  const s = String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, lim);
  return s || 'avatar';
}

function extFromContentType(contentType) {
  const t = (contentType || '').toLowerCase().split(';')[0].trim();
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[t] || '.png';
}

function objectKeyFromPublicUrl(publicUrl) {
  const cfg = getR2Config();
  if (!cfg || !publicUrl || typeof publicUrl !== 'string') return null;
  const base = cfg.publicBase;
  let u = publicUrl.trim();
  if (!u.startsWith(base)) return null;
  const rest = u.slice(base.length).replace(/^\//, '');
  try {
    return decodeURIComponent(rest.split('?')[0]);
  } catch {
    return rest.split('?')[0];
  }
}

/**
 * Apaga um objecto se a URL for do nosso bucket e o caminho pertencer ao utilizador.
 * Aceita prefixo legado `uid/avatars/` (bug antigo em que o uid ia como primeira pasta).
 */
async function deleteAvatarByPublicUrl(publicUrl, userEmail, uid) {
  const cfg = getR2Config();
  const client = getClient();
  if (!cfg || !client || !uid) return;

  const key = objectKeyFromPublicUrl(publicUrl);
  if (!key) return;

  const emailRoot = sanitizeEmailForPath(userEmail);
  const okEmail = emailRoot && key.startsWith(`${emailRoot}/avatars/`);
  const okLegacyUid = key.startsWith(`${uid}/avatars/`);

  if (!okEmail && !okLegacyUid) {
    console.warn('[r2] deleteAvatarByPublicUrl: chave fora das pastas permitidas');
    return;
  }

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
      }),
    );
  } catch (err) {
    console.warn('[r2] deleteAvatarByPublicUrl:', err.message);
  }
}

/**
 * @param {object} opts
 * @param {string} opts.email - obrigatório (já resolvido)
 * @param {string} opts.originalFilename - nome original do upload (ex.: foto.png)
 * @param {string} opts.characterName - nome do personagem na ficha
 * @param {Buffer} opts.buffer
 * @param {string} opts.contentType
 * @returns {Promise<{ publicUrl: string, key: string } | null>}
 */
async function uploadAvatarBuffer(opts) {
  const { email, originalFilename, characterName, buffer, contentType } = opts;
  const cfg = getR2Config();
  const client = getClient();
  if (!cfg || !client || !buffer?.length) return null;

  const root = sanitizeEmailForPath(email);
  if (!root) return null;

  const parsed = path.parse(originalFilename || 'avatar.png');
  const baseOriginal = sanitizeFileSegment(parsed.name, 40);
  const charPart = sanitizeFileSegment(characterName, 40);
  const ext = extFromContentType(contentType);
  const id = crypto.randomUUID();
  const fileName = `${baseOriginal}_${charPart}_${id}${ext}`;
  const key = `${root}/avatars/${fileName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'image/png',
    }),
  );

  const publicUrl = `${cfg.publicBase}/${key}`;
  return { publicUrl, key };
}

function isR2Configured() {
  return getR2Config() !== null;
}

module.exports = {
  uploadAvatarBuffer,
  deleteAvatarByPublicUrl,
  isR2Configured,
};
