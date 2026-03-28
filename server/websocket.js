const { WebSocketServer } = require('ws');
const combatState = require('./combatState');
const Party = require('./db/models/Party');
const { adminAuth } = require('./auth/firebaseAdmin');

/**
 * @param {import('http').Server} server
 * @param {{ refs: { broadcastCombat: (partyId?: string) => void } }} opts
 */
function attachWebSocket(server, opts) {
  const { refs } = opts;
  const wss = new WebSocketServer({ server });

  refs.broadcastCombat = function broadcastCombat(partyId) {
    const data = combatState.combatCache[partyId] || combatState.COMBAT_DEFAULT;
    const msg = JSON.stringify({ type: 'combat_sync', partyId, data });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(msg);
    });
  };

  refs.broadcastPartyRoster = function broadcastPartyRoster(partyId) {
    const msg = JSON.stringify({ type: 'party_roster_sync', partyId });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(msg);
    });
  };

  wss.on('connection', (ws, req) => {
    if (!adminAuth) {
      ws.close(1011, 'Auth unavailable');
      return;
    }

    (async () => {
      try {
        const url = new URL(req.url || '/', 'http://localhost');
        const token = url.searchParams.get('token');
        if (!token) {
          ws.close(1008, 'Token required');
          return;
        }
        const decoded = await adminAuth.verifyIdToken(token);
        ws.userUid = decoded.uid;
      } catch {
        ws.close(1008, 'Invalid token');
        return;
      }

      ws.on('message', (raw) => {
        void (async () => {
          try {
            const msg = JSON.parse(raw.toString());
            if (!ws.userUid) return;

            if (msg.type === 'combat_update' && msg.data) {
              const pid = msg.partyId;
              if (!pid) return;

              const party = await Party.findOne({
                _id: pid,
                $or: [{ ownerUid: ws.userUid }, { 'members.uid': ws.userUid }],
              }).lean();
              if (!party) return;

              const isPartyOwner = party.ownerUid === ws.userUid;
              const existing = await combatState.loadCombat(pid);
              const merged = combatState.mergeCombatWrite(existing, msg.data, isPartyOwner);
              combatState.combatCache[pid] = merged;
              await combatState.saveCombat(pid, merged);
              const out = JSON.stringify({ type: 'combat_sync', partyId: pid, data: merged });
              wss.clients.forEach((c) => {
                if (c !== ws && c.readyState === 1) c.send(out);
              });
              return;
            }

            if (msg.type === 'character_hp_update' && msg.characterId) {
              const out = JSON.stringify({
                type: 'character_hp_sync',
                characterId: msg.characterId,
                name: msg.name,
                hp: msg.hp,
                mp: msg.mp,
              });
              wss.clients.forEach((c) => {
                if (c !== ws && c.readyState === 1) c.send(out);
              });
              return;
            }

            if (msg.type === 'master_hp_update' && msg.characterId) {
              const out = JSON.stringify({
                type: 'master_hp_sync',
                characterId: msg.characterId,
                name: msg.name,
                currentHp: msg.currentHp,
              });
              wss.clients.forEach((c) => {
                if (c !== ws && c.readyState === 1) c.send(out);
              });
              return;
            }

            if (msg.type === 'character_spell_cast' && msg.characterId) {
              const out = JSON.stringify({
                type: 'character_spell_cast_sync',
                characterId: msg.characterId,
                name: msg.name,
                spellName: msg.spellName,
                mpCost: msg.mpCost,
              });
              wss.clients.forEach((c) => {
                if (c !== ws && c.readyState === 1) c.send(out);
              });
            }
          } catch (err) {
            console.error('WS message error:', err.message);
          }
        })();
      });
    })();
  });

  return wss;
}

module.exports = { attachWebSocket };
