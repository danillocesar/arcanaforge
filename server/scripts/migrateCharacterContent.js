/**
 * Migration: Extract heavy content arrays from `characters` into
 * `character_content` and `character_logs` collections.
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   MONGODB_URI=mongodb://... node server/scripts/migrateCharacterContent.js
 */

const mongoose = require('mongoose');
const { connectMongo } = require('../db/connection');

const CONTENT_FIELDS = ['spells', 'abilities', 'powers', 'aptitudes', 'weapons', 'narpiItems'];

async function migrate() {
  await connectMongo();

  const db = mongoose.connection.db;
  const charactersCol = db.collection('characters');
  const contentCol = db.collection('character_content');
  const logsCol = db.collection('character_logs');

  const cursor = charactersCol.find({});
  let total = 0;
  let migrated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    total++;
    const charId = doc._id;

    const contentData = {};
    const unsetFields = {};
    let hasContent = false;

    for (const field of CONTENT_FIELDS) {
      if (doc[field] !== undefined) {
        contentData[field] = doc[field];
        unsetFields[field] = '';
        hasContent = true;
      }
    }

    const hasLogs = doc.logs !== undefined && Array.isArray(doc.logs) && doc.logs.length > 0;

    if (!hasContent && !hasLogs) {
      skipped++;
      continue;
    }

    try {
      const ops = [];

      if (hasContent) {
        // Only insert if the content doc doesn't already exist (avoids
        // overwriting data saved by the new code before migration ran).
        const existing = await contentCol.findOne({ _id: charId }, { projection: { _id: 1 } });
        if (!existing) {
          ops.push(
            contentCol.insertOne({ ...contentData, _id: charId }),
          );
        }
      }

      if (hasLogs) {
        const existingLogs = await logsCol.findOne({ _id: charId }, { projection: { _id: 1 } });
        if (!existingLogs) {
          ops.push(
            logsCol.insertOne({ logs: doc.logs, _id: charId }),
          );
        }
        unsetFields.logs = '';
      }

      // Remove extracted fields from the main document
      if (Object.keys(unsetFields).length > 0) {
        ops.push(
          charactersCol.updateOne({ _id: charId }, { $unset: unsetFields }),
        );
      }

      await Promise.all(ops);
      migrated++;

      if (migrated % 100 === 0) {
        console.log(`[migration] Progresso: ${migrated} migrados de ${total} processados`);
      }
    } catch (err) {
      console.error(`[migration] Erro no personagem ${charId}:`, err.message);
    }
  }

  console.log(`[migration] Concluido: ${migrated} migrados, ${skipped} sem dados para extrair, ${total} total`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('[migration] Erro fatal:', err);
  process.exit(1);
});
