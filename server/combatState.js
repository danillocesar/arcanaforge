const Combat = require('./db/models/Combat');

const combatCache = {};

const COMBAT_DEFAULT = {
  enemies: [],
  initiatives: {},
  turnIndex: -1,
  ordered: false,
  round: 1,
  inactiveCharacterIds: [],
  gmCharacterVisual: {},
};

async function loadCombat(partyId) {
  if (combatCache[partyId]) return combatCache[partyId];
  const doc = await Combat.findById(partyId).lean();
  const data = doc || { ...COMBAT_DEFAULT };
  combatCache[partyId] = data;
  return data;
}

async function saveCombat(partyId, data) {
  combatCache[partyId] = data;
  await Combat.findByIdAndUpdate(
    partyId,
    { ...data, _id: partyId },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

async function deleteCombat(partyId) {
  delete combatCache[partyId];
  await Combat.findByIdAndDelete(partyId);
}

/**
 * Mescla payload de combate como em POST /api/parties/:id/combat.
 * Quem não é dono não pode alterar inactiveCharacterIds nem gmCharacterVisual.
 * @param {object} existing
 * @param {object} incoming
 * @param {boolean} isPartyOwner
 */
function mergeCombatWrite(existing, incoming, isPartyOwner) {
  const inc = incoming && typeof incoming === 'object' ? incoming : {};
  const { _id: _eid, __v, createdAt, updatedAt, ...exRest } = existing;
  let merged = { ...COMBAT_DEFAULT, ...exRest, ...inc };
  if (!isPartyOwner) {
    merged.inactiveCharacterIds = exRest.inactiveCharacterIds ?? [];
    merged.gmCharacterVisual =
      exRest.gmCharacterVisual && typeof exRest.gmCharacterVisual === 'object'
        ? exRest.gmCharacterVisual
        : {};
  }
  return merged;
}

module.exports = {
  combatCache,
  COMBAT_DEFAULT,
  loadCombat,
  saveCombat,
  deleteCombat,
  mergeCombatWrite,
};
