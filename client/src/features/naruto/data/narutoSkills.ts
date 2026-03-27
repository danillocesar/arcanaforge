import type { NarutoAttributeId } from '../../../types/narutoCharacter';

export interface NarutoSkillConfig {
  id: string;
  name: string;
  attribute: NarutoAttributeId;
  trained: boolean;       // [x] — requires at least 1 point to use
  doubleTrained: boolean; // [x][x] — requires Químico aptitude
  armorPenalty: boolean;
}

export const NARUTO_SKILLS_CONFIG: NarutoSkillConfig[] = [
  { id: 'acrobacia',        name: 'Acrobacia',           attribute: 'agi', trained: false, doubleTrained: false, armorPenalty: true },
  { id: 'arte',             name: 'Arte',                attribute: 'int', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'atletismo',        name: 'Atletismo',           attribute: 'for', trained: false, doubleTrained: false, armorPenalty: true },
  { id: 'cienciasNaturais', name: 'Ciências Naturais',   attribute: 'int', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'concentracao',     name: 'Concentração',        attribute: 'int', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'cultura',          name: 'Cultura',             attribute: 'int', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'disfarce',         name: 'Disfarce',            attribute: 'per', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'escapar',          name: 'Escapar',             attribute: 'des', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'furtividade',      name: 'Furtividade',         attribute: 'agi', trained: false, doubleTrained: false, armorPenalty: true },
  { id: 'lidarComAnimais',  name: 'Lidar com Animais',   attribute: 'per', trained: true,  doubleTrained: false, armorPenalty: false },
  { id: 'mecanismo',        name: 'Mecanismo',           attribute: 'int', trained: true,  doubleTrained: false, armorPenalty: false },
  { id: 'medicina',         name: 'Medicina',            attribute: 'int', trained: true,  doubleTrained: false, armorPenalty: false },
  { id: 'ocultismo',        name: 'Ocultismo',           attribute: 'int', trained: true,  doubleTrained: false, armorPenalty: false },
  { id: 'prestidigitacao',  name: 'Prestidigitação',     attribute: 'des', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'procurar',         name: 'Procurar',            attribute: 'per', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'prontidao',        name: 'Prontidão',           attribute: 'per', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'rastrear',         name: 'Rastrear',            attribute: 'per', trained: false, doubleTrained: false, armorPenalty: false },
  { id: 'veneficio',        name: 'Venefício',           attribute: 'int', trained: true,  doubleTrained: true,  armorPenalty: false },
];
