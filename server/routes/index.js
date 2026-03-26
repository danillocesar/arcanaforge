const express = require('express');
const fs = require('fs');
const path = require('path');
const paths = require('../paths');
const combatState = require('../combatState');
const Character = require('../db/models/Character');
const Party = require('../db/models/Party');
const { ownerFieldsFromReq } = require('../characters/userCharactersDir');

/**
 * @param {import('express').Express} app
 * @param {{ uploadAvatar: import('multer').Multer, refs: { broadcastCombat: (partyId?: string) => void } }} opts
 */
function registerRoutes(app, opts) {
  const { uploadAvatar, refs } = opts;
  const { AVATARS_DIR, DIST_DIR } = paths;

  // Characters
  app.get('/api/characters', async (req, res) => {
    try {
      const docs = await Character.find({ ownerUid: req.user.uid }).select('_id');
      res.json(docs.map((d) => d._id));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  function cleanMongoFields(doc) {
    if (!doc) return doc;
    const { __v, createdAt, updatedAt, ...rest } = doc;
    return rest;
  }

  app.get('/api/characters/summary', async (req, res) => {
    try {
      const docs = await Character.find({ ownerUid: req.user.uid })
        .select('_id name avatar classes system ownerUid ownerEmail')
        .lean();
      res.json(docs.map(cleanMongoFields));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/characters/:id', async (req, res) => {
    try {
      const doc = await Character.findOne({ _id: req.params.id, ownerUid: req.user.uid }).lean();
      if (!doc) return res.status(404).json({ error: 'Character not found' });
      res.json(cleanMongoFields(doc));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/characters/:id', async (req, res) => {
    const id = req.params.id;
    if (!req.body || typeof req.body !== 'object' || !req.body.name) {
      return res.status(400).json({ error: 'Invalid body: "name" field is required' });
    }
    try {
      const owners = ownerFieldsFromReq(req);
      const body = { ...req.body, _id: id, ...owners };
      await Character.findByIdAndUpdate(id, body, { upsert: true, setDefaultsOnInsert: true });
      res.json({ ok: true, _id: id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/characters/:id', async (req, res) => {
    try {
      await Character.findOneAndDelete({ _id: req.params.id, ownerUid: req.user.uid });
      const avatarFiles = fs
        .readdirSync(AVATARS_DIR)
        .filter(
          (f) =>
            path.parse(f).name === req.params.id ||
            path.parse(f).name === `${req.params.id}_transparent` ||
            path.parse(f).name === `${req.params.id}_sem_fundo`,
        );
      avatarFiles.forEach((f) => fs.unlinkSync(path.join(AVATARS_DIR, f)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Parties
  function generatePartyId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function toPartyJson(doc) {
    const { _id, __v, createdAt, updatedAt, ...rest } = doc;
    return { id: _id, ...rest };
  }

  app.get('/api/parties', async (req, res) => {
    try {
      const docs = await Party.find({ ownerUid: req.user.uid }).lean();
      res.json(docs.map(toPartyJson));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/parties', async (req, res) => {
    const { name, system, members } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: '"name" field is required' });
    }
    const validSystems = ['tormenta', 'naruto'];
    if (system && !validSystems.includes(system)) {
      return res.status(400).json({ error: 'Invalid system' });
    }
    try {
      const owners = ownerFieldsFromReq(req);
      const id = generatePartyId();
      const party = await Party.create({
        _id: id,
        name: name.trim(),
        system: system || 'tormenta',
        members: members || [],
        ...owners,
      });
      res.json(toPartyJson(party.toObject()));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/parties/:id', async (req, res) => {
    try {
      const party = await Party.findOneAndUpdate(
        { _id: req.params.id, ownerUid: req.user.uid },
        { ...req.body, _id: req.params.id },
        { new: true },
      ).lean();
      if (!party) return res.status(404).json({ error: 'Party not found' });
      res.json(toPartyJson(party));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/parties/:id', async (req, res) => {
    try {
      await Party.findOneAndDelete({ _id: req.params.id, ownerUid: req.user.uid });
      await combatState.deleteCombat(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Combat (nested under parties)
  app.get('/api/parties/:id/combat', async (req, res) => {
    try {
      const data = await combatState.loadCombat(req.params.id);
      const { _id, __v, createdAt, updatedAt, ...clean } = data;
      res.json(clean);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/parties/:id/combat', async (req, res) => {
    try {
      const { id } = req.params;
      combatState.combatCache[id] = req.body;
      await combatState.saveCombat(id, req.body);
      refs.broadcastCombat(id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Avatars (still filesystem-based)
  app.get('/api/avatar-transparent/:id', (req, res) => {
    const id = req.params.id;
    const variants = [
      `${id}_transparent.png`, `${id}_transparent.jpg`, `${id}_transparent.webp`,
      `${id}_sem_fundo.png`, `${id}_sem_fundo.jpg`, `${id}_sem_fundo.webp`,
    ];
    for (const v of variants) {
      if (fs.existsSync(path.join(AVATARS_DIR, v))) {
        return res.json({ url: `/avatars/${v}` });
      }
    }
    res.json({ url: null });
  });

  app.post('/api/avatar/:id', uploadAvatar.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
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
