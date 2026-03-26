import type { Character, AttributeId } from '../types/character';
import { SKILLS_CONFIG } from '../data/pericias';

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
    age: '',
    size: 'Médio',
    speed: '9m / 6q',
    experience: 0,
    attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    hp: { max: 0, current: 0 },
    mp: { max: 0, current: 0 },
    defense: { base: 10, items: [] },
    damageReduction: '',
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

export function createEmptyNarutoCharacter(name?: string): Character {
  return {
    _id: crypto.randomUUID(),
    system: 'naruto',
    name: name || 'Novo Personagem',
    classes: [{ name: '', level: 1 }],
    race: '',
    origin: '',
    deity: '',
    alignment: '',
    age: '',
    size: '',
    speed: '',
    experience: 0,
    attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    hp: { max: 0, current: 0 },
    mp: { max: 0, current: 0 },
    defense: { base: 10, items: [] },
    damageReduction: '',
    attacks: [],
    skills: {},
    abilities: [],
    spells: [],
    spellcastingAttribute: 'int',
    inventory: [],
    equipped: [],
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
    attackAnimation: '',
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

export function getEffectiveAttribute(character: Character, attr: AttributeId): number {
  let val = character.attributes[attr] || 0;
  if (character.buffs) {
    character.buffs.forEach((b) => {
      if (b.active && b.type === 'attribute' && b.attributeId === attr) {
        val += Number(b.value) || 0;
      }
    });
  }
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
  if (character.buffs) {
    character.buffs.forEach((b) => {
      if (b.active && b.type === 'skill' && b.skillId === skillId) {
        buffBonus += Number(b.value) || 0;
      }
    });
  }
  return halfLevel + attributeMod + trainingBonus + miscBonus + armorPenalty + buffBonus;
}

export function calcTotalDefense(character: Character): number {
  let total = character.defense.base || 10;
  if (character.defense.items) {
    character.defense.items.forEach((item) => {
      total += item.value || 0;
    });
  }
  return total;
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

export function calcAttackRoll(character: Character, atk: Character['attacks'][number]): number {
  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  let total = calcTotalSkill(character, skillId);
  if (atk.extraBonuses) atk.extraBonuses.forEach((b) => { total += Number(b.value) || 0; });
  if (character.buffs) character.buffs.forEach((b) => {
    if (b.active && b.type === 'attack_roll') total += Number(b.value) || 0;
  });
  return total;
}

export function calcDamageBonus(character: Character, atk: Character['attacks'][number]): number {
  const attrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  let total = getEffectiveAttribute(character, attrKey);
  if (atk.extraDamage) atk.extraDamage.forEach((b) => { total += Number(b.value) || 0; });
  if (character.buffs) character.buffs.forEach((b) => {
    if (b.active && b.type === 'fixed_damage') total += Number(b.value) || 0;
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
  if (character.buffs) character.buffs.forEach((b) => {
    if (b.active && b.type === 'extra_damage') {
      const v = String(b.value || '');
      if (v) extraDice.push(v);
    }
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
