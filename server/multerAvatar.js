const path = require('path');
const multer = require('multer');

function createUploadAvatar(AVATARS_DIR) {
  const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATARS_DIR),
    filename: (req, file, cb) => {
      const id = req.params.id;
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      cb(null, `${id}${ext}`);
    },
  });
  return multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });
}

module.exports = { createUploadAvatar };
