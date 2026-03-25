import type { AtributoId } from '../types/ficha';

export interface PericiaConfig {
  id: string;
  nome: string;
  atributo: AtributoId;
  penArmadura: boolean;
  treinado?: boolean;
  customLabel?: boolean;
}

export const PERICIAS_CONFIG: PericiaConfig[] = [
  { id: 'acrobacia', nome: 'Acrobacia', atributo: 'des', penArmadura: true },
  { id: 'adestramento', nome: 'Adestramento', atributo: 'car', penArmadura: false, treinado: true },
  { id: 'atletismo', nome: 'Atletismo', atributo: 'for', penArmadura: false },
  { id: 'atuacao', nome: 'Atuação', atributo: 'car', penArmadura: false, treinado: true },
  { id: 'cavalgar', nome: 'Cavalgar', atributo: 'des', penArmadura: false },
  { id: 'conhecimento', nome: 'Conhecimento', atributo: 'int', penArmadura: false, treinado: true },
  { id: 'cura', nome: 'Cura', atributo: 'sab', penArmadura: false },
  { id: 'diplomacia', nome: 'Diplomacia', atributo: 'car', penArmadura: false },
  { id: 'enganacao', nome: 'Enganação', atributo: 'car', penArmadura: false },
  { id: 'fortitude', nome: 'Fortitude', atributo: 'con', penArmadura: false },
  { id: 'furtividade', nome: 'Furtividade', atributo: 'des', penArmadura: true },
  { id: 'guerra', nome: 'Guerra', atributo: 'int', penArmadura: false, treinado: true },
  { id: 'iniciativa', nome: 'Iniciativa', atributo: 'des', penArmadura: false },
  { id: 'intimidacao', nome: 'Intimidação', atributo: 'car', penArmadura: false },
  { id: 'intuicao', nome: 'Intuição', atributo: 'sab', penArmadura: false },
  { id: 'investigacao', nome: 'Investigação', atributo: 'int', penArmadura: false },
  { id: 'jogatina', nome: 'Jogatina', atributo: 'car', penArmadura: false, treinado: true },
  { id: 'ladinagem', nome: 'Ladinagem', atributo: 'des', penArmadura: true, treinado: true },
  { id: 'luta', nome: 'Luta', atributo: 'for', penArmadura: false },
  { id: 'misticismo', nome: 'Misticismo', atributo: 'int', penArmadura: false, treinado: true },
  { id: 'nobreza', nome: 'Nobreza', atributo: 'int', penArmadura: false, treinado: true },
  { id: 'oficio1', nome: 'Ofício', atributo: 'int', penArmadura: false, treinado: true, customLabel: true },
  { id: 'oficio2', nome: 'Ofício', atributo: 'int', penArmadura: false, treinado: true, customLabel: true },
  { id: 'percepacao', nome: 'Percepção', atributo: 'sab', penArmadura: false },
  { id: 'pilotagem', nome: 'Pilotagem', atributo: 'des', penArmadura: false, treinado: true },
  { id: 'pontaria', nome: 'Pontaria', atributo: 'des', penArmadura: false },
  { id: 'reflexos', nome: 'Reflexos', atributo: 'des', penArmadura: false },
  { id: 'religiao', nome: 'Religião', atributo: 'sab', penArmadura: false },
  { id: 'sobrevivencia', nome: 'Sobrevivência', atributo: 'sab', penArmadura: false },
  { id: 'vontade', nome: 'Vontade', atributo: 'sab', penArmadura: false },
];
