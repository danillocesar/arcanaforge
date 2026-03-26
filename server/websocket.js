const fs = require('fs');
const { WebSocketServer } = require('ws');
const paths = require('./paths');
const combateState = require('./combateState');

/**
 * @param {import('http').Server} server
 * @param {{ refs: { broadcastCombate: (partyId?: string) => void } }} opts
 */
function attachWebSocket(server, opts) {
  const { refs } = opts;
  const wss = new WebSocketServer({ server });

  refs.broadcastCombate = function broadcastCombate(partyId) {
    if (partyId) {
      const data = combateState.combateCache[partyId] || combateState.COMBATE_DEFAULT;
      const msg = JSON.stringify({ type: 'combate_sync', partyId, data });
      wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(msg);
      });
    } else {
      const msg = JSON.stringify({ type: 'combate_sync', data: combateState.combateData });
      wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(msg);
      });
    }
  };

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'combate_update' && msg.data) {
          const pid = msg.partyId;
          if (pid) {
            combateState.combateCache[pid] = msg.data;
            combateState.saveCombateForParty(pid, msg.data);
            const out = JSON.stringify({ type: 'combate_sync', partyId: pid, data: msg.data });
            wss.clients.forEach((c) => {
              if (c !== ws && c.readyState === 1) c.send(out);
            });
          } else {
            combateState.combateData = msg.data;
            fs.writeFileSync(
              paths.COMBATE_FILE,
              JSON.stringify(combateState.combateData, null, 2),
              'utf-8',
            );
            const out = JSON.stringify({ type: 'combate_sync', data: combateState.combateData });
            wss.clients.forEach((c) => {
              if (c !== ws && c.readyState === 1) c.send(out);
            });
          }
        }
        if (msg.type === 'ficha_hp_update' && msg.fichaId) {
          const out = JSON.stringify({
            type: 'ficha_hp_sync',
            fichaId: msg.fichaId,
            nome: msg.nome,
            pv: msg.pv,
            pm: msg.pm,
          });
          wss.clients.forEach((c) => {
            if (c !== ws && c.readyState === 1) c.send(out);
          });
        }
        if (msg.type === 'mestre_hp_update' && msg.fichaId) {
          const out = JSON.stringify({
            type: 'mestre_hp_sync',
            fichaId: msg.fichaId,
            nome: msg.nome,
            pvAtual: msg.pvAtual,
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
