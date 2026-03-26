export type SistemaRPG = 'tormenta' | 'naruto';

export interface FichaResumo {
  _id: string;
  nome: string;
  avatar: string;
  classes: { nome: string; nivel: number }[];
  sistema: SistemaRPG;
  ownerUid?: string;
  ownerEmail?: string;
}

export type AtributoId = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car';

export type BuffTipo =
  | 'teste_ataque'
  | 'dano_extra'
  | 'dano_fixo'
  | 'atributo'
  | 'vida'
  | 'mana'
  | 'pericia';

export type AlcanceTipo = string;

export interface BonusExtra {
  nome: string;
  valor: number;
  pm: number;
}

export interface DanoExtra {
  nome: string;
  valor: string;
  pm: number;
}

export interface Ataque {
  nome: string;
  dano: string;
  critico: string;
  tipo: string;
  alcanceTipo: AlcanceTipo;
  custoPM: number;
  danoAtributo: string;
  bonusExtras: BonusExtra[];
  danoExtras: DanoExtra[];
}

export interface Buff {
  nome: string;
  tipo: BuffTipo;
  atributoId?: AtributoId;
  periciaId?: string;
  valor: string;
  pm: number;
  ativo: boolean;
}

export interface Aprimoramento {
  descricao: string;
  custoPM: number;
}

export interface Magia {
  nome: string;
  escola: string;
  execucao: string;
  alcance: string;
  area: string;
  duracao: string;
  resistencia: string;
  custoPM: number;
  nivelMagia: number;
  aprimoramentos: Aprimoramento[];
  descricao: string;
}

export interface Habilidade {
  nome: string;
  origem: string;
  tipo: string;
  custoPM: number;
  descricao: string;
}

export interface ItemInventario {
  nome: string;
  quantidade: number;
  carga: number;
}

export interface ItemEquipado {
  nome: string;
}

export interface DefesaItem {
  nome: string;
  valor: number;
  penalidade: number;
}

export interface LogEntry {
  tipo: string;
  nome: string;
  pmGasto: number;
  timestamp: number | string;
  detalhes?: string | Record<string, unknown>;
}

export interface Classe {
  nome: string;
  nivel: number;
}

export interface PericiaData {
  treinado: boolean;
  outros: number;
  label?: string;
  atributo?: AtributoId;
}

export interface PontosVida {
  maximo: number;
  atual: number;
}

export interface PontosMana {
  maximo: number;
  atual: number;
}

export interface Defesa {
  base: number;
  itens: DefesaItem[];
}

export interface Moedas {
  tc: number;
  tp: number;
  to: number;
}

export interface Atributos {
  for: number;
  des: number;
  con: number;
  int: number;
  sab: number;
  car: number;
}

export interface Ficha {
  _id: string;
  /** Firebase Auth UID do dono (gravado pelo servidor) */
  ownerUid?: string;
  /** E-mail do dono no momento do último save (gravado pelo servidor) */
  ownerEmail?: string;
  sistema: SistemaRPG;
  nome: string;
  classes: Classe[];
  raca: string;
  origem: string;
  divindade: string;
  alinhamento: string;
  idade: string;
  tamanho: string;
  deslocamento: string;
  experiencia: number;
  atributos: Atributos;
  pv: PontosVida;
  pm: PontosMana;
  defesa: Defesa;
  reducaoDeDano: string;
  ataques: Ataque[];
  pericias: Record<string, PericiaData>;
  habilidades: Habilidade[];
  magias: Magia[];
  atributoChaveMagia: AtributoId;
  inventario: ItemInventario[];
  equipados: ItemEquipado[];
  moedas: Moedas;
  anotacoes: string;
  efeitosTemporarios: string;
  proficiencias: string;
  progressao: string[];
  buffs: Buff[];
  pvTemporario: number;
  pmTemporario: number;
  secoesFechadas: Record<string, boolean>;
  secoesOcultas: Record<string, boolean>;
  animacaoAtaque: string;
  avatar: string;
  logs: LogEntry[];
  // Legacy field for backwards compatibility
  nivel?: number;
}
