const { ownerFieldsFromReq } = require('../../characters/userCharactersDir');
const { AppError } = require('../errors/AppError');
const { toCharacterSummaryDTO, toCharacterDetailDTO } = require('../dto/character.dto');
const characterRepository = require('../repositories/character.repository');
const characterContentRepository = require('../repositories/characterContent.repository');
const characterLogsRepository = require('../repositories/characterLogs.repository');
const avatarService = require('./avatar.service');
const userService = require('./user.service');
const { SOFT_DELETE_DELAY_DAYS } = require('../config/plans');

const CONTENT_FIELDS = ['spells', 'abilities', 'powers', 'aptitudes', 'weapons', 'narpiItems'];

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
  const [doc, content, logsDoc] = await Promise.all([
    characterRepository.findOwnedById(id, uid),
    characterContentRepository.findById(id),
    characterLogsRepository.findById(id),
  ]);
  if (!doc) throw new AppError(404, 'Character not found');
  const merged = mergeCharacterDocs(doc, content, logsDoc);
  return toCharacterDetailDTO(merged);
}

function mergeCharacterDocs(doc, content, logsDoc) {
  const merged = { ...doc };
  if (content) {
    const { _id, __v, createdAt, updatedAt, ...fields } = content;
    Object.assign(merged, fields);
  }
  merged.logs = logsDoc?.logs || doc.logs || [];
  return merged;
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

  // eslint-disable-next-line no-unused-vars
  const { deletedAt, pendingDeleteAt, ownerUid, ownerEmail, _id: _bodyId, ...safeBody } = body;

  const { logs, ...bodyWithoutLogs } = safeBody;
  const contentData = {};
  const coreData = { ...bodyWithoutLogs };
  for (const field of CONTENT_FIELDS) {
    if (coreData[field] !== undefined) {
      contentData[field] = coreData[field];
      delete coreData[field];
    }
  }

  const owners = ownerFieldsFromReq(req);
  await Promise.all([
    characterRepository.upsertById(id, { ...coreData, _id: id, ...owners }),
    Object.keys(contentData).length > 0
      ? characterContentRepository.upsertById(id, contentData)
      : Promise.resolve(),
    logs !== undefined
      ? characterLogsRepository.upsertById(id, { logs })
      : Promise.resolve(),
  ]);
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
  mergeCharacterDocs,
};
