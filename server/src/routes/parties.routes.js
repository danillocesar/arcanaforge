const { Router } = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { requireActivePlan } = require('../middlewares/planGuard');
const { createPartyService } = require('../services/party.service');
const { createPartyController } = require('../controllers/party.controller');

function createPartyRoutes(refs) {
  const router = Router();
  const partyController = createPartyController(createPartyService(refs));

  router.get('/api/parties', asyncHandler(partyController.listParties));
  router.post('/api/parties', requireActivePlan, asyncHandler(partyController.createParty));
  router.put('/api/parties/:id', requireActivePlan, asyncHandler(partyController.updateParty));
  router.delete('/api/parties/:id', asyncHandler(partyController.deleteParty));
  router.post('/api/parties/join', requireActivePlan, asyncHandler(partyController.joinParty));
  router.post('/api/parties/:id/add-character', requireActivePlan, asyncHandler(partyController.addCharacter));
  router.post('/api/parties/:id/remove-character', asyncHandler(partyController.removeCharacter));
  router.post('/api/parties/:id/leave', asyncHandler(partyController.leaveParty));
  router.delete('/api/parties/:id/members/:uid', asyncHandler(partyController.removeMember));
  router.post('/api/parties/:id/regenerate-code', requireActivePlan, asyncHandler(partyController.regenerateCode));
  router.get('/api/parties/:id/characters', asyncHandler(partyController.listPartyCharacters));
  router.get('/api/parties/:id/characters/:characterId', asyncHandler(partyController.getPartyCharacter));
  return router;
}

module.exports = { createPartyRoutes };
