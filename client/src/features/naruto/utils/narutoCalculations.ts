import type { Character } from '../../../types/character';
import type { NarutoAttributes, NarutoAttributeId } from '../../../types/narutoCharacter';
import { NARUTO_SKILLS_CONFIG } from '../data/narutoSkills';
import { getEvolutionRow } from '../data/narutoConstants';
import { getEffectsOfType } from '../data/narutoConfigEffects';

/* ─── Attribute helpers ─── */

export function getNarutoAttr(char: Character, attr: NarutoAttributeId): number {
  const base = char.narpiAttributes?.[attr] ?? 0;
  const bonuses = getEffectsOfType(char, 'attrBonus');
  let bonus = 0;
  for (const b of bonuses) {
    if (b.attr === attr) bonus += b.value;
  }
  return base + bonus;
}

function sumNarutoAttributes(attrs: NarutoAttributes): number {
  return attrs.for + attrs.des + attrs.agi + attrs.per + attrs.int + attrs.vig + attrs.esp;
}

/* ─── Point budgets ─── */

export function getAttributePointsRemaining(char: Character): number {
  const nc = char.campaignLevel ?? 4;
  const row = getEvolutionRow(nc);
  const used = char.narpiAttributes ? sumNarutoAttributes(char.narpiAttributes) : 0;
  return row.atributos - used;
}

export function getSkillPointsRemaining(char: Character): number {
  const nc = char.campaignLevel ?? 4;
  const row = getEvolutionRow(nc);
  let used = 0;
  if (char.narpiSkills) {
    Object.values(char.narpiSkills).forEach((s) => { used += s.pontos; });
  }
  return row.pericias - used;
}

export function getPowerPointsRemaining(char: Character): number {
  const nc = char.campaignLevel ?? 4;
  const row = getEvolutionRow(nc);
  let budget = row.poderes;

  const ppEffects = getEffectsOfType(char, 'powerPointsPerLevel');
  for (const eff of ppEffects) {
    budget += eff.value * nc;
  }

  let used = 0;
  if (char.powers) char.powers.forEach((p) => { used += p.cost; });
  if (char.aptitudes) {
    char.aptitudes.forEach((a) => {
      if (!a.free) used += a.cost;
    });
  }
  return budget - used;
}

export function getPowerLimit(char: Character): number {
  const nc = char.campaignLevel ?? 4;
  return Math.floor(nc / 2);
}

/* ─── Energies ─── */

export function calcVitalidadeTotal(char: Character): number {
  const vig = getNarutoAttr(char, 'vig');
  const nc = char.campaignLevel ?? 4;
  let total = 10 + (3 * vig) + (5 * nc);

  const flatBonuses = getEffectsOfType(char, 'vitalidadeBonus');
  for (const eff of flatBonuses) total += eff.value;

  const perAttr = getEffectsOfType(char, 'vitalidadePerAttr');
  for (const eff of perAttr) {
    const attrVal = getNarutoAttr(char, eff.attr);
    total += attrVal * eff.multiplier;
  }

  return total;
}

export function calcChakraTotal(char: Character): number {
  const esp = getNarutoAttr(char, 'esp');
  let total = 10 + (3 * esp);

  const flatBonuses = getEffectsOfType(char, 'chakraBonus');
  for (const eff of flatBonuses) total += eff.value;

  const fromAttr = getEffectsOfType(char, 'chakraBonusFromAttr');
  for (const eff of fromAttr) {
    total += getNarutoAttr(char, eff.attr);
  }

  const penalties = getEffectsOfType(char, 'chakraFlatPenalty');
  for (const eff of penalties) total -= eff.value;

  const multipliers = getEffectsOfType(char, 'chakraMultiplier');
  for (const eff of multipliers) {
    total = Math.floor(total * eff.value);
  }

  return Math.max(0, total);
}

/* ─── Combat Skills ─── */

const DEFAULT_COMBAT_ATTR: Record<string, NarutoAttributeId> = {
  cc: 'for', cd: 'des', esq: 'agi', lm: 'per',
};

export function getCombatSkillAttr(
  char: Character,
  skill: 'cc' | 'cd' | 'esq' | 'lm',
): NarutoAttributeId {
  const overrides = getEffectsOfType(char, 'combatAttrOverride');
  for (const o of overrides) {
    if (o.skill === skill) return o.attr;
  }
  return DEFAULT_COMBAT_ATTR[skill];
}

