# Calendário de sessões do grupo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any member of a party (including the GM) propose a session date/time, have every member confirm or decline it, show a red warning listing who's still pending or declined, and email the other members when a new date is proposed.

**Architecture:** `sessionProposals` is embedded directly in the existing `Party` Mongoose document (no new collection). Three new REST endpoints follow the exact existing party-service layering (routes → controller → service → repository, `AppError` for validation, `refs.broadcastPartyRoster(id)` after every mutation). Real-time sync reuses the existing `party_roster_sync` WebSocket broadcast — no new message type. A new optional `email.service.js` sends a Resend notification on proposal creation, fire-and-forget, never blocking or failing the request. On the client, a new `PartyCalendarPage` is added as a third tab beside "Membros"/"Combate".

**Tech Stack:** Express 4 + Mongoose 9 (backend), React 19 + TypeScript + Vite (frontend), `ws` for WebSocket, Resend SDK for email, Vitest for the one piece of genuinely unit-testable logic (pending/confirmed computation).

**Spec:** `docs/superpowers/specs/2026-08-18-party-calendar-design.md`

## Global Constraints

- Backend has **no test runner configured** (no jest/mocha/vitest for `server/`) — this was an explicit, already-approved decision in the spec. Per-task backend verification uses standalone `node -e` scripts (Mongoose `validateSync()` needs no DB connection; a couple of tasks use the real local MongoDB at `mongodb://localhost:27017/arcanaforge`, already running and reachable in this dev environment). Do not add a backend test framework as part of this plan.
- Client has Vitest configured (`client/vitest.config.ts`, `include: ['src/**/*.test.ts']`, pure `.ts` only — no component tests). Only Task 7 (pure utility functions) gets real automated tests; that's the existing project convention (`calculations.test.ts`, `attackCompose.test.ts`).
- Every mutating session-proposal operation must call `refs.broadcastPartyRoster(partyId)` — no new WebSocket message type.
- `sessionProposals` requires **no DTO change**: `toPartyDTO` already spreads `...rest`, and the new sub-schemas use `{ _id: false }`, so nothing extra leaks to the client.
- `sessionProposals` requires **no repository change**: `partyRepository.findMemberParty(id, uid)` already returns a full (non-lean) Mongoose document ready for `.save()`.
- Email sending must never throw into the request path — always `.catch()` at the call site, and the service must no-op cleanly when `RESEND_API_KEY` is unset.
- Use native `<input type="date">` / `<input type="time">` — no custom date-picker widget.
- Do not touch the live Docker production container (`arcanaforge-app-1`) or run `docker compose build/up` as part of this plan — that only happens if the user explicitly asks to deploy, same as every prior phase this session.
- After all tasks: `cd client && npx tsc -b --force` must show zero output, `npx vitest run` must pass with the new tests included, and `npx eslint <touched files>` must not introduce new violations (pre-existing baseline violations in files you touch are not yours to fix — see repo convention from prior phases).

---

### Task 1: Party schema — `sessionProposals` field

**Files:**
- Modify: `server/db/models/Party.js`

**Interfaces:**
- Produces: `partySchema` gains a `sessionProposals` array field. Shape consumed by Task 3:
  `{ id: string, proposedBy: string, date: string, time: string, createdAt: Date, responses: Array<{ uid: string, vote: 'sim'|'nao', respondedAt: Date }> }`

- [ ] **Step 1: Add the two new sub-schemas and the field**

Current file (`server/db/models/Party.js`) is:

```js
const mongoose = require('mongoose');

const partyMemberSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    email: { type: String, default: '' },
    characterIds: { type: [String], default: [] },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const partySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    system: { type: String, default: 'tormenta' },
    inviteCode: { type: String, unique: true, sparse: true, index: true },
    members: { type: [partyMemberSchema], default: [] },
    ownerUid: { type: String, index: true },
    ownerEmail: { type: String, index: true },
  },
  {
    timestamps: true,
    collection: 'parties',
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model('Party', partySchema);
```

Replace it with:

```js
const mongoose = require('mongoose');

const partyMemberSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    email: { type: String, default: '' },
    characterIds: { type: [String], default: [] },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sessionResponseSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    vote: { type: String, enum: ['sim', 'nao'], required: true },
    respondedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sessionProposalSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    proposedBy: { type: String, required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    time: { type: String, default: '' }, // 'HH:mm', opcional
    createdAt: { type: Date, default: Date.now },
    responses: { type: [sessionResponseSchema], default: [] },
  },
  { _id: false },
);

const partySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    system: { type: String, default: 'tormenta' },
    inviteCode: { type: String, unique: true, sparse: true, index: true },
    members: { type: [partyMemberSchema], default: [] },
    ownerUid: { type: String, index: true },
    ownerEmail: { type: String, index: true },
    sessionProposals: { type: [sessionProposalSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'parties',
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model('Party', partySchema);
```

- [ ] **Step 2: Verify with a standalone validation script (no DB connection needed)**

Run from the repo root:

```bash
node -e "
const Party = require('./server/db/models/Party');

const valid = new Party({
  _id: 'test123',
  name: 'Test',
  ownerUid: 'u1',
  sessionProposals: [{
    id: 'sp1',
    proposedBy: 'u1',
    date: '2026-08-23',
    time: '19:00',
    responses: [{ uid: 'u1', vote: 'sim' }],
  }],
});
const err1 = valid.validateSync();
console.log(err1 ? 'FAIL valid doc: ' + err1.message : 'OK: valid doc passes');

const invalidVote = new Party({
  _id: 'test456',
  name: 'Test2',
  ownerUid: 'u1',
  sessionProposals: [{ id: 'sp2', proposedBy: 'u1', date: '2026-08-23', responses: [{ uid: 'u1', vote: 'talvez' }] }],
});
const err2 = invalidVote.validateSync();
console.log(err2 ? 'OK: invalid vote rejected' : 'FAIL: invalid vote was accepted');

const missingDate = new Party({
  _id: 'test789',
  name: 'Test3',
  ownerUid: 'u1',
  sessionProposals: [{ id: 'sp3', proposedBy: 'u1' }],
});
const err3 = missingDate.validateSync();
console.log(err3 ? 'OK: missing date rejected' : 'FAIL: missing date was accepted');

const backwardCompat = new Party({ _id: 'test999', name: 'NoProposals', ownerUid: 'u1' });
const err4 = backwardCompat.validateSync();
console.log(err4 ? 'FAIL backward-compat: ' + err4.message : 'OK: party without sessionProposals still validates (default [])');
console.log('sessionProposals default is array:', Array.isArray(backwardCompat.sessionProposals));
"
```

