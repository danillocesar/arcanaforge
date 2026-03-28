const { AppError } = require('../errors/AppError');
const partyRepository = require('../repositories/party.repository');
const combatRepository = require('../repositories/combat.repository');

function stripCombatDocMeta(data) {
  const { _id, __v, createdAt, updatedAt, ...clean } = data;
  return clean;
}

function createCombatService(refs) {
  async function getCombat(id, uid) {
    const party = await partyRepository.findOwnedOrMemberPartyLean(id, uid);
    if (!party) throw new AppError(403, 'Acesso negado');
    const data = await combatRepository.loadCombat(id);
    return stripCombatDocMeta(data);
  }

  async function saveCombat(id, uid, incoming) {
    const party = await partyRepository.findOwnedOrMemberPartyLean(id, uid);
    if (!party) throw new AppError(403, 'Acesso negado');
    const existing = await combatRepository.loadCombat(id);
    const merged = combatRepository.mergeCombatWrite(existing, incoming || {}, party.ownerUid === uid);
    await combatRepository.saveCombat(id, merged);
    refs.broadcastCombat(id);
    return { ok: true };
  }

  return { getCombat, saveCombat };
}

module.exports = { createCombatService };
