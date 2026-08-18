import type { Character, AttributeId, Buff, BuffEffect, BuffType, Attack, InventoryItem } from '../types/character';
import { SKILLS_CONFIG } from '../data/pericias';
import { filterFixedBonusEffects } from './buffEffects';

export function createEmptyCharacter(name?: string): Character {
  const skills: Character['skills'] = {};
  SKILLS_CONFIG.forEach((p) => {
    skills[p.id] = { trained: false, misc: 0 };
    if (p.customLabel) skills[p.id].label = '';
  });

  return {
    _id: crypto.randomUUID(),
    system: 'tormenta',
    name: name || 'Novo Personagem',
    classes: [{ name: '', level: 1 }],
    race: '',
    origin: '',
    deity: '',
    alignment: '',
    languages: '',
    age: '',
    size: 'Médio',
    speed: '9m / 6q',
    experience: 0,
    attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    hp: { max: 0, current: 0 },
    mp: { max: 0, current: 0 },
    defense: { base: 10, items: [] },
    damageReduction: 0,
    attacks: [],
    skills,
    abilities: [],
    spells: [],
    spellcastingAttribute: 'int',
    inventory: [],
    equipped: [{ name: '' }, { name: '' }, { name: '' }, { name: '' }],
    coins: { copper: 0, silver: 0, gold: 0 },
    notes: '',
    temporaryEffects: '',
    proficiencies: '',
    progression: [],
    buffs: [],
    temporaryHp: 0,
    temporaryMp: 0,
    collapsedSections: {},
    hiddenSections: {},
    attackAnimation: 'personagem',
    avatar: '',
    logs: [],
  };
}

export function getTotalLevel(character: Character): number {
  if (character.classes && character.classes.length > 0) {
    return character.classes.reduce((sum, c) => sum + (Number(c.level) || 0), 0);
  }
  return Number(character.level) || 1;
}

/**
 * Buffs sintéticos, sempre ativos, vindos de Poderes/Habilidades e Itens marcados
 * como `alwaysActive` — não ficam em `character.buffs[]`, são derivados na hora.
 */
function synthesizeAlwaysActiveBuffs(character: Character): Buff[] {
  const fromAbilities = (character.abilities ?? [])
    .filter((a) => a.alwaysActive)
    .map((a) => ({ name: a.name, effects: filterFixedBonusEffects(a.buffs ?? []), mp: 0, active: true, source: 'Poder' }))
    .filter((b) => b.effects.length > 0);
  const fromItems = (character.inventory ?? [])
    .filter((it) => it.alwaysActive)
    .map((it) => ({ name: it.name, effects: filterFixedBonusEffects(it.buffs ?? []), mp: 0, active: true, source: 'Item' }))
    .filter((b) => b.effects.length > 0);
  return [...fromAbilities, ...fromItems];
}

/**
 * Todos os buffs em vigor agora: os manuais ligados em `character.buffs[]` mais os
 * sintéticos de Poderes/Itens fixos. Ponto único usado por todo cálculo que soma
 * efeitos de buff — evita duplicar o filtro `active`/iteração em cada função.
 */
export function getActiveBuffs(character: Character): Buff[] {
  return [...(character.buffs ?? []).filter((b) => b.active), ...synthesizeAlwaysActiveBuffs(character)];
}

export function getEffectiveAttribute(character: Character, attr: AttributeId): number {
  let val = character.attributes[attr] || 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attribute' && eff.attributeId === attr) {
        val += Number(eff.value) || 0;
      }
    });
  });
  return val;
}

export function calcArmorPenalty(character: Character): number {
  let pen = 0;
  if (character.defense?.items) {
    character.defense.items.forEach((item) => {
      if (item.penalty) pen += item.penalty;
    });
  }
  return pen;
}

export function calcTotalSkill(character: Character, skillId: string): number {
  const cfg = SKILLS_CONFIG.find((p) => p.id === skillId);
  if (!cfg) return 0;
  const skill = character.skills[skillId];
  if (!skill) return 0;

  const halfLevel = Math.floor(getTotalLevel(character) / 2);
  const usedAttribute = (skill.attribute || cfg.attribute) as AttributeId;
  const attributeMod = getEffectiveAttribute(character, usedAttribute);
  const trainingBonus = skill.trained ? 2 : 0;
  const miscBonus = skill.misc || 0;
  let armorPenalty = 0;
  if (cfg.armorPenalty) {
    armorPenalty = calcArmorPenalty(character);
  }
  let buffBonus = 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'skill' && eff.skillId === skillId) {
        buffBonus += Number(eff.value) || 0;
      }
    });
  });
  return halfLevel + attributeMod + trainingBonus + miscBonus + armorPenalty + buffBonus;
}

export function calcTotalDefense(character: Character): number {
  let total = (character.defense.base || 10) + getEffectiveAttribute(character, 'dex');
  if (character.defense.items) {
    character.defense.items.forEach((item) => {
      total += item.value || 0;
    });
  }
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'defense') total += Number(eff.value) || 0;
    });
  });
  return total;
}