Expected output (4 `OK:` lines, no `FAIL`):
```
OK: valid doc passes
OK: invalid vote rejected
OK: missing date rejected
OK: party without sessionProposals still validates (default [])
sessionProposals default is array: true
```

- [ ] **Step 3: Commit**

```bash
git add server/db/models/Party.js
git commit -m "feat(party-calendar): add sessionProposals schema to Party model"
```

---

### Task 2: Email service (Resend)

**Files:**
- Create: `server/src/services/email.service.js`
- Modify: `package.json` (repo root — this is where the server's dependencies live; there is no separate `server/package.json`)
- Modify: `.env.example`

**Interfaces:**
- Produces: `sendSessionProposalEmail(party, proposal)` — async function, resolves to `undefined` in every case (no-op when unconfigured, no-op when no recipients, throws only on a genuine Resend API failure so the caller's `.catch()` in Task 3 can log it).
- Consumes: a live Mongoose `Party` document (has `.members`, `._id`, `.name` accessible directly — not a DTO) and a plain proposal object `{ id, proposedBy, date, time, createdAt, responses }`.

- [ ] **Step 1: Install the `resend` package**

```bash
npm install resend
```

- [ ] **Step 2: Create `server/src/services/email.service.js`**

```js
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'ArcanaForge <onboarding@resend.dev>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function sendSessionProposalEmail(party, proposal) {
  if (!resend) return; // sem chave configurada: recurso continua funcionando só via UI

  const proposer = party.members.find((m) => m.uid === proposal.proposedBy);
  const recipients = party.members
    .filter((m) => m.uid !== proposal.proposedBy && m.email)
    .map((m) => m.email);
  if (recipients.length === 0) return;

  const when = proposal.time ? `${proposal.date} às ${proposal.time}` : proposal.date;
  const link = `${CLIENT_URL}/tormenta/party/${party._id}/calendar`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: recipients,
    subject: `${party.name}: nova data de sessão proposta`,
    html: `<p>${proposer?.email || 'Alguém'} propôs jogar em <strong>${when}</strong>.</p>
           <p><a href="${link}">Confirme ou recuse aqui</a>.</p>`,
    text: `${proposer?.email || 'Alguém'} propôs jogar em ${when}. Confirme ou recuse em: ${link}`,
  });
}

module.exports = { sendSessionProposalEmail };
```

- [ ] **Step 3: Add env vars to `.env.example`**

Add after the `MONGODB_URI` line:

```
# Resend (e-mail de notificação de propostas de sessão). SEGREDO.
RESEND_API_KEY=
EMAIL_FROM=ArcanaForge <onboarding@resend.dev>
```

(`CLIENT_URL` already exists in `.env.example` for the Stripe flow — reused as-is, no new variable needed for it.)

- [ ] **Step 4: Verify the no-op path (no API key configured)**

This is the realistic default state for local dev right now (no `RESEND_API_KEY` in `.env`). Run from the repo root:

```bash
node -e "
const { sendSessionProposalEmail } = require('./server/src/services/email.service');
const party = {
  _id: 'p1',
  name: 'Grupo Teste',
  members: [
    { uid: 'u1', email: 'proponente@example.com' },
    { uid: 'u2', email: 'jogador2@example.com' },
  ],
};
const proposal = { id: 'sp1', proposedBy: 'u1', date: '2026-08-23', time: '19:00' };
sendSessionProposalEmail(party, proposal)
  .then(() => console.log('OK: no-op resolved cleanly with no RESEND_API_KEY set'))
  .catch((err) => console.log('FAIL: threw when it should no-op:', err.message));
"
```

Expected output: `OK: no-op resolved cleanly with no RESEND_API_KEY set`

(Do not test the real Resend send path in this task — that requires an actual API key and is covered by the spec's manual test plan once the whole feature is wired up and the user decides to configure Resend.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json server/src/services/email.service.js .env.example
git commit -m "feat(party-calendar): add optional Resend email service for session proposals"
```

---

### Task 3: Party service — propose/respond/cancel business logic

**Files:**
- Modify: `server/src/services/party.service.js`

**Interfaces:**
- Consumes: `Party` model with `sessionProposals` (Task 1), `sendSessionProposalEmail` from `./email.service` (Task 2), existing `partyRepository.findMemberParty(id, uid)`, existing `toPartyDTO`, existing `AppError`, existing `generatePartyId` (already imported in this file via `../utils/inviteCode`).
- Produces: three new functions on the object returned by `createPartyService(refs)`:
  - `proposeSession(partyId, body, req): Promise<PartyDTO>`
  - `respondToSession(partyId, proposalId, body, uid): Promise<PartyDTO>`
  - `cancelSession(partyId, proposalId, uid): Promise<PartyDTO>`
  These exact names/signatures are what Task 4's controller calls.

- [ ] **Step 1: Add the `sendSessionProposalEmail` import**

At the top of `server/src/services/party.service.js`, the current imports are:

```js
const { ownerFieldsFromReq } = require('../../characters/userCharactersDir');
const { AppError } = require('../errors/AppError');
const { toPartyDTO, toPartyCharacterDTO } = require('../dto/party.dto');
const { toCharacterDetailDTO } = require('../dto/character.dto');
const { generatePartyId, generateInviteCode } = require('../utils/inviteCode');
const partyRepository = require('../repositories/party.repository');
const characterRepository = require('../repositories/character.repository');
const characterContentRepository = require('../repositories/characterContent.repository');
const characterLogsRepository = require('../repositories/characterLogs.repository');
const combatRepository = require('../repositories/combat.repository');
const { mergeCharacterDocs } = require('./character.service');
```

Add one line after the `mergeCharacterDocs` import:

```js
const { sendSessionProposalEmail } = require('./email.service');
```

- [ ] **Step 2: Add validation helpers and the three functions**

Inside `createPartyService(refs)`, immediately after the closing brace of `applyBuff` (the function ends with `return { ok: true, appliedTo, failed }; }` right before the file's final `return { listParties, ... };` block), insert:

```js
  async function proposeSession(partyId, body, req) {
    const { date, time } = body || {};
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError(400, 'Data inválida (esperado YYYY-MM-DD)');
    }
    if (time && (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time))) {
      throw new AppError(400, 'Horário inválido (esperado HH:mm)');
    }

    const party = await partyRepository.findMemberParty(partyId, req.user.uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

    const proposal = {
      id: generatePartyId(),
      proposedBy: req.user.uid,
      date,
      time: time || '',
      createdAt: new Date(),
      responses: [],
    };
    party.sessionProposals.push(proposal);
    await party.save();
    refs.broadcastPartyRoster(partyId);

    sendSessionProposalEmail(party, proposal).catch((err) => {
      console.error('Falha ao enviar e-mail de proposta de sessão:', err.message);
    });

    return toPartyDTO(party.toObject());
  }

  async function respondToSession(partyId, proposalId, body, uid) {
    const { vote } = body || {};
    if (vote !== 'sim' && vote !== 'nao') {
      throw new AppError(400, 'vote deve ser "sim" ou "nao"');
    }

    const party = await partyRepository.findMemberParty(partyId, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

    const proposal = party.sessionProposals.find((p) => p.id === proposalId);
    if (!proposal) throw new AppError(404, 'Proposta não encontrada');

    const existing = proposal.responses.find((r) => r.uid === uid);
    if (existing) {
      existing.vote = vote;
      existing.respondedAt = new Date();
    } else {
      proposal.responses.push({ uid, vote, respondedAt: new Date() });
    }
    await party.save();
    refs.broadcastPartyRoster(partyId);
    return toPartyDTO(party.toObject());
  }

  async function cancelSession(partyId, proposalId, uid) {
    const party = await partyRepository.findMemberParty(partyId, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

    const proposal = party.sessionProposals.find((p) => p.id === proposalId);
    if (!proposal) throw new AppError(404, 'Proposta não encontrada');
    if (proposal.proposedBy !== uid && party.ownerUid !== uid) {
      throw new AppError(403, 'Só quem propôs ou o dono do grupo pode cancelar');
    }

    party.sessionProposals = party.sessionProposals.filter((p) => p.id !== proposalId);
    await party.save();
    refs.broadcastPartyRoster(partyId);
    return toPartyDTO(party.toObject());
  }
```

- [ ] **Step 3: Add the three functions to the returned object**

The file currently ends with:

```js
  return {
    listParties,
    createParty,
    updateParty,
    deleteParty,
    joinParty,
    addCharacterToParty,
    removeCharacterFromParty,
    leaveParty,
    removeMember,
    regenerateCode,
    listPartyCharacters,
    getPartyCharacter,
    applyBuff,
  };
}

module.exports = { createPartyService };
```

Change it to:

```js
  return {
    listParties,
    createParty,
    updateParty,
    deleteParty,
    joinParty,
    addCharacterToParty,
    removeCharacterFromParty,
    leaveParty,
    removeMember,
    regenerateCode,
    listPartyCharacters,
    getPartyCharacter,
    applyBuff,
    proposeSession,
    respondToSession,
    cancelSession,
  };
}

module.exports = { createPartyService };
```

- [ ] **Step 4: Verify against the real local MongoDB**

MongoDB is already running locally at `mongodb://localhost:27017/arcanaforge` (confirmed reachable in this environment). Run from the repo root — this creates a throwaway party, exercises all three new functions plus the 403 path, and cleans up after itself:

```bash
node -e "
const mongoose = require('mongoose');
const Party = require('./server/db/models/Party');
const { createPartyService } = require('./server/src/services/party.service');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/arcanaforge');
  const refs = { broadcastPartyRoster: () => {} };
  const service = createPartyService(refs);

  const partyId = 'plantest_' + Date.now();
  await Party.create({
    _id: partyId,
    name: 'Plan Verify Party',
    ownerUid: 'owner1',
    members: [
      { uid: 'owner1', email: 'owner@test.com' },
      { uid: 'player2', email: 'player2@test.com' },
    ],
  });

  try {
    const req = { user: { uid: 'player2' } };
    let party = await service.proposeSession(partyId, { date: '2026-09-01', time: '19:00' }, req);
    const proposal = party.sessionProposals[0];
    console.log(proposal ? 'OK: proposal created' : 'FAIL: no proposal in result');

    party = await service.respondToSession(partyId, proposal.id, { vote: 'sim' }, 'player2');
    console.log(party.sessionProposals[0].responses.length === 1 ? 'OK: proposer vote recorded' : 'FAIL: vote missing');

    party = await service.respondToSession(partyId, proposal.id, { vote: 'sim' }, 'owner1');
    const allSim = party.sessionProposals[0].responses.every((r) => r.vote === 'sim');
    console.log(allSim && party.sessionProposals[0].responses.length === 2 ? 'OK: both members confirmed' : 'FAIL: confirmation state wrong');

    party = await service.respondToSession(partyId, proposal.id, { vote: 'nao' }, 'owner1');
    console.log(party.sessionProposals[0].responses.find((r) => r.uid === 'owner1').vote === 'nao' ? 'OK: vote change overwrote previous vote' : 'FAIL: vote change did not overwrite');

    let forbidden = false;
    try {
      await service.cancelSession(partyId, proposal.id, 'someoneElse');
    } catch (err) {
      forbidden = err.status === 403;
    }
    console.log(forbidden ? 'OK: non-proposer non-owner cannot cancel (403)' : 'FAIL: cancel authorization not enforced');

    party = await service.cancelSession(partyId, proposal.id, 'owner1');
    console.log(party.sessionProposals.length === 0 ? 'OK: owner cancelled proposal they did not create' : 'FAIL: cancel did not remove proposal');
  } finally {
    await Party.deleteOne({ _id: partyId });
    await mongoose.disconnect();
  }
}

main().catch((err) => { console.error('SCRIPT ERROR:', err); process.exit(1); });
"
```

Expected output (6 `OK:` lines, no `FAIL`):
```
OK: proposal created
OK: proposer vote recorded
OK: both members confirmed
OK: vote change overwrote previous vote
OK: non-proposer non-owner cannot cancel (403)
OK: owner cancelled proposal they did not create
```

- [ ] **Step 5: Commit**

```bash
git add server/src/services/party.service.js
git commit -m "feat(party-calendar): add proposeSession/respondToSession/cancelSession to party service"
```

---

### Task 4: Controller + routes — wire the 3 endpoints

**Files:**
- Modify: `server/src/controllers/party.controller.js`
- Modify: `server/src/routes/parties.routes.js`

**Interfaces:**
- Consumes: `partyService.proposeSession/respondToSession/cancelSession` (Task 3).
- Produces: `partyController.proposeSession/respondToSession/cancelSession` (thin `req`→service→`res.json` wrappers), and 3 registered Express routes.

This task has no business logic of its own — it is mechanical wiring identical in shape to every other controller method/route pair already in these two files. There is nothing here worth a database-backed test; verification is a route-registration check plus a visual pattern match.

- [ ] **Step 1: Add the 3 controller methods**

In `server/src/controllers/party.controller.js`, the file currently ends with:

```js
    async applyBuff(req, res) {
      res.json(await partyService.applyBuff(req.params.id, req.body, req.user.uid));
    },
  };
}

module.exports = { createPartyController };
```

Change it to:

```js
    async applyBuff(req, res) {
      res.json(await partyService.applyBuff(req.params.id, req.body, req.user.uid));
    },
    async proposeSession(req, res) {
      res.json(await partyService.proposeSession(req.params.id, req.body, req));
    },
    async respondToSession(req, res) {
      res.json(await partyService.respondToSession(req.params.id, req.params.proposalId, req.body, req.user.uid));
    },
    async cancelSession(req, res) {
      res.json(await partyService.cancelSession(req.params.id, req.params.proposalId, req.user.uid));
    },
  };
}

module.exports = { createPartyController };
```

- [ ] **Step 2: Add the 3 routes**

In `server/src/routes/parties.routes.js`, the file currently is:

```js
const { Router } = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { createPartyService } = require('../services/party.service');
const { createPartyController } = require('../controllers/party.controller');

function createPartyRoutes(refs) {
  const router = Router();
  const partyController = createPartyController(createPartyService(refs));

  router.get('/api/parties', asyncHandler(partyController.listParties));
  router.post('/api/parties', asyncHandler(partyController.createParty));
  router.put('/api/parties/:id', asyncHandler(partyController.updateParty));
  router.delete('/api/parties/:id', asyncHandler(partyController.deleteParty));
  router.post('/api/parties/join', asyncHandler(partyController.joinParty));
  router.post('/api/parties/:id/add-character', asyncHandler(partyController.addCharacter));
  router.post('/api/parties/:id/remove-character', asyncHandler(partyController.removeCharacter));
  router.post('/api/parties/:id/leave', asyncHandler(partyController.leaveParty));
  router.delete('/api/parties/:id/members/:uid', asyncHandler(partyController.removeMember));
  router.post('/api/parties/:id/regenerate-code', asyncHandler(partyController.regenerateCode));
  router.get('/api/parties/:id/characters', asyncHandler(partyController.listPartyCharacters));
  router.get('/api/parties/:id/characters/:characterId', asyncHandler(partyController.getPartyCharacter));
  router.post('/api/parties/:id/apply-buff', asyncHandler(partyController.applyBuff));
  return router;
}

module.exports = { createPartyRoutes };
```

Add these 3 lines right before `return router;`:

```js
  router.post('/api/parties/:id/sessions', asyncHandler(partyController.proposeSession));
  router.post('/api/parties/:id/sessions/:proposalId/respond', asyncHandler(partyController.respondToSession));
  router.delete('/api/parties/:id/sessions/:proposalId', asyncHandler(partyController.cancelSession));
```

- [ ] **Step 3: Verify route registration**

Run from the repo root:

```bash
node -e "
const { createPartyRoutes } = require('./server/src/routes/parties.routes');
const refs = { broadcastPartyRoster: () => {}, broadcastCombat: () => {}, broadcastBuffApplied: () => {} };
const router = createPartyRoutes(refs);
const paths = router.stack
  .filter((l) => l.route)
  .map((l) => Object.keys(l.route.methods)[0].toUpperCase() + ' ' + l.route.path);
console.log(paths.join('\n'));
console.log('---');
console.log(paths.includes('POST /api/parties/:id/sessions') ? 'OK: propose route registered' : 'FAIL: propose route missing');
console.log(paths.includes('POST /api/parties/:id/sessions/:proposalId/respond') ? 'OK: respond route registered' : 'FAIL: respond route missing');
console.log(paths.includes('DELETE /api/parties/:id/sessions/:proposalId') ? 'OK: cancel route registered' : 'FAIL: cancel route missing');
"
```

Expected: the full route list printed, followed by 3 `OK:` lines.

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/party.controller.js server/src/routes/parties.routes.js
git commit -m "feat(party-calendar): wire session proposal endpoints (controller + routes)"
```

---

### Task 5: Client types

**Files:**
- Modify: `client/src/types/party.ts`

**Interfaces:**
- Produces: `SessionResponse`, `SessionProposal` types; `Party.sessionProposals: SessionProposal[]`. These are what Tasks 6, 7, and 8 import.

- [ ] **Step 1: Update the file**

Current content:

```ts
import type { RPGSystem } from './character';

export interface PartyMember {
  uid: string;
  email: string;
  characterIds: string[];
  joinedAt: string;
}

export interface Party {
  id: string;
  name: string;
  system: RPGSystem;
  inviteCode: string;
  ownerUid: string;
  ownerEmail: string;
  members: PartyMember[];
}
```

Replace with:

```ts
import type { RPGSystem } from './character';

export interface PartyMember {
  uid: string;
  email: string;
  characterIds: string[];
  joinedAt: string;
}

export interface SessionResponse {
  uid: string;
  vote: 'sim' | 'nao';
  respondedAt: string;
}

export interface SessionProposal {
  id: string;
  proposedBy: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm' ou ''
  createdAt: string;
  responses: SessionResponse[];
}

export interface Party {
  id: string;
  name: string;
  system: RPGSystem;
  inviteCode: string;
  ownerUid: string;
  ownerEmail: string;
  members: PartyMember[];
  sessionProposals: SessionProposal[];
}
```

- [ ] **Step 2: Verify — this will intentionally show errors right now**

```bash
cd client && npx tsc -b --force
```

Expected: `Party` now requires `sessionProposals` on every object literal typed as `Party`. If any exist in the codebase (e.g. test fixtures), tsc will report them here — check the output. If errors appear in files this task doesn't own (e.g. a test helper building a fake `Party`), add `sessionProposals: []` to that literal as part of this task (it's the direct, mechanical consequence of this type change, same category of contingency as the Naruto-removal task's cross-file `tsc` fallout).

- [ ] **Step 3: Commit**

```bash
git add client/src/types/party.ts
git commit -m "feat(party-calendar): add SessionProposal/SessionResponse types"
```

(If Step 2 required touching other files, `git add` those too before committing.)

---

### Task 6: Client API functions

**Files:**
- Modify: `client/src/api/parties.ts`
- Modify: `client/src/api/index.ts`

**Interfaces:**
- Consumes: `Party`, `SessionProposal` types (Task 5); existing `apiFetch`/`assertOk` helpers already imported in `parties.ts`.
- Produces: `apiProposeSession(partyId, data)`, `apiRespondToSession(partyId, proposalId, vote)`, `apiCancelSession(partyId, proposalId)` — all `Promise<Party>`. These are what Task 8's page calls.

- [ ] **Step 1: Add the 3 functions to `client/src/api/parties.ts`**

Append at the end of the file (after `apiApplyBuffToParty`):

```ts
export async function apiProposeSession(
  partyId: string,
  data: { date: string; time?: string },
): Promise<Party> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  return res.json();
}

