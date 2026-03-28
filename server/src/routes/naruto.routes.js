const { Router } = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const narutoController = require('../controllers/naruto.controller');

function createNarutoRoutes() {
  const router = Router();
  router.get('/api/naruto/clans', asyncHandler(narutoController.getClans));
  router.get('/api/naruto/technique-templates', asyncHandler(narutoController.getTechniqueTemplates));
  return router;
}

module.exports = { createNarutoRoutes };
