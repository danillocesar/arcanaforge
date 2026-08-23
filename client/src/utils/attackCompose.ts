import type { Attack, AttackModifier, AttributeId, Character } from '../types/character';
import { calcTotalSkill, getEffectiveAttribute, getActiveBuffs, formatMod } from './calculations';
import { SKILLS_CONFIG } from '../data/pericias';

export interface AttackChecklistItem {
  key: string;
  label: string;
  /** '' para bônus do próprio ataque; 'Poder' | 'Magia' | 'Item' pros de fora. */
  source: string;
  attackRoll: number;
  damageBonus: number;
  damageDice: string;
  mpCost: number;
  defaultChecked: boolean;
  /** Aceita empilhar ×N na modal — vem do `repeatable` da linha do modificador. */
  repeatable: boolean;
  /** Poder/Magia/Item dono do item — linhas da mesma entidade compartilham a chave. */
  entityKey: string;
  /** Custo (PM) base da entidade dona: cobrado UMA vez quando qualquer linha dela
   * está marcada, sem multiplicar com o ×N (o poder/magia é usado uma vez). */
  entityMpCost: number;
}

/** Valor efetivo de um atributo do personagem, pros bônus dirigidos por atributo. */
type AttrValue = (id: AttributeId) => number;

/**
 * Acerto/dano numéricos de uma linha de modificador, com as três origens somadas:
 *
 * - o valor fixo digitado (`attackRoll`/`damageBonus`);
 * - o bônus dirigido por atributo (`attackRollAttribute`/`damageBonusAttribute`),
 *   que soma o valor efetivo do atributo escolhido, incondicionalmente;
 * - o bônus temporário de atributo (`attributeId`/`attributeValue`, ex.: "+6 Força"
 *   da Manopla de Força) — resolvido por ataque: soma no acerto só se `skillAttr`
 *   (perícia usada por este ataque) bater com o atributo da linha, e no dano só se
 *   `damageAttr` (atributo de dano do próprio ataque) bater. Um "+6 Força" não vira
 *   "+6 acerto" numa perícia à distância baseada em Destreza, por exemplo.
 */
function resolveModifierNumbers(
  m: AttackModifier,
  skillAttr: AttributeId | undefined,
  damageAttr: AttributeId,
  attrValue: AttrValue,
): { attackRoll: number; damageBonus: number } {
  let attackRoll = m.attackRoll ?? 0;
  let damageBonus = m.damageBonus ?? 0;
  if (m.attackRollAttribute) attackRoll += attrValue(m.attackRollAttribute);
  if (m.damageBonusAttribute) damageBonus += attrValue(m.damageBonusAttribute);
  if (m.attributeId && m.attributeValue) {
    if (m.attributeId === skillAttr) attackRoll += m.attributeValue;
    if (m.attributeId === damageAttr) damageBonus += m.attributeValue;
  }
  return { attackRoll, damageBonus };
}

/**
 * Cada linha de `AttackModifier` de um Poder/Magia/Item vira um item PRÓPRIO do
 * checklist — assim o jogador liga e empilha (×N) uma linha específica sem arrastar
 * as outras (ex.: multiplicar só o dado de dano, não o bônus de acerto). Entidade
 * com uma linha só usa o nome da entidade como label; com várias, "Entidade — Linha".
 */
function pushModifierRows(
  items: AttackChecklistItem[],
  mods: AttackModifier[] | undefined,
  baseKey: string,
  entityLabel: string,
  source: string,
  skillAttr: AttributeId | undefined,
  damageAttr: AttributeId,
  attrValue: AttrValue,
  entityMpCost = 0,
) {
  const list = mods ?? [];
  list.forEach((m, mi) => {
    const rowLabel = m.label.trim() || `Modificador ${mi + 1}`;
    const label = list.length > 1 ? `${entityLabel} — ${rowLabel}` : entityLabel.trim() || rowLabel;
    const { attackRoll, damageBonus } = resolveModifierNumbers(m, skillAttr, damageAttr, attrValue);
    items.push({
      key: `${baseKey}-mod-${mi}`,
      label,
      source,
      attackRoll,
      damageBonus,
      damageDice: m.damageDice ?? '',
      mpCost: m.mpCost ?? 0,
      defaultChecked: false,
      repeatable: Boolean(m.repeatable),
      entityKey: baseKey,
      entityMpCost,
    });
  });
}

/**
 * Soma todas as linhas de `AttackModifier` de um aprimoramento de magia num único
 * item de checklist: o aprimoramento é a unidade que o jogador compra/empilha — o
 * "PM extra" dele entra uma vez só (`extraMpCost`), então as linhas não podem ser
 * ligadas separadas do custo.
 */
