const fs = require('fs');
const path = require('path');
const paths = require('./paths');

const combateCache = {};

const COMBATE_DEFAULT = {
  inimigos: [],
  iniciativas: {},
  turnoIdx: -1,
  ordenado: false,
  rodada: 1,
};

function loadCombateForParty(partyId) {
  const filePath = path.join(paths.COMBATE_DIR, `${partyId}.json`);
  const legacyPath = path.join(paths.ROOT_DIR, `combate-${partyId}.json`);
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (fs.existsSync(legacyPath)) return JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
  } catch (_) {}
  return { ...COMBATE_DEFAULT };
}

function saveCombateForParty(partyId, data) {
  fs.writeFileSync(
    path.join(paths.COMBATE_DIR, `${partyId}.json`),
    JSON.stringify(data, null, 2),
    'utf-8',
  );
}

function loadCombateData() {
  try {
    if (fs.existsSync(paths.COMBATE_FILE)) {
      return JSON.parse(fs.readFileSync(paths.COMBATE_FILE, 'utf-8'));
    }
  } catch (_) {}
  return { ...COMBATE_DEFAULT };
}

let combateData = loadCombateData();

module.exports = {
  combateCache,
  COMBATE_DEFAULT,
  get combateData() {
    return combateData;
  },
  set combateData(v) {
    combateData = v;
  },
  loadCombateForParty,
  saveCombateForParty,
};