/** Alias for the buff-aware total defense (centralized selector). */
export const effectiveDefense = calcTotalDefense;

/** All six attribute modifiers with active buffs applied. */
export function effectiveAttributes(character: Character): Record<AttributeId, number> {
  return {
    str: getEffectiveAttribute(character, 'str'),
    dex: getEffectiveAttribute(character, 'dex'),
    con: getEffectiveAttribute(character, 'con'),
    int: getEffectiveAttribute(character, 'int'),
    wis: getEffectiveAttribute(character, 'wis'),
    cha: getEffectiveAttribute(character, 'cha'),
  };
}

export interface DefenseBreakdownRow {
  name: string;
  value: number;
}

export interface DefenseBreakdown {
  base: number;
  dexterity: number;
  items: DefenseBreakdownRow[];
  buffs: DefenseBreakdownRow[];
  total: number;
}

/** Structured breakdown for the Defense popover (base + Destreza + protections + active defense buffs). */
export function getDefenseBreakdown(character: Character): DefenseBreakdown {
  const base = character.defense.base || 10;
  const dexterity = getEffectiveAttribute(character, 'dex');
  const items: DefenseBreakdownRow[] = (character.defense.items || [])
    .filter((it) => (it.value || 0) !== 0)
    .map((it) => ({ name: it.name || 'Proteção', value: it.value || 0 }));
  const buffs: DefenseBreakdownRow[] = getActiveBuffs(character)
    .flatMap((b) => (b.effects || [])
      .filter((eff) => eff.type === 'defense')
      .map((eff) => ({ name: b.name || 'Buff', value: Number(eff.value) || 0 })));
  return { base, dexterity, items, buffs, total: calcTotalDefense(character) };
}

/**
 * Toggle a buff's active state, applying its game effects as a pure transform:
 * spends/refunds MP cost, and adds/removes temporary HP/MP for hp/mp buffs.
 * Attribute/skill/defense/damage buffs are reflected live by the effective
 * selectors, so they only need the `active` flip (+ MP cost). Centralizes the
 * logic previously inline in BuffsList.
 */
export function toggleBuffState(character: Character, idx: number): Character {
  const buffs = [...character.buffs];
  const b = { ...buffs[idx] };
  if (!b) return character;
  const wasActive = b.active;
  b.active = !wasActive;

  let mpCurrent = character.mp.current;
  let hpTemp = character.temporaryHp;
  let mpTemp = character.temporaryMp;
  const mpCost = Number(b.mp) || 0;
  const sign = wasActive ? -1 : 1;

  if (!wasActive && mpCost > 0) mpCurrent = Math.max(0, mpCurrent - mpCost);

  (b.effects || []).forEach((eff) => {
    const val = Number(eff.value) || 0;
    if (eff.type === 'hp') hpTemp = Math.max(0, hpTemp + sign * val);
    if (eff.type === 'mp') mpTemp = Math.max(0, mpTemp + sign * val);
  });

  buffs[idx] = b;
  return {
    ...character,
    buffs,
    mp: { ...character.mp, current: mpCurrent },
    temporaryHp: hpTemp,
    temporaryMp: mpTemp,
  };
}

export function calcCarryCapacity(character: Character): number {
  const strength = getEffectiveAttribute(character, 'str');
  if (strength < 0) return 10 + strength;
  return 10 + 2 * strength;
}

export function calcUsedLoad(character: Character): number {
  let total = 0;
  if (character.inventory) {
    character.inventory.forEach((item) => {
      total += (item.weight || 0) * (item.quantity || 1);
    });
  }
  return total;
}

export function calcSpellResistance(character: Character): number {
  const attrKey = character.spellcastingAttribute || 'int';
  const mod = getEffectiveAttribute(character, attrKey);
  return 10 + Math.floor(getTotalLevel(character) / 2) + mod;
}

/** Uma arma do inventário só vira card de Ataque quando tem dano cadastrado. */
export function isWeaponAttack(item: InventoryItem): boolean {
  return item.category === 'arma' && Boolean((item.damage ?? '').trim());
}

/** Adapta uma arma do inventário (com dados de combate) para o formato de Ataque. */
export function weaponToAttack(item: InventoryItem): Attack {
  return {
    name: item.name,
    damage: item.damage ?? '',
    critical: item.critical ?? '',
    type: item.type ?? '',
    rangeType: item.rangeType ?? 'melee',
    mpCost: item.mpCost ?? 0,
    attributeDamageBonus: item.attributeDamageBonus ?? 'str',
    extraBonuses: [],
    extraDamage: [],
  };
}

export function calcAttackRoll(character: Character, atk: Character['attacks'][number]): number {
  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  let total = calcTotalSkill(character, skillId);
  if (atk.extraBonuses) atk.extraBonuses.forEach((b) => { total += Number(b.value) || 0; });
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attack_roll') total += Number(eff.value) || 0;
    });
  });
  return total;
}

export function calcDamageBonus(character: Character, atk: Character['attacks'][number]): number {
  const attrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  let total = getEffectiveAttribute(character, attrKey);
  if (atk.extraDamage) atk.extraDamage.forEach((b) => { total += Number(b.value) || 0; });
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'fixed_damage') total += Number(eff.value) || 0;
    });
  });
  return total;
}

