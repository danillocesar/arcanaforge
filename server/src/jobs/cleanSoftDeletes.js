const cron = require('node-cron');
const characterRepository = require('../repositories/character.repository');

async function deleteExpiredCharacters() {
  const expired = await characterRepository.findExpiredSoftDeletes();
  if (expired.length === 0) return;

  console.log(`[cron] Removendo ${expired.length} personagem(ns) com soft-delete expirado`);

  for (const char of expired) {
    try {
      await characterRepository.hardDeleteById(char._id);
      console.log(`[cron] Personagem ${char._id} (${char.name}) removido permanentemente`);
    } catch (err) {
      console.error(`[cron] Erro ao remover personagem ${char._id}:`, err.message);
    }
  }
}

function startCleanSoftDeletesJob() {
  // Roda todos os dias às 3:00
  cron.schedule('0 3 * * *', async () => {
    try {
      await deleteExpiredCharacters();
    } catch (err) {
      console.error('[cron] Erro no job de limpeza de soft-deletes:', err.message);
    }
  });
  console.log('[cron] Job de limpeza de personagens agendado (diário às 03:00)');
}

module.exports = { startCleanSoftDeletesJob, deleteExpiredCharacters };