export async function apiRespondToSession(
  partyId: string,
  proposalId: string,
  vote: 'sim' | 'nao',
): Promise<Party> {
  const res = await apiFetch(
    `/api/parties/${encodeURIComponent(partyId)}/sessions/${encodeURIComponent(proposalId)}/respond`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    },
  );
  await assertOk(res);
  return res.json();
}

export async function apiCancelSession(partyId: string, proposalId: string): Promise<Party> {
  const res = await apiFetch(
    `/api/parties/${encodeURIComponent(partyId)}/sessions/${encodeURIComponent(proposalId)}`,
    { method: 'DELETE' },
  );
  await assertOk(res);
  return res.json();
}
```

- [ ] **Step 2: Re-export from the API barrel**

In `client/src/api/index.ts`, the current party-related export block is:

```ts
export {
  apiFetchParties,
  apiCreateParty,
  apiUpdateParty,
  apiDeleteParty,
  apiJoinParty,
  apiAddCharacterToParty,
  apiRemoveCharacterFromParty,
  apiLeaveParty,
  apiRemovePartyMember,
  apiRegenerateInviteCode,
  apiFetchPartyCharacters,
  apiLoadPartyCharacter,
  apiLoadCombat,
  apiSaveCombat,
  apiApplyBuffToParty,
} from './parties';
export type { PartyCharacter, ApplyBuffPayload } from './parties';
```

Change to:

```ts
export {
  apiFetchParties,
  apiCreateParty,
  apiUpdateParty,
  apiDeleteParty,
  apiJoinParty,
  apiAddCharacterToParty,
  apiRemoveCharacterFromParty,
  apiLeaveParty,
  apiRemovePartyMember,
  apiRegenerateInviteCode,
  apiFetchPartyCharacters,
  apiLoadPartyCharacter,
  apiLoadCombat,
  apiSaveCombat,
  apiApplyBuffToParty,
  apiProposeSession,
  apiRespondToSession,
  apiCancelSession,
} from './parties';
export type { PartyCharacter, ApplyBuffPayload } from './parties';
```

- [ ] **Step 3: Verify**

```bash
cd client && npx tsc -b --force
```

Expected: no output (zero errors).

- [ ] **Step 4: Commit**

```bash
git add client/src/api/parties.ts client/src/api/index.ts
git commit -m "feat(party-calendar): add client API functions for session proposals"
```

---

### Task 7: Session-proposal status utility (with real unit tests)

**Files:**
- Create: `client/src/utils/sessionProposals.ts`
- Create: `client/src/utils/sessionProposals.test.ts`

**Interfaces:**
- Consumes: `Party`, `SessionProposal` types (Task 5).
- Produces: `getProposalStatus(party, proposal): { confirmed: boolean, pending: string[], declined: string[] }` and `getMyVote(proposal, uid): 'sim' | 'nao' | null`. Task 8's page uses both to render the red/green status without duplicating this logic inline.

This is the one piece of this feature with real, pure, DB-free logic worth automated testing — same category as the existing `calculations.test.ts`/`attackCompose.test.ts`. Follow TDD: write the failing test first.

- [ ] **Step 1: Write the failing test**

Create `client/src/utils/sessionProposals.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Party, SessionProposal } from '../types/party';
import { getProposalStatus, getMyVote } from './sessionProposals';

