const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const paths = require('./paths');
const { register: registerValidateId } = require('./middleware/validateId');
const { run: runMigrateFichas } = require('./migrateFichas');
const { createUploadAvatar } = require('./multerAvatar');
const { registerRoutes } = require('./routes');
const { attachWebSocket } = require('./websocket');

const PORT = parseInt(process.env.PORT, 10) || 3000;

paths.ensureDataDirs();
paths.migrateLegacyStorage();

runMigrateFichas({
  FICHAS_DIR: paths.FICHAS_DIR,
  AVATARS_DIR: paths.AVATARS_DIR,
  PARTIES_DIR: paths.PARTIES_DIR,
});

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '5mb' }));

registerValidateId(app);

if (fs.existsSync(paths.DIST_DIR)) {
  app.use(express.static(paths.DIST_DIR));
} else {
  app.use(express.static(paths.ROOT_DIR));
}

app.use('/assets', express.static(path.join(paths.ROOT_DIR, 'assets')));

const uploadAvatar = createUploadAvatar(paths.AVATARS_DIR);

const refs = {
  broadcastCombate() {
    /* preenchido por attachWebSocket */
  },
};

registerRoutes(app, { uploadAvatar, refs });

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
