const Combat = require('./db/models/Combat');

const combatCache = {};

const COMBAT_DEFAULT = {
  enemies: [],
  initiatives: {},
  turnIndex: -1,
  ordered: false,
  round: 1,
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

module.exports = {
  combatCache,
  COMBAT_DEFAULT,
  loadCombat,
  saveCombat,
  deleteCombat,
};
