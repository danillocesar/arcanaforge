const { resolveUserEmail } = require('../../auth/firebaseAdmin');
const { uploadAvatarBuffer, deleteAvatarByPublicUrl, isR2Configured } = require('../../storage/r2');
const { AppError } = require('../errors/AppError');
const characterRepository = require('../repositories/character.repository');

async function uploadAvatar(req) {
  if (!isR2Configured()) {
    throw new AppError(503, 'Armazenamento R2 não configurado no servidor');
  }
  if (!req.file) {
    throw new AppError(400, 'Ficheiro em falta (campo avatar)');
  }

  const prev = await characterRepository.findOwnedAvatarDataById(req.params.id, req.user.uid);
  if (!prev) {
    throw new AppError(404, 'Character not found');
  }

  const email = await resolveUserEmail(req, prev);
  if (!email) {
    throw new AppError(
      400,
      'Email do utilizador não disponível. Refaça o login com Google ou email, ou actualize a conta no Firebase.',
    );
  }

  const result = await uploadAvatarBuffer({
    email,
    originalFilename: req.file.originalname || 'avatar.png',
    characterName: prev.name || 'personagem',
    buffer: req.file.buffer,
    contentType: req.file.mimetype,
  });

  if (!result) {
    throw new AppError(503, 'Upload falhou');
  }

  if (prev.avatar) {
    await deleteAvatarByPublicUrl(prev.avatar, email, req.user.uid);
  }
  await characterRepository.updateAvatar(req.params.id, result.publicUrl);
  return { url: result.publicUrl };
}

async function deleteAvatarIfNeeded(req, deletedCharacter) {
  if (!deletedCharacter || !deletedCharacter.avatar) return;
  const email = (await resolveUserEmail(req, deletedCharacter)) || deletedCharacter.ownerEmail || '';
  await deleteAvatarByPublicUrl(deletedCharacter.avatar, email, req.user.uid);
}

module.exports = { uploadAvatar, deleteAvatarIfNeeded };
