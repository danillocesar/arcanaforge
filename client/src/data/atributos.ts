import type { AttributeId } from '../types/character';

export const ATTRIBUTE_LABELS: Record<AttributeId, string> = {
  str: 'For',
  dex: 'Des',
  con: 'Con',
  int: 'Int',
  wis: 'Sab',
  cha: 'Car',
};

export const ATTRIBUTE_FULL_NAMES: Record<AttributeId, string> = {
  str: 'Força',
  dex: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  wis: 'Sabedoria',
  cha: 'Carisma',
};