function baseParty(overrides: Partial<Party> = {}): Party {
  return {
    id: 'party1',
    name: 'Grupo Teste',
    system: 'tormenta',
    inviteCode: 'ABC123',
    ownerUid: 'owner1',
    ownerEmail: 'owner@test.com',
    members: [
      { uid: 'owner1', email: 'owner@test.com', characterIds: [], joinedAt: '2026-01-01' },
      { uid: 'player2', email: 'player2@test.com', characterIds: [], joinedAt: '2026-01-01' },
      { uid: 'player3', email: 'player3@test.com', characterIds: [], joinedAt: '2026-01-01' },
    ],
    sessionProposals: [],
    ...overrides,
  };
}

function baseProposal(overrides: Partial<SessionProposal> = {}): SessionProposal {
  return {
    id: 'sp1',
    proposedBy: 'owner1',
    date: '2026-09-01',
    time: '19:00',
    createdAt: '2026-08-18T00:00:00.000Z',
    responses: [],
    ...overrides,
  };
}

describe('getProposalStatus', () => {
  it('marks every member without a response as pending', () => {
    const party = baseParty();
    const proposal = baseProposal({ responses: [] });
    const status = getProposalStatus(party, proposal);
    expect(status.confirmed).toBe(false);
    expect(status.pending.sort()).toEqual(['owner1', 'player2', 'player3']);
    expect(status.declined).toEqual([]);
  });

  it('lists members who voted "nao" as declined, not pending', () => {
    const party = baseParty();
    const proposal = baseProposal({
      responses: [
        { uid: 'owner1', vote: 'sim', respondedAt: '2026-08-18T01:00:00.000Z' },
        { uid: 'player2', vote: 'nao', respondedAt: '2026-08-18T01:00:00.000Z' },
      ],
    });
    const status = getProposalStatus(party, proposal);
    expect(status.confirmed).toBe(false);
    expect(status.pending).toEqual(['player3']);
    expect(status.declined).toEqual(['player2']);
  });

  it('is confirmed only when every member voted "sim"', () => {
    const party = baseParty();
    const proposal = baseProposal({
      responses: [
        { uid: 'owner1', vote: 'sim', respondedAt: '2026-08-18T01:00:00.000Z' },
        { uid: 'player2', vote: 'sim', respondedAt: '2026-08-18T01:00:00.000Z' },
        { uid: 'player3', vote: 'sim', respondedAt: '2026-08-18T01:00:00.000Z' },
      ],
    });
    const status = getProposalStatus(party, proposal);
    expect(status.confirmed).toBe(true);
    expect(status.pending).toEqual([]);
    expect(status.declined).toEqual([]);
  });
});

