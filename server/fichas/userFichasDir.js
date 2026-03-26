const fs = require('fs');
const path = require('path');

/**
 * Nome de pasta seguro e legível a partir do e-mail (Windows/macOS/Linux).
 * @param {string} email
 */
function emailToFolderSegment(email) {
  const e = String(email).trim().toLowerCase();
  return e
    .replace(/@/g, '_at_')
    .replace(/\+/g, '_plus_')
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * @param {{ uid: string, email?: string }} user — típico de Firebase verifyIdToken
 */
function folderSegmentFromUser(user) {
  if (user.email && String(user.email).trim()) {
    return emailToFolderSegment(user.email);
  }
  const uid = String(user.uid || '').trim();
  if (!uid) return 'uid_unknown';
  return `uid_${uid}`;
}

/**
 * Diretório onde ficam as fichas deste utilizador (cria se não existir).
 * @param {import('express').Request} req
 * @param {string} fichasRoot — paths.FICHAS_DIR
 */
function getUserFichasDir(req, fichasRoot) {
  if (!req.user) {
    throw new Error('getUserFichasDir: req.user ausente');
  }
  const segment = folderSegmentFromUser(req.user);
  const dir = path.join(fichasRoot, segment);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Caminho absoluto do ficheiro da ficha, garantindo que fica dentro de userDir.
 * @param {string} userDir
 * @param {string} id
 */
function resolveFichaFilePath(userDir, id) {
  const filePath = path.join(userDir, `${id}.json`);
  const resolvedFile = path.resolve(filePath);
  const resolvedUser = path.resolve(userDir);
  const rel = path.relative(resolvedUser, resolvedFile);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Caminho de ficha inválido');
  }
  return filePath;
}

/**
 * @param {import('express').Request} req
 * @param {string} fichasRoot
 */
function ownerFieldsFromReq(req) {
  return {
    ownerUid: req.user.uid,
    ownerEmail: req.user.email ? String(req.user.email).trim().toLowerCase() : '',
  };
}

module.exports = {
  emailToFolderSegment,
  folderSegmentFromUser,
  getUserFichasDir,
  resolveFichaFilePath,
  ownerFieldsFromReq,
};
