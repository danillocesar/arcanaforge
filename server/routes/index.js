const express = require('express');
const fs = require('fs');
const path = require('path');
const paths = require('../paths');
const combateState = require('../combateState');

/**
 * @param {import('express').Express} app
 * @param {{ uploadAvatar: import('multer').Multer, refs: { broadcastCombate: (partyId?: string) => void } }} opts
 */
function registerRoutes(app, opts) {
  const { uploadAvatar, refs } = opts;
  const {
    FICHAS_DIR,
    AVATARS_DIR,
    PARTIES_DIR,
    COMBATE_DIR,
    DIST_DIR,
    ROOT_DIR,
  } = paths;

  app.get('/api/fichas', (req, res) => {
    const files = fs
      .readdirSync(FICHAS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
    res.json(files);
  });

  app.get('/api/fichas-resumo', (req, res) => {
    const files = fs.readdirSync(FICHAS_DIR).filter((f) => f.endsWith('.json'));
    const resumos = files
      .map((f) => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(FICHAS_DIR, f), 'utf-8'));
          return {
            _id: data._id || f.replace('.json', ''),
            nome: data.nome || 'Sem nome',
            avatar: data.avatar || '',
            classes: data.classes || [],
            sistema: data.sistema || 'tormenta',
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    res.json(resumos);
  });

  app.get('/api/fichas/:id', (req, res) => {
    const filePath = path.join(FICHAS_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Ficha não encontrada' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  });

  app.post('/api/fichas/:id', (req, res) => {
    const id = req.params.id;
    if (!req.body || typeof req.body !== 'object' || !req.body.nome) {
      return res.status(400).json({ error: 'Corpo inválido: campo "nome" é obrigatório' });
    }
    const body = { ...req.body, _id: id };
    const filePath = path.join(FICHAS_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8');
    res.json({ ok: true, _id: id });
  });

  app.delete('/api/fichas/:id', (req, res) => {
    const filePath = path.join(FICHAS_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const avatarFiles = fs
      .readdirSync(AVATARS_DIR)
      .filter(
        (f) =>
          path.parse(f).name === req.params.id ||
          path.parse(f).name === `${req.params.id}_sem_fundo`,
      );
    avatarFiles.forEach((f) => fs.unlinkSync(path.join(AVATARS_DIR, f)));
    res.json({ ok: true });
  });

  function generatePartyId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  app.get('/api/parties', (req, res) => {
    if (!fs.existsSync(PARTIES_DIR)) return res.json([]);
    const files = fs.readdirSync(PARTIES_DIR).filter((f) => f.endsWith('.json'));
    const parties = files
      .map((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(PARTIES_DIR, f), 'utf-8'));
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    res.json(parties);
  });

  app.post('/api/parties', (req, res) => {
    const { nome, sistema, membros } = req.body || {};
    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return res.status(400).json({ error: 'Campo "nome" é obrigatório' });
    }
    const validSistemas = ['tormenta', 'naruto'];
    if (sistema && !validSistemas.includes(sistema)) {
      return res.status(400).json({ error: 'Sistema inválido' });
    }
    const id = generatePartyId();
    const party = { id, nome: nome.trim(), sistema: sistema || 'tormenta', membros: membros || [] };
    fs.writeFileSync(path.join(PARTIES_DIR, `${id}.json`), JSON.stringify(party, null, 2), 'utf-8');
    res.json(party);
  });

  app.put('/api/parties/:id', (req, res) => {
    const filePath = path.join(PARTIES_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Party não encontrada' });
    const party = { ...req.body, id: req.params.id };
    fs.writeFileSync(filePath, JSON.stringify(party, null, 2), 'utf-8');
    res.json(party);
  });

  app.delete('/api/parties/:id', (req, res) => {
    const partyFile = path.join(PARTIES_DIR, `${req.params.id}.json`);
    const combateFile = path.join(COMBATE_DIR, `${req.params.id}.json`);
    const combateLegacy = path.join(ROOT_DIR, `combate-${req.params.id}.json`);
    if (fs.existsSync(partyFile)) fs.unlinkSync(partyFile);
    if (fs.existsSync(combateFile)) fs.unlinkSync(combateFile);
    if (fs.existsSync(combateLegacy)) fs.unlinkSync(combateLegacy);
    delete combateState.combateCache[req.params.id];
    res.json({ ok: true });
  });

  app.get('/api/combate/:partyId', (req, res) => {
    const { partyId } = req.params;
    if (!combateState.combateCache[partyId]) {
      combateState.combateCache[partyId] = combateState.loadCombateForParty(partyId);
    }
    res.json(combateState.combateCache[partyId]);
  });

  app.post('/api/combate/:partyId', (req, res) => {
    const { partyId } = req.params;
    combateState.combateCache[partyId] = req.body;
    combateState.saveCombateForParty(partyId, req.body);
    refs.broadcastCombate(partyId);
    res.json({ ok: true });
  });

  app.get('/api/combate', (req, res) => {
    res.json(combateState.combateData);
  });

  app.post('/api/combate', (req, res) => {
    combateState.combateData = req.body;
    fs.writeFileSync(paths.COMBATE_FILE, JSON.stringify(combateState.combateData, null, 2), 'utf-8');
    refs.broadcastCombate();
    res.json({ ok: true });
  });

  app.get('/api/avatar-sem-fundo/:id', (req, res) => {
    const id = req.params.id;
    const variants = [`${id}_sem_fundo.png`, `${id}_sem_fundo.jpg`, `${id}_sem_fundo.webp`];
    for (const v of variants) {
      if (fs.existsSync(path.join(AVATARS_DIR, v))) {
        return res.json({ url: `/avatars/${v}` });
      }
    }
    res.json({ url: null });
  });

  app.post('/api/avatar/:id', uploadAvatar.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const id = req.params.id;
    const files = fs.readdirSync(AVATARS_DIR).filter((f) => {
      const base = path.parse(f).name;
      return base === id && f !== req.file.filename;
    });
    files.forEach((f) => fs.unlinkSync(path.join(AVATARS_DIR, f)));
    res.json({ url: `/avatars/${req.file.filename}` });
  });

  app.use('/avatars', express.static(AVATARS_DIR));

  if (fs.existsSync(DIST_DIR)) {
    app.get('*', (req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }
}

module.exports = { registerRoutes };
