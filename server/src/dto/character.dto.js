/**
 * Campos internos que nunca devem ir ao cliente.
 * O schema é strict:false, então usamos exclusão em vez de whitelist
 * para não quebrar campos dinâmicos do Naruto SNS.
 *
 * Campos sem uso em nenhum componente (confirmado por análise do frontend):
 * - system: só usado em CharacterSummary (listagem), não na folha de detalhe
 * - attackAnimation: só inicializado em createEmptyCharacter, nunca lido
 * - storedItems, sexuality, sensorType, sensorRange, weaponReachCC,
 *   targetHardness, extraDamageCC, extraDamageCD, halfDamageGrade:
 *   só inicializados em createEmptyNarutoCharacter, nunca renderizados
 *
 * Segurança do round-trip: o upsertById usa findByIdAndUpdate ($set),
 * então campos ausentes no POST são preservados no banco sem perda de dados.
 */
const INTERNAL_FIELDS = [
  'ownerUid',
  'ownerEmail',
  'deletedAt',
  'pendingDeleteAt',
  '__v',
  'createdAt',
  'updatedAt',
];

const UNUSED_FIELDS = [
  'system',
  'attackAnimation',
  'storedItems',
  'sexuality',
  'sensorType',
  'sensorRange',
  'weaponReachCC',
  'targetHardness',
  'extraDamageCC',
  'extraDamageCD',
  'halfDamageGrade',
];

/**
 * Resumo para listagem de personagens (SelectPage, sidebar).
 * Expõe apenas o mínimo necessário para renderizar o card.
 */
function toCharacterSummaryDTO(doc) {
  return {
    _id: doc._id,
    name: doc.name ?? '',
    avatar: doc.avatar ?? '',
    classes: doc.classes ?? [],
    system: doc.system ?? 'tormenta',
    deletedAt: doc.deletedAt ?? null,
    pendingDeleteAt: doc.pendingDeleteAt ?? null,
  };
}

/**
 * Detalhe completo para a folha de personagem.
 * Remove campos internos de posse/exclusão, metadados do Mongoose
 * e campos confirmados como não utilizados em nenhum componente do frontend.
 * Mantém todos os campos RPG ativos, incluindo os dinâmicos do Naruto SNS.
 */
function toCharacterDetailDTO(doc) {
  const result = { ...doc };
  for (const field of INTERNAL_FIELDS) {
    delete result[field];
  }
  for (const field of UNUSED_FIELDS) {
    delete result[field];
  }
  return result;
}

module.exports = { toCharacterSummaryDTO, toCharacterDetailDTO };
