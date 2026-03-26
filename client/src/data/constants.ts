import type { RPGSystem } from '../types/character';

export const SYSTEM_ROUTES: Record<RPGSystem, string> = {
  tormenta: '/tormenta/char',
  naruto: '/naruto/char',
};

export const BUFF_TYPES: Record<string, string> = {
  attack_roll: 'Teste de Ataque',
  extra_damage: 'Dano Extra',
  fixed_damage: 'Dano Fixo',
  attribute: 'Atributo',
  hp: 'Vida',
  mp: 'Mana',
  skill: 'Perícia',
};

export const SECTION_LABELS: Record<string, string> = {
  secHeader: 'Info Básica',
  secAttributes: 'Atributos & Defesa',
  secHpMp: 'Vida / Mana',
  secBuffs: 'Buffs',
  secAttacks: 'Ataques',
  secAbilities: 'Habilidades & Poderes',
  secSpells: 'Magias',
  secInventory: 'Inventário',
  secProficiencies: 'Proficiências',
  secEffects: 'Efeitos Temporários',
};

export const EQUIP_ICONS = ['🛡️', '⚔️', '🧥', '💍'];

export const LOG_ICONS: Record<string, string> = {
  attack: '⚔',
  spell: '✨',
  buff_on: '▲',
  buff_off: '▼',
};

export const COMBAT_DEFAULT = {
  enemies: [] as { name: string; initiative: number | string; maxHp: number; currentHp: number; woundThreshold: number; criticalThreshold: number }[],
  initiatives: {} as Record<string, number | string>,
  turnIndex: -1,
  ordered: false,
};
