const combatState = require('../../combatState');

async function loadCombat(partyId) {
  return combatState.loadCombat(partyId);
}

async function saveCombat(partyId, data) {
  combatState.combatCache[partyId] = data;
  await combatState.saveCombat(partyId, data);
}

async function deleteCombat(partyId) {
  return combatState.deleteCombat(partyId);
}

function mergeCombatWrite(existing, incoming, isPartyOwner) {
  return combatState.mergeCombatWrite(existing, incoming, isPartyOwner);
}

module.exports = { loadCombat, saveCombat, deleteCombat, mergeCombatWrite };
