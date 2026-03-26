const fs = require('fs');
const path = require('path');
const paths = require('../paths');
const Character = require('./models/Character');
const Party = require('./models/Party');
const Combat = require('./models/Combat');

const SENTINEL = '.migrated-mongo';

async function migrateCharacters() {
  const dir = paths.CHARACTERS_DIR;
  if (!fs.existsSync(dir)) return 0;

  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subFiles = fs.readdirSync(fullPath).filter((f) => f.endsWith('.json'));
      for (const f of subFiles) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(fullPath, f), 'utf-8'));
          const id = data._id || f.replace('.json', '');
          await Character.findByIdAndUpdate(id, { ...data, _id: id }, { upsert: true });
          count++;
        } catch (err) {
          console.error(`  [migrateToMongo] Error migrating character ${f}:`, err.message);
        }
      }
      continue;
    }

    if (!entry.name.endsWith('.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      const id = data._id || entry.name.replace('.json', '');
      await Character.findByIdAndUpdate(id, { ...data, _id: id }, { upsert: true });
      count++;
    } catch (err) {
      console.error(`  [migrateToMongo] Error migrating character ${entry.name}:`, err.message);
    }
  }

  return count;
}

async function migrateParties() {
  const dir = paths.PARTIES_DIR;
  if (!fs.existsSync(dir)) return 0;

  const fallbackEmail = (
    process.env.CHARACTERS_MIGRATION_OWNER_EMAIL ||
    process.env.FICHAS_MIGRATION_OWNER_EMAIL ||
    ''
  ).trim().toLowerCase();
  const fallbackUid = (
    process.env.CHARACTERS_MIGRATION_OWNER_UID ||
    process.env.FICHAS_MIGRATION_OWNER_UID ||
    ''
  ).trim();

  let count = 0;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      const id = data.id || data._id || f.replace('.json', '');
      const doc = {
        _id: id,
        name: data.name || '',
        system: data.system || 'tormenta',
        members: data.members || [],
        ownerUid: data.ownerUid || fallbackUid,
        ownerEmail: data.ownerEmail || fallbackEmail,
      };
      await Party.findByIdAndUpdate(id, doc, { upsert: true });
      count++;
    } catch (err) {
      console.error(`  [migrateToMongo] Error migrating party ${f}:`, err.message);
    }
  }

  return count;
}

async function migrateCombat() {
  const dir = paths.COMBAT_DIR;
  if (!fs.existsSync(dir)) return 0;

  let count = 0;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      const id = f.replace('.json', '');
      await Combat.findByIdAndUpdate(id, { ...data, _id: id }, { upsert: true });
      count++;
    } catch (err) {
      console.error(`  [migrateToMongo] Error migrating combat ${f}:`, err.message);
    }
  }

  return count;
}

async function run() {
  const sentinelPath = path.join(paths.DATA_DIR, SENTINEL);
  if (fs.existsSync(sentinelPath)) return;

  console.log('[migrateToMongo] Starting JSON -> MongoDB migration...');

  const chars = await migrateCharacters();
  const parties = await migrateParties();
  const combats = await migrateCombat();

  console.log(`[migrateToMongo] Migrated ${chars} characters, ${parties} parties, ${combats} combats.`);

  fs.writeFileSync(sentinelPath, new Date().toISOString(), 'utf-8');
  console.log('[migrateToMongo] Migration complete.');
}

module.exports = { run };