export function buildDamageSummary(character: Character, atk: Character['attacks'][number]): string {
  const parts: string[] = [];
  const damageDice = atk.damage || '';
  if (damageDice) parts.push(damageDice);

  const damageBonus = calcDamageBonus(character, atk);

  const extraDice: string[] = [];
  if (atk.extraDamage) atk.extraDamage.forEach((b) => {
    const v = String(b.value || '');
    if (v && isNaN(Number(v))) extraDice.push(v);
  });
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'extra_damage') {
        const v = String(eff.value || '');
        if (v) extraDice.push(v);
      }
    });
  });
  extraDice.forEach((d) => parts.push(d));

  if (damageBonus !== 0 || parts.length === 0) {
    parts.push(damageBonus >= 0 && parts.length > 0 ? `+${damageBonus}` : formatMod(damageBonus));
  }

  return parts.join('+').replace(/\+\+/g, '+').replace(/\+-/g, '-');
}

export function calcTotalMp(atk: Character['attacks'][number]): number {
  let total = Number(atk.mpCost) || 0;
  if (atk.extraBonuses) atk.extraBonuses.forEach((b) => { total += Number(b.mp) || 0; });
  if (atk.extraDamage) atk.extraDamage.forEach((b) => { total += Number(b.mp) || 0; });
  return total;
}

export function formatMod(val: number | string): string {
  const n = Number(val) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
}

export function hpPercent(current: number, max: number): number {
  if (!max || max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

/**
 * Converte buffs no formato antigo (type/attributeId/skillId/value soltos no buff,
 * sem `effects`) para o formato novo. Personagens salvos antes desta mudança não têm
 * `effects` — sem isso, os cálculos acima (que só leem `effects`) os ignorariam
 * silenciosamente.
 */
export function normalizeBuffs(buffs: unknown[]): Buff[] {
  return (buffs || []).map((raw) => {
    const b = raw as Record<string, unknown>;
    if (Array.isArray(b.effects)) return b as unknown as Buff;
    const legacy = b as { type?: BuffType; attributeId?: AttributeId; skillId?: string; value?: string };
    const effects: BuffEffect[] = legacy.type
      ? [{ type: legacy.type, attributeId: legacy.attributeId, skillId: legacy.skillId, value: String(legacy.value ?? '') }]
      : [];
    return {
      name: String(b.name ?? ''),
      effects,
      mp: Number(b.mp) || 0,
      active: Boolean(b.active),
      source: typeof b.source === 'string' ? b.source : undefined,
    };
  });
}

/**
 * Converte Redução de Dano do formato antigo (texto livre, ex. "5 (fogo)") para o
 * novo formato numérico. Personagens salvos antes desta mudança guardam RD como
 * string — extrai o primeiro número encontrado, ou 0 se não houver nenhum.
 */
export function normalizeDamageReduction(value: unknown): number {
  if (typeof value === 'number') return value;
  const match = String(value ?? '').match(/-?\d+/);
  return match ? Number(match[0]) : 0;
}

/**
 * Aplica um buff já ativo num personagem: soma os deltas de PV/PM temporário dos
 * efeitos do tipo hp/mp (mesma soma que toggleBuffState faria ao ativar, mas sem
 * custo de PM — o custo já foi pago na conjuração) e insere o buff na lista.
 *
 * Se já existir um buff com o mesmo nome e origem (ex.: recastar a mesma magia no
 * mesmo alvo), substitui a instância existente em vez de duplicar — primeiro
 * desfaz a contribuição de PV/PM temporário da instância antiga (se estava ativa),
 * depois soma a da nova, evitando contar o bônus em dobro.
 *
 * Usado tanto para o próprio conjurador (auto-aplicação local) quanto ao receber a
 * notificação em tempo real de um buff aplicado por outro jogador.
 */
export function applyBuffToCharacter(character: Character, buff: Buff): Character {
  const existingIdx = character.buffs.findIndex(
    (b) => b.name === buff.name && b.source === buff.source,
  );
  const existing = existingIdx === -1 ? null : character.buffs[existingIdx];

  let hpTemp = character.temporaryHp;
  let mpTemp = character.temporaryMp;

  if (existing?.active) {
    (existing.effects || []).forEach((eff) => {
      const val = Number(eff.value) || 0;
      if (eff.type === 'hp') hpTemp = Math.max(0, hpTemp - val);
      if (eff.type === 'mp') mpTemp = Math.max(0, mpTemp - val);
    });
  }

  buff.effects.forEach((eff) => {
    const val = Number(eff.value) || 0;
    if (eff.type === 'hp') hpTemp += val;
    if (eff.type === 'mp') mpTemp += val;
  });

  const buffs =
    existingIdx === -1
      ? [...character.buffs, buff]
      : character.buffs.map((b, i) => (i === existingIdx ? buff : b));

  return {
    ...character,
    buffs,
    temporaryHp: hpTemp,
    temporaryMp: mpTemp,
  };
}
