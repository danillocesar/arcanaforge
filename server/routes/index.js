const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const paths = require('../paths');
const combatState = require('../combatState');
const Character = require('../db/models/Character');
const Party = require('../db/models/Party');
const NarutoClan = require('../db/models/NarutoClan');
const { ownerFieldsFromReq } = require('../characters/userCharactersDir');
const { resolveUserEmail } = require('../auth/firebaseAdmin');
const { uploadAvatarBuffer, deleteAvatarByPublicUrl, isR2Configured } = require('../storage/r2');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens'));
    }
    cb(null, true);
  },
});

/**
 * @param {import('express').Express} app
 * @param {{ refs: { broadcastCombat: (partyId?: string) => void, broadcastPartyRoster: (partyId: string) => void } }} opts
 */
function registerRoutes(app, opts) {
  const { refs } = opts;
  const { DIST_DIR } = paths;

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

  // Naruto clans
  app.get('/api/naruto/clans', async (_req, res) => {
    try {
      const clans = await NarutoClan.find({ system: 'naruto', active: true })
        .select('_id name icon system active')
        .sort({ name: 1 })
        .lean();
      const payload = clans.map((c) => ({
        id: c._id,
        name: c.name,
        icon: c.icon,
        system: c.system,
        active: c.active,
      }));
      res.json(payload);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(
    '/api/characters/:id/avatar',
    (req, res, next) => {
      avatarUpload.single('avatar')(req, res, (err) => {
        if (err) {
          const msg =
            err.code === 'LIMIT_FILE_SIZE'
              ? 'Ficheiro demasiado grande (máx. 5 MB)'
              : err.message || 'Upload inválido';
          return res.status(400).json({ error: msg });
        }
        next();
      });
    },
    async (req, res) => {
      if (!isR2Configured()) {
        return res.status(503).json({ error: 'Armazenamento R2 não configurado no servidor' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Ficheiro em falta (campo avatar)' });
      }
      try {
        const prev = await Character.findOne({ _id: req.params.id, ownerUid: req.user.uid })
          .select('avatar name ownerEmail')
          .lean();
        if (!prev) {
          return res.status(404).json({ error: 'Character not found' });
        }
        const email = await resolveUserEmail(req, prev);
        if (!email) {
          return res.status(400).json({
            error:
              'Email do utilizador não disponível. Refaça o login com Google ou email, ou actualize a conta no Firebase.',
          });
        }
        const result = await uploadAvatarBuffer({
          email,
          originalFilename: req.file.originalname || 'avatar.png',
          characterName: prev.name || 'personagem',
          buffer: req.file.buffer,
          contentType: req.file.mimetype,
        });
        if (!result) {
          return res.status(503).json({ error: 'Upload falhou' });
        }
        if (prev.avatar) {
          await deleteAvatarByPublicUrl(prev.avatar, email, req.user.uid);
        }
        await Character.findByIdAndUpdate(req.params.id, { avatar: result.publicUrl });
        res.json({ url: result.publicUrl });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  );

  app.post('/api/characters/:id', async (req, res) => {
    const id = req.params.id;
    if (!req.body || typeof req.body !== 'object' || !req.body.name) {
      return res.status(400).json({ error: 'Invalid body: "name" field is required' });
    }
    try {
      const existing = await Character.findById(id).select('ownerUid').lean();
      if (existing && existing.ownerUid !== req.user.uid) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

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
      const doc = await Character.findOneAndDelete({ _id: req.params.id, ownerUid: req.user.uid });
      if (doc?.avatar) {
        const email = (await resolveUserEmail(req, doc)) || doc.ownerEmail || '';
        await deleteAvatarByPublicUrl(doc.avatar, email, req.user.uid);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Parties
  function generatePartyId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function generateInviteCode() {
    let code = '';
    for (let i = 0; i < 6; i++) code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
    return code;
  }

  async function uniqueInviteCode() {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = generateInviteCode();
      const exists = await Party.exists({ inviteCode: code });
      if (!exists) return code;
    }
    return generateInviteCode() + generateInviteCode().slice(0, 2);
  }

  function toPartyJson(doc) {
    const { _id, __v, createdAt, updatedAt, ...rest } = doc;
    return { id: _id, ...rest };
  }

  app.get('/api/parties', async (req, res) => {
    try {
      const docs = await Party.find({
        $or: [
          { ownerUid: req.user.uid },
          { 'members.uid': req.user.uid },
        ],
      }).lean();
      res.json(docs.map(toPartyJson));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/parties', async (req, res) => {
    const { name, system } = req.body || {};
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
      const inviteCode = await uniqueInviteCode();
      const party = await Party.create({
        _id: id,
        name: name.trim(),
        system: system || 'tormenta',
        inviteCode,
        members: [{
          uid: req.user.uid,
          email: owners.ownerEmail,
          characterIds: [],
          joinedAt: new Date(),
        }],
        ...owners,
      });
      res.json(toPartyJson(party.toObject()));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/parties/:id', async (req, res) => {
    try {
      const { name, system } = req.body || {};
      const update = {};
      if (name && typeof name === 'string') update.name = name.trim();
      if (system) update.system = system;

      const party = await Party.findOneAndUpdate(
        { _id: req.params.id, ownerUid: req.user.uid },
        update,
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

  app.post('/api/parties/join', async (req, res) => {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Código de convite é obrigatório' });
    }
    try {
      const party = await Party.findOne({ inviteCode: code.toUpperCase().trim() });
      if (!party) return res.status(404).json({ error: 'Código inválido ou expirado' });

      const alreadyMember = party.members.some((m) => m.uid === req.user.uid);
      if (!alreadyMember) {
        party.members.push({
          uid: req.user.uid,
          email: req.user.email ? String(req.user.email).trim().toLowerCase() : '',
          characterIds: [],
          joinedAt: new Date(),
        });
        await party.save();
        refs.broadcastPartyRoster(String(party._id));
      }
      res.json(toPartyJson(party.toObject()));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/parties/:id/add-character', async (req, res) => {
    const { characterId } = req.body || {};
    if (!characterId || typeof characterId !== 'string') {
      return res.status(400).json({ error: 'characterId é obrigatório' });
    }
    try {
      const character = await Character.findOne({ _id: characterId, ownerUid: req.user.uid }).lean();
      if (!character) {
        return res.status(403).json({ error: 'Personagem não encontrado ou não pertence a você' });
      }

      const party = await Party.findOne({
        _id: req.params.id,
        'members.uid': req.user.uid,
      });
      if (!party) return res.status(404).json({ error: 'Party não encontrada ou você não é membro' });

      if (party.system !== character.system) {
        return res.status(400).json({ error: 'Personagem deve ser do mesmo sistema da party' });
      }

      const member = party.members.find((m) => m.uid === req.user.uid);
      if (member) {
        if (!member.characterIds) member.characterIds = [];
        if (!member.characterIds.includes(characterId)) {
          member.characterIds.push(characterId);
          await party.save();
          refs.broadcastPartyRoster(req.params.id);
        }
      }
      res.json(toPartyJson(party.toObject()));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/parties/:id/remove-character', async (req, res) => {
    const { characterId } = req.body || {};
    if (!characterId || typeof characterId !== 'string') {
      return res.status(400).json({ error: 'characterId é obrigatório' });
    }
    try {
      const party = await Party.findOne({
        _id: req.params.id,
        'members.uid': req.user.uid,
      });
      if (!party) return res.status(404).json({ error: 'Party não encontrada ou você não é membro' });

      const member = party.members.find((m) => m.uid === req.user.uid);
      if (member && member.characterIds) {
        member.characterIds = member.characterIds.filter((id) => id !== characterId);
        await party.save();
        refs.broadcastPartyRoster(req.params.id);
      }
      res.json(toPartyJson(party.toObject()));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/parties/:id/leave', async (req, res) => {
    try {
      const party = await Party.findById(req.params.id);
      if (!party) return res.status(404).json({ error: 'Party não encontrada' });

      if (party.ownerUid === req.user.uid) {
        return res.status(400).json({ error: 'O dono não pode sair da party. Delete-a em vez disso.' });
      }

      party.members = party.members.filter((m) => m.uid !== req.user.uid);
      await party.save();
      refs.broadcastPartyRoster(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/parties/:id/members/:uid', async (req, res) => {
    try {
      const party = await Party.findOne({ _id: req.params.id, ownerUid: req.user.uid });
      if (!party) return res.status(404).json({ error: 'Party não encontrada ou você não é o dono' });

      if (req.params.uid === party.ownerUid) {
        return res.status(400).json({ error: 'Não é possível remover o dono da party' });
      }

      party.members = party.members.filter((m) => m.uid !== req.params.uid);
      await party.save();
      refs.broadcastPartyRoster(req.params.id);
      res.json(toPartyJson(party.toObject()));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/parties/:id/regenerate-code', async (req, res) => {
    try {
      const inviteCode = await uniqueInviteCode();
      const party = await Party.findOneAndUpdate(
        { _id: req.params.id, ownerUid: req.user.uid },
        { inviteCode },
        { new: true },
      ).lean();
      if (!party) return res.status(404).json({ error: 'Party não encontrada ou você não é o dono' });
      res.json(toPartyJson(party));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/parties/:id/characters', async (req, res) => {
    try {
      const party = await Party.findOne({
        _id: req.params.id,
        'members.uid': req.user.uid,
      }).lean();
      if (!party) return res.status(404).json({ error: 'Party não encontrada ou você não é membro' });

      const charIds = party.members
        .flatMap((m) => m.characterIds || [])
        .filter(Boolean);

      if (charIds.length === 0) return res.json([]);

      const characters = await Character.find({ _id: { $in: charIds } })
        .select('_id name avatar classes system ownerUid ownerEmail hp mp')
        .lean();
      res.json(characters.map(cleanMongoFields));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Combat (nested under parties)
  app.get('/api/parties/:id/combat', async (req, res) => {
    try {
      const party = await Party.findOne({
        _id: req.params.id,
        $or: [{ ownerUid: req.user.uid }, { 'members.uid': req.user.uid }],
      }).lean();
      if (!party) return res.status(403).json({ error: 'Acesso negado' });

      const data = await combatState.loadCombat(req.params.id);
      const { _id, __v, createdAt, updatedAt, ...clean } = data;
      res.json(clean);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/parties/:id/combat', async (req, res) => {
    try {
      const party = await Party.findOne({
        _id: req.params.id,
        $or: [{ ownerUid: req.user.uid }, { 'members.uid': req.user.uid }],
      }).lean();
      if (!party) return res.status(403).json({ error: 'Acesso negado' });

      const { id } = req.params;
      combatState.combatCache[id] = req.body;
      await combatState.saveCombat(id, req.body);
      refs.broadcastCombat(id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  if (fs.existsSync(DIST_DIR)) {
    app.get('*', (req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }
}

module.exports = { registerRoutes };
