const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = 3000;
const FICHAS_DIR = path.join(__dirname, 'fichas');
const AVATARS_DIR = path.join(__dirname, 'avatars');

app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

if (!fs.existsSync(FICHAS_DIR)) fs.mkdirSync(FICHAS_DIR);
if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR);

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const nome = sanitizeName(req.params.nome);
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${nome}${ext}`);
  }
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9À-ÿ _-]/g, '').trim();
}

app.get('/api/fichas', (req, res) => {
  const files = fs.readdirSync(FICHAS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
  res.json(files);
});

app.get('/api/fichas-resumo', (req, res) => {
  const files = fs.readdirSync(FICHAS_DIR).filter(f => f.endsWith('.json'));
  const resumos = files.map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(FICHAS_DIR, f), 'utf-8'));
      return { nome: data.nome || f.replace('.json', ''), avatar: data.avatar || '', classes: data.classes || [] };
    } catch { return null; }
  }).filter(Boolean);
  res.json(resumos);
});

app.get('/api/fichas/:nome', (req, res) => {
  const nome = sanitizeName(req.params.nome);
  const filePath = path.join(FICHAS_DIR, `${nome}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Ficha não encontrada' });
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  res.json(data);
});

app.post('/api/fichas/:nome', (req, res) => {
  const nome = sanitizeName(req.params.nome);
  if (!nome) {
    return res.status(400).json({ error: 'Nome inválido' });
  }
  const filePath = path.join(FICHAS_DIR, `${nome}.json`);
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
  res.json({ ok: true, nome });
});

app.delete('/api/fichas/:nome', (req, res) => {
  const nome = sanitizeName(req.params.nome);
  const filePath = path.join(FICHAS_DIR, `${nome}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.json({ ok: true });
});

app.post('/api/fichas/:nomeAntigo/renomear/:nomeNovo', (req, res) => {
  const nomeAntigo = sanitizeName(req.params.nomeAntigo);
  const nomeNovo = sanitizeName(req.params.nomeNovo);
  const pathAntigo = path.join(FICHAS_DIR, `${nomeAntigo}.json`);
  const pathNovo = path.join(FICHAS_DIR, `${nomeNovo}.json`);

  if (!fs.existsSync(pathAntigo)) {
    return res.status(404).json({ error: 'Ficha antiga não encontrada' });
  }
  if (nomeAntigo !== nomeNovo) {
    fs.renameSync(pathAntigo, pathNovo);
  }
  res.json({ ok: true });
});

// --- Combate Tracker (server-side state) ---
const COMBATE_FILE = path.join(__dirname, 'combate.json');
const COMBATE_DEFAULT = { inimigos: [], iniciativas: {}, turnoIdx: -1, ordenado: false };

function loadCombateData() {
  try {
    if (fs.existsSync(COMBATE_FILE)) return JSON.parse(fs.readFileSync(COMBATE_FILE, 'utf-8'));
  } catch (_) {}
  return { ...COMBATE_DEFAULT };
}
function saveCombateData(data) {
  fs.writeFileSync(COMBATE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let combateData = loadCombateData();

app.get('/api/combate', (req, res) => {
  res.json(combateData);
});

app.post('/api/combate', (req, res) => {
  combateData = req.body;
  saveCombateData(combateData);
  broadcastCombate();
  res.json({ ok: true });
});

app.get('/api/avatar-sem-fundo/:nome', (req, res) => {
  const nome = sanitizeName(req.params.nome);
  const variants = [
    `${nome}_sem_fundo.png`,
    `${nome.toLowerCase()}_sem_fundo.png`,
  ];
  for (const v of variants) {
    if (fs.existsSync(path.join(AVATARS_DIR, v))) {
      return res.json({ url: `/avatars/${v}` });
    }
  }
  res.json({ url: null });
});

app.post('/api/avatar/:nome', uploadAvatar.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const nome = sanitizeName(req.params.nome);
  // Remove avatares antigos com extensao diferente
  const files = fs.readdirSync(AVATARS_DIR).filter(f => {
    const base = path.parse(f).name;
    return base === nome && f !== req.file.filename;
  });
  files.forEach(f => fs.unlinkSync(path.join(AVATARS_DIR, f)));
  res.json({ url: `/avatars/${req.file.filename}` });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcastCombate() {
  const msg = JSON.stringify({ type: 'combate_sync', data: combateData });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'combate_sync', data: combateData }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'combate_update' && msg.data) {
        combateData = msg.data;
        saveCombateData(combateData);
        const out = JSON.stringify({ type: 'combate_sync', data: combateData });
        wss.clients.forEach(c => { if (c !== ws && c.readyState === 1) c.send(out); });
      }
      if (msg.type === 'ficha_hp_update' && msg.nome) {
        const out = JSON.stringify({ type: 'ficha_hp_sync', nome: msg.nome, pv: msg.pv, pm: msg.pm });
        wss.clients.forEach(c => { if (c !== ws && c.readyState === 1) c.send(out); });
      }
      if (msg.type === 'mestre_hp_update' && msg.nome) {
        const out = JSON.stringify({ type: 'mestre_hp_sync', nome: msg.nome, pvAtual: msg.pvAtual });
        wss.clients.forEach(c => { if (c !== ws && c.readyState === 1) c.send(out); });
      }
    } catch (_) {}
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  let ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  console.log(`Servidor rodando em:`);
  console.log(`  Local:  http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`  Rede:   http://${ip}:${PORT}`));
});
