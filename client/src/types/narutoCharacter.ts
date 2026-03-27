/* ─── Naruto SNS: auxiliary types ─── */

export type NarutoAttributeId = 'for' | 'des' | 'agi' | 'per' | 'int' | 'vig' | 'esp';

export interface NarutoAttributes {
  for: number;
  des: number;
  agi: number;
  per: number;
  int: number;
  vig: number;
  esp: number;
}

/* ─── Combat Skills ─── */

export interface CombatSkillEntry {
  base: number;
  outro: number;
}

export interface NarutoCombatSkills {
  cc: CombatSkillEntry;   // + FOR
  cd: CombatSkillEntry;   // + DES
  esq: CombatSkillEntry;  // + AGI
  lm: CombatSkillEntry;   // + PER
}

/* ─── Social ─── */

export interface NarutoSocialAttributes {
  carisma: number;
  manipulacao: number;
}

/* ─── Energies (Naruto-specific tracking) ─── */

export interface NarutoRecursoExtra {
  label: string;
  total: number;
  perdido: number;
  color: string;
}

/* ─── Skills ─── */

export interface NarutoSkillData {
  pontos: number;
  outro: number;
  perito: boolean;
}

/* ─── Powers ─── */

export interface TechLevelEntry {
  level: number;
  chakraCost: number;
  damage: string;
  difficulty: string;
  outro: number;
}

export interface NarutoTechnique {
  id: string;
  name: string;
  unlockLevel: number;
  dealsDamage: boolean;
  hitAttr: 'cc' | 'cd' | '';
  type: string;
  action: string;
  target: string;
  range: string;
  duration: string;
  description: string;
  levelEntries: TechLevelEntry[];
}

export interface NarutoPower {
  id: string;
  name: string;
  level: number;
  effects: string;
  cost: number;
  powerType: 'habilidade' | 'jutsu';
  techniques?: NarutoTechnique[];
}

/* ─── Aptitudes ─── */

export interface NarutoAptitude {
  id: string;
  name: string;
  description: string;
  cost: number;
  free: boolean;
}

/* ─── Jutsus ─── */

export interface Jutsu {
  id: string;
  name: string;
  powerId: string;
  techniqueId: string;
  damageMod: number;
  hitMod: number;
}

/* ─── Weapons ─── */

export interface NarutoWeapon {
  id: string;
  name: string;
  damage: number;
  range: string;
  critical: string;
  type: string;       // C, P, E
  hitAttr: 'cc' | 'cd' | '';
  damageAttr: 'for' | 'des' | 'esp' | '';
  quantity: number;
  description: string;
  compartments: number;
}

/* ─── Armor ─── */

export interface NarutoArmor {
  name: string;
  absorption: number;
  hardness: number;
  penalty: number;
  type: 'leve' | 'pesada' | '';
  compartments: number;
}

/* ─── Items ─── */

export interface NarutoItem {
  id: string;
  name: string;
  quantity: number;
  perSlot: number;
  description: string;
  compartments: number;
}

/* ─── Damage Calculator ─── */

export interface DamageEntry {
  id: string;
  name: string;
  composition: string;
  atribHalf: number;
  weaponDamage: number;
  level: number;
  outro: number;
}

/* ─── Config Toggles ─── */

export interface NarutoConfig {
  [key: string]: boolean | number | string;
}
