import type { Attack, AttackModifier, AttributeId, Character } from '../types/character';
import { calcTotalSkill, getEffectiveAttribute, formatMod } from './calculations';

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

function pushModifiers(
  items: AttackChecklistItem[],
  mods: AttackModifier[] | undefined,
  keyPrefix: string,
  source: string,
) {
  (mods ?? []).forEach((m, i) => {
    items.push({
      key: `${keyPrefix}-${i}`,
      label: m.label.trim() || 'Modificador',
      source,
      attackRoll: m.attackRoll ?? 0,
      damageBonus: m.damageBonus ?? 0,
      damageDice: m.damageDice ?? '',
      mpCost: m.mpCost ?? 0,
      defaultChecked: false,
    });
  });
}

/**
 * Monta o checklist de um ataque: os `extraBonuses`/`extraDamage` do próprio
 * `Attack` (pré-marcados — preservam o resultado de hoje) seguidos de todo
 * `AttackModifier` disponível no personagem via Poder, Magia ou Item
 * (desmarcados por padrão — são opcionais novos).
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

  (character.abilities ?? []).forEach((a, ai) => pushModifiers(items, a.attackModifiers, `ability-${ai}`, 'Poder'));
  (character.spells ?? []).forEach((sp, si) => pushModifiers(items, sp.attackModifiers, `spell-${si}`, 'Magia'));
  (character.inventory ?? []).forEach((it, ii) => pushModifiers(items, it.attackModifiers, `item-${ii}`, 'Item'));

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

  if (character.buffs) character.buffs.forEach((b) => {
    if (!b.active) return;
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
