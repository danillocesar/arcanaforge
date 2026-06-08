const multer = require('multer');

const ALLOWED_MIMETYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !ALLOWED_MIMETYPES.has(file.mimetype)) {
      return cb(new Error('Apenas imagens PNG, JPEG, WebP ou GIF são permitidas'));
    }
    cb(null, true);
  },
});

function avatarUploadMiddleware(req, res, next) {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (!err) return next();
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Ficheiro demasiado grande (máx. 5 MB)'
        : err.message || 'Upload inválido';
    return res.status(400).json({ error: msg });
  });
}

function jutsuImageUploadMiddleware(req, res, next) {
  avatarUpload.single('image')(req, res, (err) => {
    if (!err) return next();
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Ficheiro demasiado grande (máx. 5 MB)'
        : err.message || 'Upload inválido';
    return res.status(400).json({ error: msg });
  });
}

module.exports = { avatarUploadMiddleware, jutsuImageUploadMiddleware };
