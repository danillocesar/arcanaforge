const { Router } = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { avatarUploadMiddleware } = require('../validators/avatarUpload');
const characterController = require('../controllers/character.controller');

function createCharacterRoutes() {
  const router = Router();
  router.get('/api/characters', asyncHandler(characterController.listCharacterIds));
  router.get('/api/characters/summary', asyncHandler(characterController.listCharacterSummary));
  router.get('/api/characters/:id', asyncHandler(characterController.getCharacter));
  router.post(
    '/api/characters/:id/avatar',
    avatarUploadMiddleware,
    asyncHandler(characterController.uploadAvatar),
  );
  router.post('/api/characters/:id', asyncHandler(characterController.saveCharacter));
  router.delete('/api/characters/:id', asyncHandler(characterController.deleteCharacter));
  router.post('/api/characters/:id/restore', asyncHandler(characterController.restoreCharacter));
  return router;
}

module.exports = { createCharacterRoutes };