export function calcCombatSkillTotal(
  char: Character,
  skill: 'cc' | 'cd' | 'esq' | 'lm',
): number {
  const entry = char.combatSkills?.[skill];
  if (!entry) return 0;

  const attr = getCombatSkillAttr(char, skill);
  let total = entry.base + getNarutoAttr(char, attr) + entry.outro;

  const bonuses = getEffectsOfType(char, 'combatSkillBonus');
  for (const b of bonuses) {
    if (b.skill === skill) total += b.value;
  }

  return total;
}

/* ─── Derived Stats ─── */

export function calcIniciativa(char: Character): number {
  const prontidao = calcNarutoSkillTotal(char, 'prontidao');
  const agi = getNarutoAttr(char, 'agi');
  let total = prontidao + agi;

  const bonuses = getEffectsOfType(char, 'initiativeBonus');
  for (const b of bonuses) total += b.value;

  return total;
}

export function calcReacaoEsquiva(char: Character): number {
  const overrides = getEffectsOfType(char, 'reacaoOverride');
  if (overrides.length > 0) {
    const best = overrides.reduce((max, o) => {
      const val = calcCombatSkillTotal(char, o.useSkill) + 9;
      return val > max ? val : max;
    }, 0);
    const esqBase = calcCombatSkillTotal(char, 'esq') + 9;
    return Math.max(esqBase, best);
  }

  let total = calcCombatSkillTotal(char, 'esq') + 9;

  const bonuses = getEffectsOfType(char, 'esquivaBonus');
  for (const b of bonuses) total += b.value;

  return total;
}

export function calcDeslocamento(char: Character): number {
  const agi = getNarutoAttr(char, 'agi');
  let total = 10 + Math.ceil(agi / 2);

  const doubleEffects = getEffectsOfType(char, 'movementDoubleAgi');
  if (doubleEffects.length > 0) {
    total = 10 + agi;
  }

  const movBonuses = getEffectsOfType(char, 'movementBonus');
  for (const b of movBonuses) total += b.value;

  return Math.max(0, total);
}

export function calcDurezaTotal(char: Character): number {
  const armorHardness = char.armor?.hardness ?? 0;
  let total = armorHardness;

  const flatBonuses = getEffectsOfType(char, 'durezaBonus');
  for (const b of flatBonuses) total += b.value;

  const fromAttr = getEffectsOfType(char, 'durezaFromAttr');
  for (const eff of fromAttr) {
    total += Math.floor(getNarutoAttr(char, eff.attr) / eff.divisor);
  }

  return total;
}

/* ─── Skills ─── */

export function calcNarutoSkillTotal(char: Character, skillId: string): number {
  const cfg = NARUTO_SKILLS_CONFIG.find((s) => s.id === skillId);
  if (!cfg) return 0;
  const skill = char.narpiSkills?.[skillId];
  if (!skill) return 0;

  // Trained-only skills with 0 points → cannot use
  if (cfg.trained && skill.pontos === 0) return -1; // -1 signals "X" (can't use)

  const attrValue = getNarutoAttr(char, cfg.attribute);
  return skill.pontos + Math.ceil(attrValue / 2) + skill.outro;
}

/* ─── Social Skills ─── */

export function calcSocialSkillTotal(
  char: Character,
  base: 'carisma' | 'manipulacao',
  halfSkillId?: string,
  halfAttributeId?: NarutoAttributeId,
): number {
  const baseVal = base === 'carisma'
    ? (char.social?.carisma ?? 0)
    : (char.social?.manipulacao ?? 0);

  let half = 0;
  if (halfSkillId) {
    const skillTotal = calcNarutoSkillTotal(char, halfSkillId);
    half = skillTotal >= 0 ? Math.ceil(skillTotal / 2) : 0;
  } else if (halfAttributeId) {
    half = Math.ceil(getNarutoAttr(char, halfAttributeId) / 2);
  }

  return baseVal + half;
}

/* ─── Damage ─── */

export function calcDamageTotal(entry: { atribHalf: number; weaponDamage: number; level: number; outro: number }): number {
  return entry.atribHalf + entry.weaponDamage + entry.level + entry.outro;
}

export function calcDamageGrade(total: number, grade: number): number {
  return total * grade;
}

/* ─── Compartments ─── */

export function calcCompartmentsUsed(char: Character): number {
  let used = 0;
  if (char.weapons) char.weapons.forEach((w) => { used += w.compartments; });
  if (char.narpiItems) char.narpiItems.forEach((i) => { used += i.compartments; });
  if (char.armor) used += char.armor.compartments;
  return used;
}

