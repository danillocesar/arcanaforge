/**
 * Campos de estado de combate expostos ao frontend.
 * Remove metadados internos do Mongoose e partyId (não usado pelo client).
 */
function toCombatDTO(doc) {
  const { _id, __v, createdAt, updatedAt, partyId, ...rest } = doc;
  return rest;
}

module.exports = { toCombatDTO };
