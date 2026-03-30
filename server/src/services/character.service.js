const { ownerFieldsFromReq } = require('../../characters/userCharactersDir');
const { AppError } = require('../errors/AppError');
const { toCharacterSummaryDTO, toCharacterDetailDTO } = require('../dto/character.dto');
const characterRepository = require('../repositories/character.repository');
const avatarService = require('./avatar.service');
const userService = require('./user.service');
const { SOFT_DELETE_DELAY_DAYS } = require('../config/plans');

function pendingDeleteAt() {
  const d = new Date();
  d.setDate(d.getDate() + SOFT_DELETE_DELAY_DAYS);
  return d;
}

async function listCharacterIds(uid) {
  const docs = await characterRepository.findIdsByOwner(uid);
  return docs.map((d) => d._id);
}

async function listCharacterSummary(uid) {
  const docs = await characterRepository.findSummaryByOwner(uid);
  return docs.map(toCharacterSummaryDTO);
}

async function getCharacter(id, uid) {
  const doc = await characterRepository.findOwnedById(id, uid);
  if (!doc) throw new AppError(404, 'Character not found');
  return toCharacterDetailDTO(doc);
}

async function saveCharacter(id, body, req) {
  if (!body || typeof body !== 'object' || !body.name) {
    throw new AppError(400, 'Invalid body: "name" field is required');
  }

  const existing = await characterRepository.findOwnerById(id);
  if (existing && existing.ownerUid !== req.user.uid) {
    throw new AppError(403, 'Acesso negado');
  }

  if (!existing) {
    const count = await characterRepository.countByOwner(req.user.uid);
    const subUser = req.subscriptionUser;
    const limit = userService.getSlotLimit(subUser);
    if (count >= limit) {
      throw new AppError(403, 'Limite de personagens atingido. Adquira mais slots.');
    }
  }

  // Strip server-controlled lifecycle and ownership fields so the client
  // cannot inject them (e.g. setting deletedAt: null to bypass soft-delete).
  // eslint-disable-next-line no-unused-vars
  const { deletedAt, pendingDeleteAt, ownerUid, ownerEmail, _id: _bodyId, ...safeBody } = body;

  const owners = ownerFieldsFromReq(req);
  await characterRepository.upsertById(id, { ...safeBody, _id: id, ...owners });
  return { ok: true, _id: id };
}

async function deleteCharacter(id, req) {
  const doc = await characterRepository.softDeleteOwnedById(id, req.user.uid, pendingDeleteAt());
  if (!doc) throw new AppError(404, 'Character not found');
  return { ok: true, pendingDeleteAt: doc.pendingDeleteAt };
}

async function restoreCharacter(id, req) {
  const existing = await characterRepository.findOwnerById(id);
  if (!existing) throw new AppError(404, 'Character not found');
  if (existing.ownerUid !== req.user.uid) throw new AppError(403, 'Acesso negado');
  if (!existing.deletedAt) throw new AppError(400, 'Personagem não está em processo de exclusão');

  const doc = await characterRepository.restoreOwnedById(id, req.user.uid);
  if (!doc) throw new AppError(404, 'Character not found');
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
  restoreCharacter,
  uploadCharacterAvatar,
};
