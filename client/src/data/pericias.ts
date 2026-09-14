import type { AttributeId } from '../types/character';

export interface SkillConfig {
  id: string;
  name: string;
  attribute: AttributeId;
  armorPenalty: boolean;
  trained?: boolean;
  customLabel?: boolean;
}

export const SKILLS_CONFIG: SkillConfig[] = [
  { id: 'acrobacia', name: 'Acrobacia', attribute: 'dex', armorPenalty: true },
  { id: 'adestramento', name: 'Adestramento', attribute: 'cha', armorPenalty: false, trained: true },
  { id: 'atletismo', name: 'Atletismo', attribute: 'str', armorPenalty: false },
  { id: 'atuacao', name: 'Atuação', attribute: 'cha', armorPenalty: false, trained: true },
  { id: 'cavalgar', name: 'Cavalgar', attribute: 'dex', armorPenalty: false },
  { id: 'conhecimento', name: 'Conhecimento', attribute: 'int', armorPenalty: false, trained: true },
  { id: 'cura', name: 'Cura', attribute: 'wis', armorPenalty: false },
  { id: 'diplomacia', name: 'Diplomacia', attribute: 'cha', armorPenalty: false },
  { id: 'enganacao', name: 'Enganação', attribute: 'cha', armorPenalty: false },
  { id: 'fortitude', name: 'Fortitude', attribute: 'con', armorPenalty: false },
  { id: 'furtividade', name: 'Furtividade', attribute: 'dex', armorPenalty: true },
  { id: 'guerra', name: 'Guerra', attribute: 'int', armorPenalty: false, trained: true },
  { id: 'iniciativa', name: 'Iniciativa', attribute: 'dex', armorPenalty: false },
  { id: 'intimidacao', name: 'Intimidação', attribute: 'cha', armorPenalty: false },
  { id: 'intuicao', name: 'Intuição', attribute: 'wis', armorPenalty: false },
  { id: 'investigacao', name: 'Investigação', attribute: 'int', armorPenalty: false },
  { id: 'jogatina', name: 'Jogatina', attribute: 'cha', armorPenalty: false, trained: true },
  { id: 'ladinagem', name: 'Ladinagem', attribute: 'dex', armorPenalty: true, trained: true },
  { id: 'luta', name: 'Luta', attribute: 'str', armorPenalty: false },
  { id: 'misticismo', name: 'Misticismo', attribute: 'int', armorPenalty: false, trained: true },
  { id: 'nobreza', name: 'Nobreza', attribute: 'int', armorPenalty: false, trained: true },
  // Dois slots de Ofício de propósito (T20 permite vários) — nomes padrão distintos
  // pra não parecerem duplicata enquanto o jogador não dá o rótulo próprio.
  { id: 'oficio1', name: 'Ofício 1', attribute: 'int', armorPenalty: false, trained: true, customLabel: true },
  { id: 'oficio2', name: 'Ofício 2', attribute: 'int', armorPenalty: false, trained: true, customLabel: true },
  { id: 'percepacao', name: 'Percepção', attribute: 'wis', armorPenalty: false },
  { id: 'pilotagem', name: 'Pilotagem', attribute: 'dex', armorPenalty: false, trained: true },
  { id: 'pontaria', name: 'Pontaria', attribute: 'dex', armorPenalty: false },
  { id: 'reflexos', name: 'Reflexos', attribute: 'dex', armorPenalty: false },
  { id: 'religiao', name: 'Religião', attribute: 'wis', armorPenalty: false, trained: true },
  { id: 'sobrevivencia', name: 'Sobrevivência', attribute: 'wis', armorPenalty: false },
  { id: 'vontade', name: 'Vontade', attribute: 'wis', armorPenalty: false },
];
