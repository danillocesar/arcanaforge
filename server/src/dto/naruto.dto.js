/**
 * Clã Naruto para seletores de ficha e CombatCard.
 *
 * Campos não usados no frontend (confirmado por análise):
 * - system: nenhum componente lê clan.system
 * - active: filtrado no servidor; o front nunca verifica este campo
 */
function toClanDTO(doc) {
  return {
    id: String(doc._id),
    name: doc.name ?? '',
    icon: doc.icon ?? '',
  };
}

/**
 * Template de técnica Naruto para o painel de poderes.
 *
 * Campos não usados no frontend (confirmado por análise):
 * - baseDamage: não aplicado em applyTemplate nem exibido
 * - chakraCost: não usado (custo fica em levelEntries do personagem)
 * - evolutions: não renderizado
 * - availableFor: não renderizado
 * - source: não exibido (sourceDetail sim, source não)
 */
function toTechTemplateDTO(doc) {
  return {
    id: String(doc._id),
    name: doc.name ?? '',
    unlockLevel: doc.unlockLevel ?? null,
    category: doc.category ?? '',
    action: doc.action ?? '',
    range: doc.range ?? '',
    duration: doc.duration ?? null,
    target: doc.target ?? null,
    description: doc.description ?? '',
    dealsDamage: doc.dealsDamage ?? false,
    sourceDetail: doc.sourceDetail ?? null,
  };
}

module.exports = { toClanDTO, toTechTemplateDTO };
