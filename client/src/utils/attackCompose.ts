import type { Attack, AttackModifier, AttributeId, Character } from '../types/character';
import { calcTotalSkill, getEffectiveAttribute, getActiveBuffs, formatMod } from './calculations';

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
}

/**
 * Soma todas as linhas de `AttackModifier` de um mesmo Poder/Magia/Item num único
 * item de checklist, usando o nome da própria entidade (não o Nome de cada linha)
 * como label — evita que o jogador precise lembrar de colocar tudo numa linha só
 * pra um efeito que sempre se aplica junto (ex.: "Ataque Poderoso" cadastrado como
 * duas linhas, "-2 no acerto" e "+5 no dano", vira uma linha só "Ataque Poderoso").
 */
function pushMergedModifiers(
  items: AttackChecklistItem[],
  mods: AttackModifier[] | undefined,
  key: string,
  label: string,
  source: string,
) {
  const list = mods ?? [];
  if (list.length === 0) return;

  let attackRoll = 0;
  let damageBonus = 0;
  let mpCost = 0;
  const dice: string[] = [];
  list.forEach((m) => {
    attackRoll += m.attackRoll ?? 0;
    damageBonus += m.damageBonus ?? 0;
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
  });
}

/**
 * Monta o checklist de um ataque: os `extraBonuses`/`extraDamage` do próprio
 * `Attack` (pré-marcados — preservam o resultado de hoje) seguidos de todo
 * `AttackModifier` disponível no personagem via Poder, Magia ou Item
 * (desmarcados por padrão — são opcionais novos). Todas as linhas de
 * `attackModifiers` de um mesmo Poder/Magia/Item somam num item só.
 */
export function buildAttackChecklist(character: Character, atk: Attack): AttackChecklistItem[] {
  const items: AttackChecklistItem[] = [];

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
    });
  });

  (character.abilities ?? []).forEach((a, ai) => pushMergedModifiers(items, a.attackModifiers, `ability-${ai}`, a.name, 'Poder'));
  (character.spells ?? []).forEach((sp, si) => pushMergedModifiers(items, sp.attackModifiers, `spell-${si}`, sp.name, 'Magia'));
  (character.inventory ?? []).forEach((it, ii) => pushMergedModifiers(items, it.attackModifiers, `item-${ii}`, it.name, 'Item'));

  return items;
}

export interface ComposedAttack {
  attackRoll: number;
  damage: string;
  mpTotal: number;
  usedLabels: string[];
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
 */
export function composeAttack(
  character: Character,
  atk: Attack,
  checklist: AttackChecklistItem[],
  enabledKeys: Set<string>,
): ComposedAttack {
  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  let attackRoll = calcTotalSkill(character, skillId);

  const attrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  let damageBonus = getEffectiveAttribute(character, attrKey);

  const extraDice: string[] = [];
  let mpTotal = Number(atk.mpCost) || 0;
  const usedLabels: string[] = [];

  checklist.forEach((item) => {
    if (!enabledKeys.has(item.key)) return;
    attackRoll += item.attackRoll;
    damageBonus += item.damageBonus;
    if (item.damageDice) extraDice.push(item.damageDice);
    mpTotal += item.mpCost;
    usedLabels.push(item.label);
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
