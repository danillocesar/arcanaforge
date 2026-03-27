const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const AVATARS_DIR = path.join(DATA_DIR, 'avatars');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const CHARACTERS_DIR = path.join(DATA_DIR, 'characters');
const PARTIES_DIR = path.join(DATA_DIR, 'parties');
const COMBAT_DIR = path.join(DATA_DIR, 'combat');

function ensureDataDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  CHARACTERS_DIR,
  AVATARS_DIR,
  PARTIES_DIR,
  COMBAT_DIR,
  DIST_DIR,
  ensureDataDirs,
};
