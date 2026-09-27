const multer = require('multer');
const { kindFromMimetype } = require('../utils/partyFileKind');

const MAX_BYTES = 20 * 1024 * 1024;

const partyFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!kindFromMimetype(file.mimetype)) {
      return cb(new Error('Apenas imagens (PNG, JPEG, WebP, GIF) ou documentos PDF são permitidos'));
    }
    cb(null, true);
  },
});

function partyFileUploadMiddleware(req, res, next) {
  partyFileUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Arquivo grande demais (máx. 20 MB)'
        : err.message || 'Upload inválido';
    return res.status(400).json({ error: msg });
  });
}

module.exports = { partyFileUploadMiddleware };
