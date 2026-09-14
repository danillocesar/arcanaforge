const { Router } = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { createPartyService } = require('../services/party.service');
const { createPartyController } = require('../controllers/party.controller');

function createPartyRoutes(refs) {
  const router = Router();
  const partyController = createPartyController(createPartyService(refs));

  router.get('/api/parties', asyncHandler(partyController.listParties));
  router.post('/api/parties', asyncHandler(partyController.createParty));
  router.put('/api/parties/:id', asyncHandler(partyController.updateParty));
  router.delete('/api/parties/:id', asyncHandler(partyController.deleteParty));
  router.post('/api/parties/join', asyncHandler(partyController.joinParty));
  router.post('/api/parties/:id/add-character', asyncHandler(partyController.addCharacter));
  router.post('/api/parties/:id/remove-character', asyncHandler(partyController.removeCharacter));
  router.post('/api/parties/:id/leave', asyncHandler(partyController.leaveParty));
  router.delete('/api/parties/:id/members/:uid', asyncHandler(partyController.removeMember));
  router.post('/api/parties/:id/regenerate-code', asyncHandler(partyController.regenerateCode));
  router.get('/api/parties/:id/characters', asyncHandler(partyController.listPartyCharacters));
  router.get('/api/parties/:id/characters/:characterId', asyncHandler(partyController.getPartyCharacter));
  router.post('/api/parties/:id/apply-buff', asyncHandler(partyController.applyBuff));
  router.post('/api/parties/:id/sessions', asyncHandler(partyController.proposeSession));
  router.post('/api/parties/:id/sessions/:proposalId/respond', asyncHandler(partyController.respondToSession));
  router.delete('/api/parties/:id/sessions/:proposalId', asyncHandler(partyController.cancelSession));
  return router;
}

module.exports = { createPartyRoutes };
