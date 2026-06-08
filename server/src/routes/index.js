const fs = require('fs');
const path = require('path');
const paths = require('../../paths');
const { errorHandler } = require('../middlewares/errorHandler');
const { createNarutoRoutes } = require('./naruto.routes');
const { createCharacterRoutes } = require('./characters.routes');
const { createPartyRoutes } = require('./parties.routes');
const { createCombatRoutes } = require('./combat.routes');

/**
 * @param {import('express').Express} app
 * @param {{ refs: { broadcastCombat: (partyId?: string) => void, broadcastPartyRoster: (partyId: string) => void } }} opts
 */
function registerRoutes(app, opts) {
  const { refs } = opts;
  app.use(createCharacterRoutes());
  app.use(createNarutoRoutes());
  app.use(createPartyRoutes(refs));
  app.use(createCombatRoutes(refs));

  if (fs.existsSync(paths.DIST_DIR)) {
    app.get('*', (_req, res) => {
      res.sendFile(path.join(paths.DIST_DIR, 'index.html'));
    });
  }

  app.use(errorHandler);
}

module.exports = { registerRoutes };
