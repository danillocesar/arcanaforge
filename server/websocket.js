const { WebSocketServer } = require('ws');
const combatState = require('./combatState');

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

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'combat_update' && msg.data) {
          const pid = msg.partyId;
          if (pid) {
            combatState.combatCache[pid] = msg.data;
            combatState.saveCombat(pid, msg.data).catch((e) =>
              console.error('WS combat save error:', e.message),
            );
            const out = JSON.stringify({ type: 'combat_sync', partyId: pid, data: msg.data });
            wss.clients.forEach((c) => {
              if (c !== ws && c.readyState === 1) c.send(out);
            });
          }
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
        }
      } catch (err) {
        console.error('WS message parse error:', err.message);
      }
    });
  });

  return wss;
}

module.exports = { attachWebSocket };
