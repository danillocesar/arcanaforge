import type { AtributoId } from '../types/ficha';

export const ATRIBUTOS_NOME: Record<AtributoId, string> = {
  for: 'For',
  des: 'Des',
  con: 'Con',
  int: 'Int',
  sab: 'Sab',
  car: 'Car',
};

export const ATRIBUTOS_COMPLETO: Record<AtributoId, string> = {
  for: 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  car: 'Carisma',
};
