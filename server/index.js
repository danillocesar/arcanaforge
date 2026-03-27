const dotenv = require('dotenv');
const dotenvResult = dotenv.config();
if (dotenvResult.parsed) {
  for (const [key, value] of Object.entries(dotenvResult.parsed)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const paths = require('./paths');
const { connectMongo } = require('./db/connection');
const { register: registerValidateId } = require('./middleware/validateId');
const { requireAuth } = require('./middleware/requireAuth');
const { registerRoutes } = require('./routes');
const { attachWebSocket } = require('./websocket');

const PORT = parseInt(process.env.PORT, 10) || 3000;

paths.ensureDataDirs();

async function start() {
  await connectMongo();

  const { run: runMigrateToMongo } = require('./db/migrateToMongo');
  await runMigrateToMongo();

  const app = express();
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(express.json({ limit: '5mb' }));

  const healthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 180,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 900,
    standardHeaders: true,
    legacyHeaders: false,
  });

  registerValidateId(app);

  if (fs.existsSync(paths.DIST_DIR)) {
    app.use(express.static(paths.DIST_DIR));
  } else {
    app.use(express.static(paths.ROOT_DIR));
  }

  app.use('/assets', express.static(path.join(paths.ROOT_DIR, 'assets')));
  app.get('/health', healthLimiter, (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', apiLimiter, requireAuth);

  const refs = {
    broadcastCombat() {
      /* filled by attachWebSocket */
    },
    broadcastPartyRoster() {
      /* filled by attachWebSocket */
    },
  };

  registerRoutes(app, { refs });

  const server = http.createServer(app);
  attachWebSocket(server, { refs });

  server.listen(PORT, '0.0.0.0', () => {
    const nets = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
      }
    }
    console.log('Servidor rodando em:');
    console.log(`  Local:  http://localhost:${PORT}`);
    ips.forEach((ip) => console.log(`  Rede:   http://${ip}:${PORT}`));
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
