const multer = require('multer');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens'));
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

module.exports = { avatarUploadMiddleware };