function pushMergedModifiers(
  items: AttackChecklistItem[],
  mods: AttackModifier[] | undefined,
  key: string,
  label: string,
  source: string,
  skillAttr: AttributeId | undefined,
  damageAttr: AttributeId,
  attrValue: AttrValue,
  /** Custo intrínseco da fonte somado ao das linhas — ex.: o "PM extra" de um
   * aprimoramento de magia, que o jogador não repete nas linhas do modificador. */
  extraMpCost = 0,
  entityKey = key,
  entityMpCost = 0,
) {
  const list = mods ?? [];
  if (list.length === 0) return;

  let attackRoll = 0;
  let damageBonus = 0;
  let mpCost = extraMpCost;
  const dice: string[] = [];
  list.forEach((m) => {
    const resolved = resolveModifierNumbers(m, skillAttr, damageAttr, attrValue);
    attackRoll += resolved.attackRoll;
    damageBonus += resolved.damageBonus;
    mpCost += m.mpCost ?? 0;
    if (m.damageDice) dice.push(m.damageDice);
  });

  items.push({
    key,
    label: label.trim() || 'Modificador',
    source,
    attackRoll,
    damageBonus,
    damageDice: dice.join(''),
    mpCost,
    defaultChecked: false,
    // O aprimoramento empilha como unidade — basta uma linha optar pela repetição.
    repeatable: list.some((m) => Boolean(m.repeatable)),
    entityKey,
    entityMpCost,
  });
}

/**
 * Monta o checklist de um ataque: os `extraBonuses`/`extraDamage` do próprio
 * `Attack` (pré-marcados — preservam o resultado de hoje) seguidos de todo
 * `AttackModifier` disponível no personagem via Poder, Magia ou Item
 * (desmarcados por padrão — são opcionais novos). Cada linha de
 * `attackModifiers` de um Poder/Magia/Item é um item próprio, selecionável e
 * empilhável separado; só as linhas de um aprimoramento de magia somam num item.
 */
export function buildAttackChecklist(character: Character, atk: Attack): AttackChecklistItem[] {
  const items: AttackChecklistItem[] = [];

  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  const skillCfg = SKILLS_CONFIG.find((p) => p.id === skillId);
  const skillAttr = (character.skills[skillId]?.attribute || skillCfg?.attribute) as AttributeId | undefined;
  const damageAttr = (atk.attributeDamageBonus || 'str') as AttributeId;
  const attrValue: AttrValue = (id) => getEffectiveAttribute(character, id);

  (atk.extraBonuses ?? []).forEach((b, i) => {
    items.push({
      key: `own-bonus-${i}`,
      label: b.name.trim() || 'Modificador',
      source: '',
      attackRoll: Number(b.value) || 0,
      damageBonus: 0,
      damageDice: '',
      mpCost: Number(b.mp) || 0,
      defaultChecked: true,
      repeatable: false,
      entityKey: 'own',
      entityMpCost: 0,
    });
  });

  (atk.extraDamage ?? []).forEach((d, i) => {
    const raw = String(d.value ?? '');
    const isDice = raw !== '' && Number.isNaN(Number(raw));
    items.push({
      key: `own-damage-${i}`,
      label: d.name.trim() || 'Modificador',
      source: '',
      attackRoll: 0,
      damageBonus: isDice ? 0 : (Number(raw) || 0),
      damageDice: isDice ? raw : '',
      mpCost: Number(d.mp) || 0,
      defaultChecked: true,
      repeatable: false,
      entityKey: 'own',
      entityMpCost: 0,
    });
  });

  // Poder/Item suspenso não oferece seus modificadores: `suppressed` vale pro pacote
  // inteiro da fonte, igual ao que faz com os buffs fixos em synthesizeAlwaysActiveBuffs.
  (character.abilities ?? []).forEach((a, ai) => {
    if (a.suppressed) return;
    pushModifierRows(items, a.attackModifiers, `ability-${ai}`, a.name, 'Poder', skillAttr, damageAttr, attrValue, Number(a.mpCost) || 0);
  });
  // Magia: o efeito base e cada aprimoramento com modificadores viram itens
  // individuais — o jogador liga só o que vai pagar (ex.: Toque Chocante base
  // e, à parte, o aprimoramento de +2 no teste de ataque). Todos compartilham o
  // custo base da magia via entityKey/entityMpCost (cobrado uma vez).
  (character.spells ?? []).forEach((sp, si) => {
    const spellMp = Number(sp.mpCost) || 0;
    pushModifierRows(items, sp.attackModifiers, `spell-${si}`, sp.name, 'Magia', skillAttr, damageAttr, attrValue, spellMp);
    (sp.enhancements ?? []).forEach((enh, ei) => {
      pushMergedModifiers(
        items, enh.attackModifiers, `spell-${si}-enh-${ei}`,
        `${sp.name} — Aprimoramento ${ei + 1}`, 'Magia', skillAttr, damageAttr, attrValue, enh.mpCost,
        `spell-${si}`, spellMp,
      );
    });
  });
  (character.inventory ?? []).forEach((it, ii) => {
    if (it.suppressed) return;
    pushModifierRows(items, it.attackModifiers, `item-${ii}`, it.name, 'Item', skillAttr, damageAttr, attrValue, Number(it.mpCost) || 0);
  });

  return items;
}

