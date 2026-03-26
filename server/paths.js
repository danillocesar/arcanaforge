const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const FICHAS_DIR = path.join(DATA_DIR, 'fichas');
const AVATARS_DIR = path.join(DATA_DIR, 'avatars');
const PARTIES_DIR = path.join(DATA_DIR, 'parties');
const COMBATE_DIR = path.join(DATA_DIR, 'combate');
const COMBATE_FILE = path.join(DATA_DIR, 'combate.json');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function ensureDataDirs() {
  [DATA_DIR, FICHAS_DIR, AVATARS_DIR, PARTIES_DIR, COMBATE_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

/** Move pastas/arquivos da raiz do projeto para data/ (uma vez). */
function migrateLegacyStorage() {
  const moves = [
    [path.join(ROOT_DIR, 'fichas'), FICHAS_DIR],
    [path.join(ROOT_DIR, 'avatars'), AVATARS_DIR],
    [path.join(ROOT_DIR, 'parties'), PARTIES_DIR],
  ];
  for (const [srcDir, destDir] of moves) {
    if (!fs.existsSync(srcDir)) continue;
    const files = fs.readdirSync(srcDir);
    for (const f of files) {
      const sp = path.join(srcDir, f);
      const dp = path.join(destDir, f);
      if (fs.statSync(sp).isDirectory()) continue;
      if (!fs.existsSync(dp)) fs.renameSync(sp, dp);
    }
    try {
      fs.rmdirSync(srcDir);
    } catch (_) { /* dir not empty */ }
  }
  try {
    const rootFiles = fs.readdirSync(ROOT_DIR);
    for (const f of rootFiles) {
      if (f.startsWith('combate-') && f.endsWith('.json')) {
        const partyId = f.slice('combate-'.length, -'.json'.length);
        const src = path.join(ROOT_DIR, f);
        const dest = path.join(COMBATE_DIR, `${partyId}.json`);
        if (!fs.existsSync(dest)) fs.renameSync(src, dest);
      }
    }
  } catch (_) {}
  const legacyCombate = path.join(ROOT_DIR, 'combate.json');
  const newCombate = path.join(DATA_DIR, 'combate.json');
  if (fs.existsSync(legacyCombate) && !fs.existsSync(newCombate)) {
    fs.renameSync(legacyCombate, newCombate);
  }
}

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  FICHAS_DIR,
  AVATARS_DIR,
  PARTIES_DIR,
  COMBATE_DIR,
  COMBATE_FILE,
  DIST_DIR,
  ensureDataDirs,
  migrateLegacyStorage,
};
