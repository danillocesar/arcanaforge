/* ─── Evolution Table (NC 4–20) ─── */

export interface EvolutionRow {
  nc: number;
  rank: string;
  atributos: number;
  pericias: number;
  poderes: number;
  minAttr: number;
}

export const EVOLUTION_TABLE: EvolutionRow[] = [
  { nc: 4,  rank: 'Genin',            atributos: 12, pericias: 8,  poderes: 4,  minAttr: 0 },
  { nc: 5,  rank: 'Genin',            atributos: 18, pericias: 12, poderes: 6,  minAttr: 1 },
  { nc: 6,  rank: 'Genin',            atributos: 24, pericias: 16, poderes: 8,  minAttr: 1 },
  { nc: 7,  rank: 'Chuunin',          atributos: 30, pericias: 20, poderes: 10, minAttr: 2 },
  { nc: 8,  rank: 'Chuunin',          atributos: 36, pericias: 24, poderes: 12, minAttr: 2 },
  { nc: 9,  rank: 'Chuunin',          atributos: 42, pericias: 28, poderes: 14, minAttr: 3 },
  { nc: 10, rank: 'Jounin Especial',  atributos: 48, pericias: 32, poderes: 16, minAttr: 3 },
  { nc: 11, rank: 'Jounin Especial',  atributos: 54, pericias: 36, poderes: 18, minAttr: 4 },
  { nc: 12, rank: 'Jounin',           atributos: 60, pericias: 40, poderes: 20, minAttr: 4 },
  { nc: 13, rank: 'Jounin',           atributos: 66, pericias: 44, poderes: 22, minAttr: 5 },
  { nc: 14, rank: 'Jounin',           atributos: 72, pericias: 48, poderes: 24, minAttr: 5 },
  { nc: 15, rank: 'Jounin Elite',     atributos: 78, pericias: 52, poderes: 26, minAttr: 6 },
  { nc: 16, rank: 'Jounin Elite',     atributos: 84, pericias: 56, poderes: 28, minAttr: 6 },
  { nc: 17, rank: 'Jounin Elite',     atributos: 90, pericias: 60, poderes: 30, minAttr: 7 },
  { nc: 18, rank: 'Sannin/Kage',      atributos: 96, pericias: 64, poderes: 32, minAttr: 7 },
  { nc: 19, rank: 'Sannin/Kage',      atributos: 102, pericias: 68, poderes: 34, minAttr: 8 },
  { nc: 20, rank: 'Sannin/Kage',      atributos: 108, pericias: 72, poderes: 40, minAttr: 8 },
];

export function getEvolutionRow(nc: number): EvolutionRow {
  return EVOLUTION_TABLE.find((r) => r.nc === nc) ?? EVOLUTION_TABLE[0];
}

/* ─── Damage Grade Table (2d8) ─── */

export interface DamageGrade {
  range: string;
  label: string;
  multiplier: number;
}

export const DAMAGE_GRADES: DamageGrade[] = [
  { range: '2–3',   label: 'Falha',  multiplier: 0 },
  { range: '4–8',   label: 'Grau 1', multiplier: 1 },
  { range: '9–11',  label: 'Grau 2', multiplier: 2 },
  { range: '12–14', label: 'Grau 3', multiplier: 3 },
  { range: '15–16', label: 'Grau 4', multiplier: 4 },
];

/* ─── Sensor Types ─── */

export const SENSOR_TYPES: { id: string; name: string; range: string }[] = [
  { id: 'naoSensor',         name: 'Não Sensor',              range: '-' },
  { id: 'sensor',            name: 'Sensor (Aptidão)',        range: '12m' },
  { id: 'shokaichuu',        name: 'Shōkaichū',              range: '20m' },
  { id: 'byakugan',          name: 'Byakugan',               range: '12m' },
  { id: 'byakuganExt',       name: 'Byakugan Estendido',     range: '24m' },
  { id: 'byakuganProg',      name: 'Byakugan Progressivo',   range: '50m' },
  { id: 'hakken',            name: 'Hakken no Jutsu',         range: '12m' },
  { id: 'shindenshin',       name: 'Shindenshin',            range: '12m' },
  { id: 'kagura',            name: 'Kagura Shingan',          range: '24m' },
  { id: 'kaguraExt',         name: 'Kagura S. Estendido',    range: '48m' },
  { id: 'kaguraProg',        name: 'Kagura S. Progressivo',  range: '100m' },
  { id: 'kekkiTouta',        name: 'Kekki Touta Prog.',      range: '50m' },
  { id: 'senjutsu1',         name: 'Senjutsu 1*',            range: '7m' },
  { id: 'senjutsu2',         name: 'Senjutsu 2*',            range: '14m' },
  { id: 'senjutsuMax',       name: 'Senjutsu Maximizado',    range: '100m' },
  { id: 'entreSonhos',       name: 'C. Entre Sonhos',        range: '20m' },
  { id: 'entreSonhos3',      name: 'C. Entre Sonhos 3',      range: '40m' },
  { id: 'reibi',             name: 'Reibi Emoções',          range: '14m' },
];

