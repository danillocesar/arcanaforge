import type { RPGSystem } from '../types/character';

export const SYSTEM_ROUTES: Record<RPGSystem, string> = {
  tormenta: '/tormenta/char',
};

/** As 8 escolas de magia oficiais do T20. */
export const SPELL_SCHOOLS = [
  'Abjuração',
  'Adivinhação',
  'Convocação',
  'Encantamento',
  'Evocação',
  'Ilusão',
  'Necromancia',
  'Transmutação',
];

/** Custo-base de PM por círculo (T20, tabela de conjuração). */
export const SPELL_LEVEL_MP_COST: Record<number, number> = { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15 };
export const baseMpCostForLevel = (level: number) => SPELL_LEVEL_MP_COST[level] ?? 1;

/** Os tipos de dano oficiais do T20 (para ataques e efeitos). */
export const DAMAGE_TYPES = [
  'Ácido',
  'Corte',
  'Eletricidade',
  'Essência',
  'Fogo',
  'Frio',
  'Impacto',
  'Luz',
  'Mental',
  'Perfuração',
  'Trevas',
  'Veneno',
];

export const BUFF_TYPES: Record<string, string> = {
  attack_roll: 'Teste de Ataque',
  extra_damage: 'Dano Extra',
  fixed_damage: 'Dano Fixo',
  attribute: 'Atributo',
  max_hp: 'Vida (Fixa)',
  max_mp: 'Mana (Fixa)',
  temp_hp: 'Vida (Temporária)',
  temp_mp: 'Mana (Temporária)',
  skill: 'Perícia',
  defense: 'Defesa',
};

/** Keys = English `id` on `<Section>`; values = nav labels (PT UI). */
export const SECTION_LABELS: Record<string, string> = {
  secHeader: 'Dados do Personagem',
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

/** Old Portuguese section ids → English (migrate saved hiddenSections / collapsedSections). */
export const SECTION_ID_LEGACY_PT: Record<string, string> = {
  secCabecalho: 'secHeader',
  secAtributos: 'secAttributes',
  secVidaMana: 'secHpMp',
  secAtaques: 'secAttacks',
  secHabilidades: 'secAbilities',
  secMagias: 'secSpells',
  secInventario: 'secInventory',
  secProficiencias: 'secProficiencies',
  secEfeitos: 'secEffects',
};

export function isSectionKeyActive(
  map: Record<string, boolean> | undefined,
  sectionId: string,
): boolean {
  if (!map) return false;
  if (map[sectionId]) return true;
  const ptKey = Object.entries(SECTION_ID_LEGACY_PT).find(([, en]) => en === sectionId)?.[0];
  return ptKey ? !!map[ptKey] : false;
}

export function isSectionHidden(
  hidden: Record<string, boolean> | undefined,
  sectionId: string,
): boolean {
  return isSectionKeyActive(hidden, sectionId);
}

export const EQUIP_ICONS = ['🛡️', '⚔️', '🧥', '💍'];

export const LOG_ICONS: Record<string, string> = {
  attack: '⚔',
  spell: '✨',
  buff_on: '▲',
  buff_off: '▼',
  damage: '💥',
  rest: '🌅',
};

export const COMBAT_DEFAULT = {
  enemies: [] as { name: string; initiative: number | string; maxHp: number; currentHp: number; woundThreshold: number; criticalThreshold: number }[],
  initiatives: {} as Record<string, number | string>,
  turnIndex: -1,
  ordered: false,
};
