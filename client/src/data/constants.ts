import type { SistemaRPG } from '../types/ficha';

export const SISTEMA_ROUTE: Record<SistemaRPG, string> = {
  tormenta: '/tormenta/char',
  naruto: '/naruto/char',
};

export const BUFF_TIPOS: Record<string, string> = {
  teste_ataque: 'Teste de Ataque',
  dano_extra: 'Dano Extra',
  dano_fixo: 'Dano Fixo',
  atributo: 'Atributo',
  vida: 'Vida',
  mana: 'Mana',
  pericia: 'Perícia',
};

export const SEC_NOMES: Record<string, string> = {
  secCabecalho: 'Info Básica',
  secAtributos: 'Atributos & Defesa',
  secVidaMana: 'Vida / Mana',
  secBuffs: 'Buffs',
  secAtaques: 'Ataques',
  secHabilidades: 'Habilidades & Poderes',
  secMagias: 'Magias',
  secInventario: 'Inventário',
  secProficiencias: 'Proficiências',
  secEfeitos: 'Efeitos Temporários',
};

export const EQUIP_ICONS = ['🛡️', '⚔️', '🧥', '💍'];

export const LOG_ICONS: Record<string, string> = {
  ataque: '⚔',
  magia: '✨',
  buff_on: '▲',
  buff_off: '▼',
};

export const COMBATE_DEFAULT = {
  inimigos: [] as { nome: string; iniciativa: number | string; pvMax: number; pvAtual: number; limiarAlerta: number; limiarCritico: number }[],
  iniciativas: {} as Record<string, number | string>,
  turnoIdx: -1,
  ordenado: false,
};