/* ─── Size Table ─── */

export interface SizeEntry {
  id: string;
  name: string;
  forVig: number;
  attack: number;
  reach: number;
  stealth: number;
  intimidate: number;
  movement: number;
}

export const SIZE_TABLE: SizeEntry[] = [
  { id: 'minusculo',  name: 'Minúsculo',  forVig: -7, attack: 2,  reach: 1, stealth: 5,  intimidate: -2, movement: -12 },
  { id: 'diminuto',   name: 'Diminuto',    forVig: -5, attack: 1,  reach: 1, stealth: 3,  intimidate: -2, movement: -9 },
  { id: 'miudo',      name: 'Miúdo',       forVig: -3, attack: 1,  reach: 1, stealth: 2,  intimidate: -1, movement: -6 },
  { id: 'pequeno',    name: 'Pequeno',     forVig: -1, attack: 0,  reach: 1, stealth: 1,  intimidate: -1, movement: -3 },
  { id: 'medio',      name: 'Médio',       forVig: 0,  attack: 0,  reach: 1, stealth: 0,  intimidate: 0,  movement: 0 },
  { id: 'grande',     name: 'Grande',      forVig: 1,  attack: 0,  reach: 2, stealth: -1, intimidate: 1,  movement: 3 },
  { id: 'enorme',     name: 'Enorme',      forVig: 3,  attack: 0,  reach: 3, stealth: -2, intimidate: 1,  movement: 6 },
  { id: 'imenso',     name: 'Imenso',      forVig: 5,  attack: 0,  reach: 4, stealth: -3, intimidate: 2,  movement: 9 },
  { id: 'colossal',   name: 'Colossal',    forVig: 7,  attack: 0,  reach: 5, stealth: -5, intimidate: 2,  movement: 12 },
  { id: 'incrivel',   name: 'Incrível',    forVig: 9,  attack: 0,  reach: 6, stealth: -7, intimidate: 3,  movement: 15 },
];

/* ─── Section Labels (Naruto) ─── */

export const NARUTO_SECTION_LABELS: Record<string, string> = {
  secHeader:      'Dados do Personagem',
  secAttributes:  'Atributos & Combate',
  secEnergies:    'Vitalidade / Chakra',
  secCombat:      'Combate',
  secSocial:      'Social',
  secJutsus:      'Jutsus',
  secAttacks:     'Ataques',
  secPowers:      'Poderes',
  secAptitudes:   'Aptidões',
  secDamage:      'Calculadora de Dano',
  secInventory:   'Inventário',
};

/* ─── Reference Formulas ─── */

export const REFERENCE_FORMULAS = [
  { label: 'Dano Corporal',          formula: 'Dano de Arma + Força/2' },
  { label: 'Dano à Distância',       formula: 'Dano de Arma + Destreza/2' },
  { label: 'Dano Base (Poder)',       formula: 'Nv.Usado + Espírito/2 + Bônus do Poder' },
  { label: 'DIF de Testes',          formula: '9 (ou 7 se Vigor) + Nv.Usado + Espírito/2 + Bônus' },
  { label: 'Tamanho (P;M;G)',        formula: '(0,5m ; 1m ; 2m) × Espírito ou Nv. do Poder' },
  { label: 'Alcance (C;M;L)',        formula: '(5m ; 10m ; 15m) + (1m ; 2m ; 3m) × Espírito' },
  { label: 'DIF Concentração',       formula: '7 + Dano Base  OU  3 + Maior CC Inimigo' },
  { label: 'DIF Sangramento',        formula: 'DIF 16 (Medicina) ou 18 (Vigor)' },
  { label: 'Limite Nível de Poder',  formula: 'NC / 2 (arredonda para baixo)' },
];
