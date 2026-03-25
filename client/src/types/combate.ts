export interface Inimigo {
  id: string;
  nome: string;
  pvMax: number;
  pvAtual: number;
  iniciativa: number;
  limiarAlerta: number;
  limiarCritico: number;
}

export interface CombateData {
  inimigos: Inimigo[];
  iniciativas: Record<string, number>;
  turnoIdx: number;
  ordenado: boolean;
}

export interface CombateJogador {
  nome: string;
  avatar: string;
  classes: { nome: string; nivel: number }[];
  pvMax: number;
  pvAtual: number;
  pmMax: number;
  pmAtual: number;
}

export interface CombateRow {
  tipo: 'jogador' | 'inimigo';
  id: string;
  nome: string;
  iniciativa: number;
  pvMax?: number;
  pvAtual?: number;
  pmMax?: number;
  pmAtual?: number;
  avatar?: string;
  classes?: { nome: string; nivel: number }[];
  limiarAlerta?: number;
  limiarCritico?: number;
}
