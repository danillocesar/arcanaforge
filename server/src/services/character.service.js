const { ownerFieldsFromReq } = require('../../characters/userCharactersDir');
const { AppError } = require('../errors/AppError');
const { cleanMongoFields } = require('../utils/mongo');
const characterRepository = require('../repositories/character.repository');
const avatarService = require('./avatar.service');

async function listCharacterIds(uid) {
  const docs = await characterRepository.findIdsByOwner(uid);
  return docs.map((d) => d._id);
}

async function listCharacterSummary(uid) {
  const docs = await characterRepository.findSummaryByOwner(uid);
  return docs.map(cleanMongoFields);
}

async function getCharacter(id, uid) {
  const doc = await characterRepository.findOwnedById(id, uid);
  if (!doc) throw new AppError(404, 'Character not found');
  return cleanMongoFields(doc);
}

async function saveCharacter(id, body, req) {
  if (!body || typeof body !== 'object' || !body.name) {
    throw new AppError(400, 'Invalid body: "name" field is required');
  }

  const existing = await characterRepository.findOwnerById(id);
  if (existing && existing.ownerUid !== req.user.uid) {
    throw new AppError(403, 'Acesso negado');
  }

  const owners = ownerFieldsFromReq(req);
  await characterRepository.upsertById(id, { ...body, _id: id, ...owners });
  return { ok: true, _id: id };
}

async function deleteCharacter(id, req) {
  const doc = await characterRepository.deleteOwnedById(id, req.user.uid);
  if (!doc) throw new AppError(404, 'Character not found');
  await avatarService.deleteAvatarIfNeeded(req, doc);
  return { ok: true };
}

async function uploadCharacterAvatar(req) {
  return avatarService.uploadAvatar(req);
}

module.exports = {
  listCharacterIds,
  listCharacterSummary,
  getCharacter,
  saveCharacter,
  deleteCharacter,
  uploadCharacterAvatar,
};
