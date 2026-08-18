/**
 * Retorno de party para o cliente.
 * Mapeia _id → id (convenção já existente via toPartyJson).
 *
 * Campos não usados no frontend (confirmado por análise):
 * - ownerEmail: declarado no tipo mas nenhum componente o lê
 * - members[].joinedAt: só no tipo, nenhum componente exibe
 */
function toPartyDTO(doc) {
  const { _id, __v, createdAt, updatedAt, ownerEmail, ...rest } = doc;

  const members = (rest.members || []).map(({ uid, email, characterIds }) => ({
    uid,
    email,
    characterIds: characterIds || [],
  }));

  return {
    id: String(_id),
    ...rest,
    members,
  };
}

/**
 * Personagem dentro de uma party (visão de combate/roster).
 * Expõe apenas os campos necessários para o CombatContext e PlayerCard.
 */
function toPartyCharacterDTO(doc) {
  return {
    _id: doc._id,
    name: doc.name ?? '',
    avatar: doc.avatar ?? '',
    classes: doc.classes ?? [],
    system: doc.system ?? 'tormenta',
    ownerUid: doc.ownerUid ?? '',
    hp: doc.hp ?? null,
    mp: doc.mp ?? null,
  };
}

module.exports = { toPartyDTO, toPartyCharacterDTO };
