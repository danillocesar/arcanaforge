const { Router } = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { createCombatService } = require('../services/combat.service');
const { createCombatController } = require('../controllers/combat.controller');

function createCombatRoutes(refs) {
  const router = Router();
  const combatController = createCombatController(createCombatService(refs));
  router.get('/api/parties/:id/combat', asyncHandler(combatController.getCombat));
  router.post('/api/parties/:id/combat', asyncHandler(combatController.saveCombat));
  return router;
}

module.exports = { createCombatRoutes };