export function calcCompartmentsTotal(char: Character): number {
  let total = 3;
  const bonuses = getEffectsOfType(char, 'compartmentBonus');
  for (const b of bonuses) total += b.value;
  return total;
}

export function calcCompartmentPenalty(char: Character): number {
  const used = calcCompartmentsUsed(char);
  return Math.max(0, used - calcCompartmentsTotal(char));
}

/* ─── Create Empty Character ─── */

export function createEmptyNarutoCharacter(name?: string): Character {
  const narpiSkills: Character['narpiSkills'] = {};
  NARUTO_SKILLS_CONFIG.forEach((s) => {
    narpiSkills[s.id] = { pontos: 0, outro: 0, perito: false };
  });

  return {
    _id: crypto.randomUUID(),
    system: 'naruto',
    name: name || 'Novo Personagem',

    // Combat-tracker-compatible fields
    classes: [{ name: 'Genin', level: 4 }],
    hp: { max: 30, current: 30 },   // 10 + 3*0 + 5*4
    mp: { max: 10, current: 10 },   // 10 + 3*0
    avatar: '',

    // Tormenta fields (kept for compatibility, unused by Naruto)
    race: '',
    origin: '',
    deity: '',
    alignment: '',
    languages: '',
    age: '',
    size: 'Médio',
    speed: '',
    experience: 0,
    attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    defense: { base: 10, items: [] },
    damageReduction: 0,
    attacks: [],
    skills: {},
    abilities: [],
    spells: [],
    spellcastingAttribute: 'int',
    inventory: [],
    equipped: [],
    coins: { copper: 0, silver: 0, gold: 0 },
    temporaryEffects: '',
    proficiencies: '',
    progression: [],
    buffs: [],
    temporaryHp: 0,
    temporaryMp: 0,
    attackAnimation: '',

    // Shared fields
    notes: '',
    collapsedSections: {},
    hiddenSections: {},
    logs: [],

    // Naruto-specific fields
    narpiAttributes: { for: 0, des: 0, agi: 0, per: 0, int: 0, vig: 0, esp: 0 },
    combatSkills: {
      cc:  { base: 3, outro: 0 },
      cd:  { base: 3, outro: 0 },
      esq: { base: 3, outro: 0 },
      lm:  { base: 3, outro: 0 },
    },
    social: { carisma: 0, manipulacao: 0 },
    narpiSkills,
    powers: [],
    aptitudes: [
      { id: crypto.randomUUID(), name: '', description: '', cost: 0, free: true },
      { id: crypto.randomUUID(), name: '', description: '', cost: 0, free: true },
      { id: crypto.randomUUID(), name: '', description: '', cost: 0, free: true },
    ],
    jutsus: [],
    damageEntries: [],
    weapons: [],
    weaponAttacks: [],
    armor: { name: '', absorption: 0, hardness: 0, penalty: 0, type: '', compartments: 0 },
    narpiItems: [],
    storedItems: [],
    narpiConfig: {},
    recursoExtra: { label: '', total: 0, perdido: 0, color: '#E74C3C' },

    clan: '',
    campaignLevel: 4,
    shinobiRank: 'Genin',
    gender: '',
    sexuality: '',
    tendency: '',
    villageOrigin: '',
    villageActive: '',
    ryos: 0,
    ryosStored: 0,
    biography: '',
    motto: '',
    curiosities: '',
    sensorType: 'naoSensor',
    sensorRange: '-',
    bleedingGrades: 0,
    weaponReachCC: 1,
    targetHardness: 0,
    extraDamageCC: '',
    extraDamageCD: '',
    halfDamageGrade: '',
  };
}

/**
 * Sync hp/mp fields from Naruto calculated values.
 * Call this whenever attributes or NC change so combat tracker stays in sync.
 */
export function syncNarutoHpMp(char: Character): Character {
  const hpMax = calcVitalidadeTotal(char);
  const mpMax = calcChakraTotal(char);

  // Keep "perdido" tracking via: current = max - perdido
  // perdido = max - current (from previous state)
  const hpPerdido = Math.max(0, (char.hp.max || hpMax) - char.hp.current);
  const mpPerdido = Math.max(0, (char.mp.max || mpMax) - char.mp.current);

  return {
    ...char,
    hp: { max: hpMax, current: Math.max(0, hpMax - hpPerdido) },
    mp: { max: mpMax, current: Math.max(0, mpMax - mpPerdido) },
  };
}