export interface ComposedAttack {
  attackRoll: number;
  damage: string;
  mpTotal: number;
  usedLabels: string[];
}

/**
 * Escala cada termo de dado da string por `times`: "1d8" ×3 → "3d8", "+2d6" ×2 →
 * "+4d6", "d8" conta como 1 dado. Termos que não são dados (ex.: o "+2" de
 * "1d8+2") ficam intactos — bônus fixos empilháveis pertencem a `damageBonus`,
 * que é multiplicado à parte.
 */
export function multiplyDamageDice(dice: string, times: number): string {
  if (times === 1) return dice;
  return dice.replace(/(\d*)([dD])(\d+)/g, (_m, count: string, d: string, faces: string) => {
    return `${(count ? Number(count) : 1) * times}${d}${faces}`;
  });
}

/**
 * Calcula o resultado de uma rolagem de ataque a partir do subconjunto marcado do
 * checklist. Duplica deliberadamente uma pequena parte da aritmética de
 * `calcAttackRoll`/`calcDamageBonus`/`buildDamageSummary`/`calcTotalMp` (em
 * calculations.ts) em vez de reaproveitá-las: aquelas somam SEMPRE o
 * `extraBonuses`/`extraDamage` do ataque (usado pelo card em repouso); esta soma só
 * o subconjunto marcado — misturar as duas semânticas numa função só, ou passar um
 * filtro por todos os call sites existentes, seria mais arriscado que manter os
 * dois cálculos separados.
 *
 * `enabled` aceita um Set (cada item marcado aplica 1×) ou um Map de contagens —
 * um item empilhável (ex.: Smite Divino, 1d8 por 1 PM) marcado N vezes tem
 * números, PM e dados multiplicados por N.
 */
export function composeAttack(
  character: Character,
  atk: Attack,
  checklist: AttackChecklistItem[],
  enabled: Set<string> | Map<string, number>,
): ComposedAttack {
  const countOf = (key: string): number => {
    if (enabled instanceof Map) return Math.max(0, Math.floor(enabled.get(key) ?? 0));
    return enabled.has(key) ? 1 : 0;
  };
  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  let attackRoll = calcTotalSkill(character, skillId);

  const attrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  let damageBonus = getEffectiveAttribute(character, attrKey);

  const extraDice: string[] = [];
  let mpTotal = Number(atk.mpCost) || 0;
  const usedLabels: string[] = [];
  // Custo base do Poder/Magia/Item dono: cobrado uma vez por entidade quando
  // qualquer linha dela está marcada — não multiplica com o ×N das linhas.
  const chargedEntities = new Set<string>();

  checklist.forEach((item) => {
    // Item não-repetível aplica no máximo 1×, mesmo que a contagem diga mais.
    const count = Math.min(countOf(item.key), item.repeatable ? Infinity : 1);
    if (count === 0) return;
    attackRoll += item.attackRoll * count;
    damageBonus += item.damageBonus * count;
    if (item.damageDice) extraDice.push(multiplyDamageDice(item.damageDice, count));
    mpTotal += item.mpCost * count;
    if (item.entityMpCost > 0 && !chargedEntities.has(item.entityKey)) {
      chargedEntities.add(item.entityKey);
      mpTotal += item.entityMpCost;
    }
    usedLabels.push(count > 1 ? `${item.label} ×${count}` : item.label);
  });

  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attack_roll') attackRoll += Number(eff.value) || 0;
      if (eff.type === 'fixed_damage') damageBonus += Number(eff.value) || 0;
      if (eff.type === 'extra_damage' && eff.value) extraDice.push(String(eff.value));
    });
  });

  const parts: string[] = [];
  if (atk.damage) parts.push(atk.damage);
  extraDice.forEach((d) => parts.push(d));
  if (damageBonus !== 0 || parts.length === 0) {
    parts.push(damageBonus >= 0 && parts.length > 0 ? `+${damageBonus}` : formatMod(damageBonus));
  }
  const damage = parts.join('+').replace(/\+\+/g, '+').replace(/\+-/g, '-');

  return { attackRoll, damage, mpTotal, usedLabels };
}