describe('getMyVote', () => {
  it('returns null when the member has not responded', () => {
    const proposal = baseProposal({ responses: [] });
    expect(getMyVote(proposal, 'owner1')).toBeNull();
  });

  it("returns the member's current vote", () => {
    const proposal = baseProposal({
      responses: [{ uid: 'owner1', vote: 'nao', respondedAt: '2026-08-18T01:00:00.000Z' }],
    });
    expect(getMyVote(proposal, 'owner1')).toBe('nao');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails (module doesn't exist yet)**

```bash
cd client && npx vitest run src/utils/sessionProposals.test.ts
```

Expected: FAIL — `Cannot find module './sessionProposals'` (or similar resolution error).

- [ ] **Step 3: Implement `client/src/utils/sessionProposals.ts`**

```ts
import type { Party, SessionProposal } from '../types/party';

export interface ProposalStatus {
  confirmed: boolean;
  pending: string[];
  declined: string[];
}

export function getProposalStatus(party: Party, proposal: SessionProposal): ProposalStatus {
  const pending: string[] = [];
  const declined: string[] = [];

  for (const member of party.members) {
    const response = proposal.responses.find((r) => r.uid === member.uid);
    if (!response) {
      pending.push(member.uid);
    } else if (response.vote === 'nao') {
      declined.push(member.uid);
    }
  }

  return { confirmed: pending.length === 0 && declined.length === 0, pending, declined };
}

export function getMyVote(proposal: SessionProposal, uid: string): 'sim' | 'nao' | null {
  return proposal.responses.find((r) => r.uid === uid)?.vote ?? null;
}
```

- [ ] **Step 4: Run the test again and confirm it passes**

```bash
cd client && npx vitest run src/utils/sessionProposals.test.ts
```

Expected: `5 passed` (all 5 `it` blocks).

- [ ] **Step 5: Run the full suite to confirm no regressions**

```bash
cd client && npx vitest run
```

Expected: all existing tests plus these 5 new ones pass (33 existing + 5 new, per the count noted in this session's earlier phases — confirm the total ticks up by exactly 5).

- [ ] **Step 6: Commit**

```bash
git add client/src/utils/sessionProposals.ts client/src/utils/sessionProposals.test.ts
git commit -m "feat(party-calendar): add getProposalStatus/getMyVote utilities with tests"
```

---

### Task 8: `PartyCalendarPage` — page, route, and nav wiring

**Files:**
- Create: `client/src/pages/PartyCalendarPage/PartyCalendarPage.tsx`
- Create: `client/src/pages/PartyCalendarPage/PartyCalendarPage.module.css`
- Modify: `client/src/App.tsx`
- Modify: `client/src/pages/PartyMembersPage/PartyMembersPage.tsx`
- Modify: `client/src/pages/GameMasterPage/GameMasterPage.tsx`

**Interfaces:**
- Consumes: `apiFetchParties`, `apiProposeSession`, `apiRespondToSession`, `apiCancelSession` (Task 6); `getProposalStatus`, `getMyVote` (Task 7); `Party`, `SessionProposal` (Task 5); existing `Topbar`, `SectionNav`, `Input`, `Button`, `ConfirmModal`, `AccessDeniedPage`, `useWebSocket`, `useAuth`, `getInitials`, `getAvatarColor` — all already used by `PartyMembersPage.tsx`, same import paths.
- Produces: the route `/:system/party/:partyId/calendar` and a third "Calendário" nav item on all 3 party pages.

- [ ] **Step 1: Create `client/src/pages/PartyCalendarPage/PartyCalendarPage.module.css`**

```css
.page {
  min-height: 100vh;
  background: var(--bg-body);
  color: var(--text-primary);
  font-family: var(--font);
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 30px 24px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.proposeForm {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}

.proposeField {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.proposeLabel {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.sectionTitle {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.proposalsList {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.proposalCard {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.proposalCardConfirmed {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.proposalHeader {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.proposalWhen {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.proposalBy {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.confirmedBanner {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-ink);
}

.warningBanner {
  font-size: 0.82rem;
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: 6px;
  padding: 8px 10px;
}

.memberChips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.memberChip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.memberChipSim {
  border-color: var(--accent);
  color: var(--accent-ink);
  background: var(--accent-soft);
}

.memberChipNao {
  border-color: var(--danger);
  color: var(--danger);
  background: var(--danger-soft);
}

.memberChipPending {
  border-color: var(--warn);
  color: var(--warn);
  background: var(--warn-soft);
}

.proposalActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.cancelLink {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.78rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-family: var(--font);
}

.cancelLink:hover {
  color: var(--danger);
}

.empty {
  text-align: center;
  padding: 40px 24px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 550px) {
  .content {
    padding: 16px 12px;
  }

  .proposeForm {
    flex-direction: column;
    align-items: stretch;
  }
}
```

- [ ] **Step 2: Create `client/src/pages/PartyCalendarPage/PartyCalendarPage.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetchParties, apiProposeSession, apiRespondToSession, apiCancelSession } from '../../api';
import type { Party, SessionProposal } from '../../types/party';
import { useAuth } from '../../features/auth';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { WsMessage } from '../../hooks/useWebSocket';
import { getProposalStatus, getMyVote } from '../../utils/sessionProposals';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './PartyCalendarPage.module.css';

function formatWhen(proposal: SessionProposal): string {
  return proposal.time ? `${proposal.date} às ${proposal.time}` : proposal.date;
}

function memberLabel(party: Party, uid: string): string {
  return party.members.find((m) => m.uid === uid)?.email || uid;
}

export default function PartyCalendarPage() {
  const { system, partyId } = useParams<{ system: string; partyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.uid ?? '';

  const [party, setParty] = useState<Party | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!partyId) return;
    try {
      const parties = await apiFetchParties();
      const found = parties.find((p) => p.id === partyId);
      if (!found) {
        setAccessDenied(true);
        return;
      }
      setParty(found);
    } catch (err) {
      console.error('Erro ao carregar calendário:', err);
    }
  }, [partyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useWebSocket(
    useCallback(
      (msg: WsMessage) => {
        if (msg.type === 'party_roster_sync' && msg.partyId === partyId) {
          loadDataRef.current();
        }
      },
      [partyId],
    ),
  );

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!party || !newDate) return;
    setSubmitting(true);
    try {
      const updated = await apiProposeSession(party.id, { date: newDate, time: newTime || undefined });
      setParty(updated);
      setNewDate('');
      setNewTime('');
    } catch (err) {
      console.error('Erro ao propor sessão:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (proposalId: string, vote: 'sim' | 'nao') => {
    if (!party) return;
    try {
      const updated = await apiRespondToSession(party.id, proposalId, vote);
      setParty(updated);
    } catch (err) {
      console.error('Erro ao votar:', err);
    }
  };

  const handleCancel = async (proposalId: string) => {
    if (!party) return;
    try {
      const updated = await apiCancelSession(party.id, proposalId);
      setParty(updated);
    } catch (err) {
      console.error('Erro ao cancelar proposta:', err);
    }
  };

  if (accessDenied) return <AccessDeniedPage />;

  if (!party) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  const isOwner = party.ownerUid === uid;
  const proposals = [...party.sessionProposals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const navItems = [
    { id: 'members', label: 'Membros', onClick: () => navigate(`/${system}/party/${partyId}/members`) },
    { id: 'combat', label: 'Combate', onClick: () => navigate(`/${system}/party/${partyId}`) },
    { id: 'calendar', label: 'Calendário', active: true },
  ];

  return (
    <div className={styles.page}>
      <Topbar title={`Grupo - ${party.name}`} showTormentaLogo />
      <SectionNav items={navItems} />

      <div className={styles.content}>
        <form className={styles.proposeForm} onSubmit={handlePropose}>
          <div className={styles.proposeField}>
            <label className={styles.proposeLabel} htmlFor="proposal-date">Data</label>
            <Input
              id="proposal-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>
          <div className={styles.proposeField}>
            <label className={styles.proposeLabel} htmlFor="proposal-time">Horário (opcional)</label>
            <Input
              id="proposal-time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" disabled={!newDate || submitting}>
            Propor data
          </Button>
        </form>

        <div>
          <h3 className={styles.sectionTitle}>Propostas ({proposals.length})</h3>

          {proposals.length === 0 ? (
            <p className={styles.empty}>Nenhuma data proposta ainda. Proponha uma acima.</p>
          ) : (
            <div className={styles.proposalsList}>
              {proposals.map((proposal) => {
                const status = getProposalStatus(party, proposal);
                const myVote = getMyVote(proposal, uid);
                const canCancel = proposal.proposedBy === uid || isOwner;

                return (
                  <div
                    key={proposal.id}
                    className={`${styles.proposalCard} ${status.confirmed ? styles.proposalCardConfirmed : ''}`}
                  >
                    <div className={styles.proposalHeader}>
                      <span className={styles.proposalWhen}>{formatWhen(proposal)}</span>
                      <span className={styles.proposalBy}>
                        Proposto por {memberLabel(party, proposal.proposedBy)}
                      </span>
                    </div>

                    {status.confirmed ? (
                      <div className={styles.confirmedBanner}>Sessão confirmada! 🎲</div>
                    ) : (
                      <div className={styles.warningBanner}>
                        {status.pending.length > 0 && (
                          <div>Aguardando: {status.pending.map((u) => memberLabel(party, u)).join(', ')}</div>
                        )}
                        {status.declined.length > 0 && (
                          <div>Recusaram: {status.declined.map((u) => memberLabel(party, u)).join(', ')}</div>
                        )}
                      </div>
                    )}

                    <div className={styles.memberChips}>
                      {party.members.map((member) => {
                        const vote = getMyVote(proposal, member.uid);
                        const chipClass = vote === 'sim'
                          ? styles.memberChipSim
                          : vote === 'nao'
                            ? styles.memberChipNao
                            : styles.memberChipPending;
                        return (
                          <span key={member.uid} className={`${styles.memberChip} ${chipClass}`}>
                            {member.email || member.uid}: {vote === 'sim' ? '✓' : vote === 'nao' ? '✗' : 'aguardando'}
                          </span>
                        );
                      })}
                    </div>

                    <div className={styles.proposalActions}>
                      <Button
                        type="button"
                        variant={myVote === 'sim' ? 'primary' : 'ghost'}
                        onClick={() => handleVote(proposal.id, 'sim')}
                      >
                        Sim, posso
                      </Button>
                      <Button
                        type="button"
                        variant={myVote === 'nao' ? 'primary' : 'ghost'}
                        onClick={() => handleVote(proposal.id, 'nao')}
                      >
                        Não posso
                      </Button>
                      {canCancel && (
                        <button
                          type="button"
                          className={styles.cancelLink}
                          onClick={() => handleCancel(proposal.id)}
                        >
                          Cancelar proposta
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the route in `client/src/App.tsx`**

Find the existing party routes:

```tsx
<Route path="/:system/party/:partyId" element={<RequireAuth><GameMasterPage /></RequireAuth>} />
<Route path="/:system/party/:partyId/members" element={<RequireAuth><PartyMembersPage /></RequireAuth>} />
<Route path="/:system/party/:partyId/char/:characterId" element={<RequireAuth><ViewCharacterPage /></RequireAuth>} />
```

Add a new route and its import (place the import alongside the other page imports, and the route alongside the other party routes):

```tsx
<Route path="/:system/party/:partyId/calendar" element={<RequireAuth><PartyCalendarPage /></RequireAuth>} />
```

```tsx
import PartyCalendarPage from './pages/PartyCalendarPage/PartyCalendarPage';
```

- [ ] **Step 4: Add the "Calendário" nav item to `PartyMembersPage.tsx`**

Current `navItems`:

```ts
const navItems = useMemo(
  () => [
    { id: 'members', label: 'Membros', active: true },
    { id: 'combat', label: 'Combate', onClick: () => {
      if (system && partyId) navigate(`/${system}/party/${partyId}`);
    }},
  ],
  [navigate, system, partyId],
);
```

Change to:

```ts
const navItems = useMemo(
  () => [
    { id: 'members', label: 'Membros', active: true },
    { id: 'combat', label: 'Combate', onClick: () => {
      if (system && partyId) navigate(`/${system}/party/${partyId}`);
    }},
    { id: 'calendar', label: 'Calendário', onClick: () => {
      if (system && partyId) navigate(`/${system}/party/${partyId}/calendar`);
    }},
  ],
  [navigate, system, partyId],
);
```

- [ ] **Step 5: Add the "Calendário" nav item to `GameMasterPage.tsx`**

Current `navItems` (inside `GameMasterContent`):

```ts
const navItems = useMemo(
  () => [
    { id: 'members', label: 'Membros', onClick: () => navigate(`/${system}/party/${party.id}/members`) },
    { id: 'combat', label: 'Combate', active: true },
  ],
  [navigate, party.id, system],
);
```

Change to:

```ts
const navItems = useMemo(
  () => [
    { id: 'members', label: 'Membros', onClick: () => navigate(`/${system}/party/${party.id}/members`) },
    { id: 'combat', label: 'Combate', active: true },
    { id: 'calendar', label: 'Calendário', onClick: () => navigate(`/${system}/party/${party.id}/calendar`) },
  ],
  [navigate, party.id, system],
);
```

- [ ] **Step 6: Type-check and lint**

```bash
cd client && npx tsc -b --force
```
Expected: no output.

```bash
cd client && npx eslint src/pages/PartyCalendarPage/PartyCalendarPage.tsx src/App.tsx src/pages/PartyMembersPage/PartyMembersPage.tsx src/pages/GameMasterPage/GameMasterPage.tsx
```
Expected: no new violations in the lines you added (pre-existing baseline violations elsewhere in these files are not this task's to fix, per this project's established convention).

- [ ] **Step 7: Manual end-to-end verification (dev server)**

Start the dev stack (client + server together):

```bash
npm run dev
```

In the browser (two different logged-in accounts/tabs that are both members of the same test party, or one account plus a second browser profile):
1. Open `/tormenta/party/<partyId>/calendar` — confirm the "Calendário" tab appears and is reachable from both "Membros" and "Combate" pages, and vice versa.
2. Propose a date from account A. Confirm it appears immediately (no refresh) in account B's tab via the WebSocket sync.
3. Vote "Sim" as account A, "Não" as account B. Confirm the red warning banner lists account B under "Recusaram" and any other party members under "Aguardando".
4. Change account B's vote to "Sim". Confirm the card switches to the green "Sessão confirmada! 🎲" state once every member has voted "sim".
5. Cancel the proposal from account A (the proposer). Confirm it disappears for both accounts.
6. Propose a second date from account B, then cancel it from the group owner's account (not the proposer) — confirm the owner-cancel path works.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/PartyCalendarPage client/src/App.tsx client/src/pages/PartyMembersPage/PartyMembersPage.tsx client/src/pages/GameMasterPage/GameMasterPage.tsx
git commit -m "feat(party-calendar): add PartyCalendarPage with route and nav wiring"
```

---

## Final verification (after all 8 tasks)

```bash
cd client && npx tsc -b --force
cd client && npx vitest run
```

Both must be clean (zero tsc output; all tests, including the 5 new ones from Task 7, passing). No deploy step is included in this plan — deploying to the live container is a separate, explicit decision the user makes afterward, same as every prior phase this session.
