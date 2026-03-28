export type RPGSystem = 'tormenta' | 'naruto';

export interface CharacterSummary {
  _id: string;
  name: string;
  avatar: string;
  classes: { name: string; level: number }[];
  system: RPGSystem;
  ownerUid?: string;
  ownerEmail?: string;
  deletedAt?: string | null;
  pendingDeleteAt?: string | null;
}

export type AttributeId = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type BuffType =
  | 'attack_roll'
  | 'extra_damage'
  | 'fixed_damage'
  | 'attribute'
  | 'hp'
  | 'mp'
  | 'skill';

export type RangeType = string;

export interface ExtraBonus {
  name: string;
  value: number;
  mp: number;
}

export interface ExtraDamage {
  name: string;
  value: string;
  mp: number;
}

export interface Attack {
  name: string;
  damage: string;
  critical: string;
  type: string;
  rangeType: RangeType;
  mpCost: number;
  attributeDamageBonus: string;
  extraBonuses: ExtraBonus[];
  extraDamage: ExtraDamage[];
}

export interface Buff {
  name: string;
  type: BuffType;
  attributeId?: AttributeId;
  skillId?: string;
  value: string;
  mp: number;
  active: boolean;
}

export interface Enhancement {
  description: string;
  mpCost: number;
}

export interface Spell {
  name: string;
  school: string;
  castingTime: string;
  range: string;
  area: string;
  duration: string;
  resistance: string;
  mpCost: number;
  spellLevel: number;
  enhancements: Enhancement[];
  description: string;
}

export interface Ability {
  name: string;
  source: string;
  type: string;
  mpCost: number;
  description: string;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  weight: number;
}

export interface EquippedItem {
  name: string;
}

export interface DefenseItem {
  name: string;
  value: number;
  penalty: number;
}

export interface LogEntry {
  type: string;
  name: string;
  mpSpent: number;
  timestamp: number | string;
  details?: string | Record<string, unknown>;
}

export interface CharacterClass {
  name: string;
  level: number;
}

export interface SkillData {
  trained: boolean;
  misc: number;
  label?: string;
  attribute?: AttributeId;
}

export interface HitPoints {
  max: number;
  current: number;
}

export interface ManaPoints {
  max: number;
  current: number;
}

export interface Defense {
  base: number;
  items: DefenseItem[];
}

export interface Coins {
  copper: number;
  silver: number;
  gold: number;
}

export interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Character {
  _id: string;
  ownerUid?: string;
  ownerEmail?: string;
  system: RPGSystem;
  name: string;
  classes: CharacterClass[];
  race: string;
  origin: string;
  deity: string;
  alignment: string;
  age: string;
  size: string;
  speed: string;
  experience: number;
  attributes: Attributes;
  hp: HitPoints;
  mp: ManaPoints;
  defense: Defense;
  damageReduction: string;
  attacks: Attack[];
  skills: Record<string, SkillData>;
  abilities: Ability[];
  spells: Spell[];
  spellcastingAttribute: AttributeId;
  inventory: InventoryItem[];
  equipped: EquippedItem[];
  coins: Coins;
  notes: string;
  temporaryEffects: string;
  proficiencies: string;
  progression: string[];
  buffs: Buff[];
  temporaryHp: number;
  temporaryMp: number;
  collapsedSections: Record<string, boolean>;
  hiddenSections: Record<string, boolean>;
  attackAnimation: string;
  avatar: string;
  logs: LogEntry[];
  level?: number;

  /* ─── Naruto SNS fields (optional, only present when system === 'naruto') ─── */
  narpiAttributes?: import('./narutoCharacter').NarutoAttributes;
  combatSkills?: import('./narutoCharacter').NarutoCombatSkills;
  social?: import('./narutoCharacter').NarutoSocialAttributes;
  narpiSkills?: Record<string, import('./narutoCharacter').NarutoSkillData>;
  powers?: import('./narutoCharacter').NarutoPower[];
  aptitudes?: import('./narutoCharacter').NarutoAptitude[];
  jutsus?: import('./narutoCharacter').Jutsu[];
  damageEntries?: import('./narutoCharacter').DamageEntry[];
  weapons?: import('./narutoCharacter').NarutoWeapon[];
  armor?: import('./narutoCharacter').NarutoArmor;
  narpiItems?: import('./narutoCharacter').NarutoItem[];
  storedItems?: import('./narutoCharacter').NarutoItem[];
  narpiConfig?: import('./narutoCharacter').NarutoConfig;
  recursoExtra?: import('./narutoCharacter').NarutoRecursoExtra;
  clan?: string;
  campaignLevel?: number;
  shinobiRank?: string;
  gender?: string;
  sexuality?: string;
  tendency?: string;
  villageOrigin?: string;
  villageActive?: string;
  ryos?: number;
  ryosStored?: number;
  biography?: string;
  motto?: string;
  curiosities?: string;
  sensorType?: string;
  sensorRange?: string;
  bleedingGrades?: number;
  weaponReachCC?: number;
  targetHardness?: number;
  extraDamageCC?: string;
  extraDamageCD?: string;
  halfDamageGrade?: string;
}
