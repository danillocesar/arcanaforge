const characterService = require('../services/character.service');

async function listCharacterIds(req, res) {
  res.json(await characterService.listCharacterIds(req.user.uid));
}

async function listCharacterSummary(req, res) {
  res.json(await characterService.listCharacterSummary(req.user.uid));
}

async function getCharacter(req, res) {
  res.json(await characterService.getCharacter(req.params.id, req.user.uid));
}

async function uploadAvatar(req, res) {
  res.json(await characterService.uploadCharacterAvatar(req));
}

async function uploadJutsuImage(req, res) {
  res.json(await characterService.uploadJutsuImage(req));
}

async function saveCharacter(req, res) {
  res.json(await characterService.saveCharacter(req.params.id, req.body, req));
}

async function deleteCharacter(req, res) {
  res.json(await characterService.deleteCharacter(req.params.id, req));
}

async function restoreCharacter(req, res) {
  res.json(await characterService.restoreCharacter(req.params.id, req));
}

module.exports = {
  listCharacterIds,
  listCharacterSummary,
  getCharacter,
  uploadAvatar,
  uploadJutsuImage,
  saveCharacter,
  deleteCharacter,
  restoreCharacter,
};
