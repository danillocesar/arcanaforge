const { resolveUserEmail } = require('../../auth/firebaseAdmin');
const {
  uploadJutsuImageBuffer,
  deleteJutsuImageByPublicUrl,
  isR2Configured,
} = require('../../storage/r2');
const { AppError } = require('../errors/AppError');
const characterRepository = require('../repositories/character.repository');

async function uploadJutsuImage(req) {
  if (!isR2Configured()) {
    throw new AppError(503, 'Armazenamento R2 não configurado no servidor');
  }
  if (!req.file) {
    throw new AppError(400, 'Ficheiro em falta (campo image)');
  }

  const jutsuId = (req.body && req.body.jutsuId ? String(req.body.jutsuId) : '').trim();
  if (!jutsuId) {
    throw new AppError(400, 'Campo jutsuId é obrigatório');
  }

  const data = await characterRepository.findOwnedJutsuImageData(req.params.id, req.user.uid, jutsuId);
  if (!data) {
    throw new AppError(404, 'Character not found');
  }
  if (!data.jutsu) {
    throw new AppError(404, 'Jutsu não encontrado neste personagem');
  }

  const email = await resolveUserEmail(req, data);
  if (!email) {
    throw new AppError(
      400,
      'Email do utilizador não disponível. Refaça o login com Google ou email, ou actualize a conta no Firebase.',
    );
  }

  const result = await uploadJutsuImageBuffer({
    email,
    originalFilename: req.file.originalname || 'jutsu.png',
    characterName: data.name || 'personagem',
    jutsuName: data.jutsu.name || 'jutsu',
    buffer: req.file.buffer,
    contentType: req.file.mimetype,
  });

  if (!result) {
    throw new AppError(503, 'Upload falhou');
  }

  if (data.jutsu.image) {
    await deleteJutsuImageByPublicUrl(data.jutsu.image, email);
  }
  await characterRepository.updateJutsuImage(req.params.id, jutsuId, result.publicUrl);

  return { url: result.publicUrl, jutsuId };
}

module.exports = { uploadJutsuImage };
