import type { NarutoAttributeId } from '../../../types/narutoCharacter';

export const NARUTO_ATTRIBUTE_LABELS: Record<NarutoAttributeId, string> = {
  for: 'FOR',
  des: 'DES',
  agi: 'AGI',
  per: 'PER',
  int: 'INT',
  vig: 'VIG',
  esp: 'ESP',
};

export const NARUTO_ATTRIBUTE_FULL_NAMES: Record<NarutoAttributeId, string> = {
  for: 'Força',
  des: 'Destreza',
  agi: 'Agilidade',
  per: 'Percepção',
  int: 'Inteligência',
  vig: 'Vigor',
  esp: 'Espírito',
};

export const NARUTO_ATTRIBUTE_IDS: NarutoAttributeId[] = [
  'for', 'des', 'agi', 'per', 'int', 'vig', 'esp',
];
