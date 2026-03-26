const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { emailToFolderSegment } = require('./fichas/userFichasDir');

/**
 * Move fichas JSON ainda na raiz de data/fichas/ para data/fichas/<segmento>/.
 * Defina FICHAS_MIGRATION_OWNER_EMAIL (e opcionalmente FICHAS_MIGRATION_OWNER_UID) no .env.
 * @param {{ FICHAS_DIR: string }} dirs
 */
function migrateFlatFichasToUserFolder({ FICHAS_DIR }) {
  let entries;
  try {
    entries = fs.readdirSync(FICHAS_DIR, { withFileTypes: true });
  } catch {
    return;
  }
  const flatJson = entries.filter((e) => e.isFile() && e.name.endsWith('.json')).map((e) => e.name);
  if (flatJson.length === 0) return;

  const email = process.env.FICHAS_MIGRATION_OWNER_EMAIL;
  if (!email || !String(email).trim()) {
    console.warn(
      '[migrate] Existem fichas JSON na raiz de data/fichas. Defina FICHAS_MIGRATION_OWNER_EMAIL no .env para movê-las para a pasta do utilizador.'
    );
    return;
  }

  const segment = emailToFolderSegment(email.trim());
  const destDir = path.join(FICHAS_DIR, segment);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const uidMigration = process.env.FICHAS_MIGRATION_OWNER_UID;

  for (const f of flatJson) {
    const src = path.join(FICHAS_DIR, f);
    const dest = path.join(destDir, f);
    try {
      const raw = fs.readFileSync(src, 'utf-8');
      const data = JSON.parse(raw);
      data.ownerEmail = String(email).trim().toLowerCase();
      if (uidMigration && String(uidMigration).trim()) {
        data.ownerUid = String(uidMigration).trim();
      }
      fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8');
      fs.unlinkSync(src);
      console.log(`  Migrated ficha to user folder: ${f} -> ${segment}/`);
    } catch (err) {
      console.error(`  Error migrating ${f} to user folder:`, err.message);
    }
  }
}

/**
 * @param {{ FICHAS_DIR: string, AVATARS_DIR: string, PARTIES_DIR: string }} dirs
 */
function run(dirs) {
  const { FICHAS_DIR, AVATARS_DIR, PARTIES_DIR } = dirs;
  const files = fs.readdirSync(FICHAS_DIR).filter((f) => f.endsWith('.json'));
  const nameToIdMap = {};

  for (const f of files) {
    const fp = path.join(FICHAS_DIR, f);
    try {
      const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      if (data._id) {
        nameToIdMap[data.nome || f.replace('.json', '')] = data._id;
        const expected = `${data._id}.json`;
        if (f !== expected) {
          fs.renameSync(fp, path.join(FICHAS_DIR, expected));
        }
        continue;
      }
      const id = crypto.randomUUID();
      const oldName = f.replace('.json', '');
      data._id = id;
      nameToIdMap[data.nome || oldName] = id;
      fs.writeFileSync(path.join(FICHAS_DIR, `${id}.json`), JSON.stringify(data, null, 2), 'utf-8');
      if (f !== `${id}.json`) fs.unlinkSync(fp);

      const avatarFiles = fs.readdirSync(AVATARS_DIR);
      for (const af of avatarFiles) {
        const parsed = path.parse(af);
        if (parsed.name === oldName || parsed.name === oldName.toLowerCase()) {
          const newAvatarName = `${id}${parsed.ext}`;
          fs.renameSync(path.join(AVATARS_DIR, af), path.join(AVATARS_DIR, newAvatarName));
          if (data.avatar) {
            data.avatar = `/avatars/${newAvatarName}`;
            fs.writeFileSync(path.join(FICHAS_DIR, `${id}.json`), JSON.stringify(data, null, 2), 'utf-8');
          }
        }
        if (parsed.name === `${oldName}_sem_fundo` || parsed.name === `${oldName.toLowerCase()}_sem_fundo`) {
          fs.renameSync(path.join(AVATARS_DIR, af), path.join(AVATARS_DIR, `${id}_sem_fundo${parsed.ext}`));
        }
      }

      console.log(`  Migrated ficha "${oldName}" -> ${id}`);
    } catch (err) {
      console.error(`  Error migrating ${f}:`, err.message);
    }
  }

  if (Object.keys(nameToIdMap).length > 0) {
    const partyFiles = fs.readdirSync(PARTIES_DIR).filter((f) => f.endsWith('.json'));
    for (const pf of partyFiles) {
      const pfp = path.join(PARTIES_DIR, pf);
      try {
        const party = JSON.parse(fs.readFileSync(pfp, 'utf-8'));
        let changed = false;
        party.membros = (party.membros || []).map((m) => {
          if (nameToIdMap[m]) {
            changed = true;
            return nameToIdMap[m];
          }
          return m;
        });
        if (changed) {
          fs.writeFileSync(pfp, JSON.stringify(party, null, 2), 'utf-8');
          console.log(`  Migrated party "${party.nome}" membros to UUIDs`);
        }
      } catch (err) {
        console.error(`  Error migrating party ${pf}:`, err.message);
      }
    }
  }

  migrateFlatFichasToUserFolder({ FICHAS_DIR });
}

module.exports = { run };
