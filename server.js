const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const FICHAS_DIR = path.join(__dirname, 'fichas');

app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

if (!fs.existsSync(FICHAS_DIR)) {
  fs.mkdirSync(FICHAS_DIR);
}

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

app.listen(PORT, '0.0.0.0', () => {
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
