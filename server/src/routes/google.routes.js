const { Router } = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const googleLinkService = require('../services/google/googleLink.service');
const { createGoogleController } = require('../controllers/google.controller');

function createGoogleRoutes() {
  const router = Router();
  const controller = createGoogleController(googleLinkService);

  // Sob /api: herdam o requireAuth global de server/index.js:73.
  router.get('/api/google/oauth/start', asyncHandler(controller.startOAuth));
  router.get('/api/google/link', asyncHandler(controller.getLink));
  router.delete('/api/google/link', asyncHandler(controller.deleteLink));

  // FORA de /api de propósito: é redirect de navegador vindo do Google, sem
  // Bearer token. Quem autentica a requisição é o state assinado.
  router.get('/auth/google/callback', asyncHandler(controller.callback));

  return router;
}

module.exports = { createGoogleRoutes };
