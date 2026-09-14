import type { AttackModifier, BuffEffect } from '../types/character';

/** Melhoria = item superior (mundano). Encanto = item mágico. */
export type ItemEnhancementKind = 'melhoria' | 'encanto';

/** A que tipo de item a entrada se aplica. `protecao` cobre armadura e escudo. */
export type ItemEnhancementTarget = 'arma' | 'protecao';

export interface OfficialItemEnhancement {
  name: string;
  kind: ItemEnhancementKind;
  targets: ItemEnhancementTarget[];
  /** Efeito resumido, como na tabela do livro. */
  description: string;
  /** Melhoria que precisa existir antes desta (ex.: Atroz exige Cruel). */
  prerequisite?: string;
  /** Efeitos numéricos aplicáveis direto. Ausente ⇒ o efeito é procedural, só descrição. */
  buffs?: BuffEffect[];
  attackModifiers?: AttackModifier[];
}

const skill = (skillId: string, value: string): BuffEffect => ({ type: 'skill', skillId, value });

/**
 * Catálogo de melhorias (itens superiores) e encantos (itens mágicos) do T20.
 *
 * Extraído em 19/08/2026 dos geradores do Fichas de Nimb
 * (fichasdenimb.com.br/itens-superiores e /itens-magicos): 16 melhorias de arma,
 * 13 de armadura/escudo e 28 encantos.
 *
 * As descrições são o **resumo da tabela**, não o texto integral do livro — é o que a
 * fonte expõe. Onde o efeito é numérico e direto (+1 de ataque, +1d6 de dano, +2 numa
 * perícia) ele vem convertido em `attackModifiers`/`buffs` e o picker aplica sozinho;
 * onde é procedural (margem de ameaça, multiplicador de crítico, penalidade de
 * armadura) fica só a descrição, mesmo critério do `OFFICIAL_CONDITIONS`.
 */
export const OFFICIAL_ITEM_ENHANCEMENTS: OfficialItemEnhancement[] = [
  /* ───────────────────────── Melhorias · Arma ───────────────────────── */
  {
    name: 'Atroz',
    kind: 'melhoria',
    targets: ['arma'],
    description: '+2 nas rolagens de dano',
    prerequisite: 'Cruel',
    attackModifiers: [{ label: 'Atroz', damageBonus: 2 }],
  },
  {
    name: 'Certeira',
    kind: 'melhoria',
    targets: ['arma'],
    description: '+1 nos testes de ataque',
    attackModifiers: [{ label: 'Certeira', attackRoll: 1 }],
  },
  {
    name: 'Cruel',
    kind: 'melhoria',
    targets: ['arma'],
    description: '+1 nas rolagens de dano',
    attackModifiers: [{ label: 'Cruel', damageBonus: 1 }],
  },
  {
    name: 'Equilibrada',
    kind: 'melhoria',
    targets: ['arma'],
    description: '+2 em testes de manobras',
  },
  {
    name: 'Harmonizada',
    kind: 'melhoria',
    targets: ['arma'],
    description: 'Custo de habilidades de ataque diminui em -1 PM',
  },
  {
    name: 'Injeção alquímica',
    kind: 'melhoria',
    targets: ['arma'],
    description: 'Gera efeito de preparado',
  },
  {
    name: 'Maciça',
    kind: 'melhoria',
    targets: ['arma'],
    description: '+1 no multiplicador de crítico',
  },
  {
    name: 'Mira telescópica',
    kind: 'melhoria',
    targets: ['arma'],
    description: 'Aumenta alcance da arma',
  },
  {
    name: 'Precisa',
    kind: 'melhoria',
    targets: ['arma'],
    description: '+1 na margem de ameaça',
  },
  {
    name: 'Pungente',
    kind: 'melhoria',
    targets: ['arma'],
    description: '+2 nos testes de ataque',
    prerequisite: 'Certeira',
    attackModifiers: [{ label: 'Pungente', attackRoll: 2 }],
  },

  /* ─────────────────── Melhorias · Armadura e escudo ─────────────────── */
  {
    name: 'Ajustada',
    kind: 'melhoria',
    targets: ['protecao'],
    description: '-1 na penalidade de armadura',
  },
  {
    name: 'Delicada',
    kind: 'melhoria',
    targets: ['protecao'],
    description: 'Aplica 1 ponto de Des na Defesa',
  },
  {
    name: 'Espinhosa',
    kind: 'melhoria',
    targets: ['protecao'],
    description: 'Causa dano com agarrar (armadura) / Aumenta dano do escudo (escudo)',
  },
  {
    name: 'Polida',
    kind: 'melhoria',
    targets: ['protecao'],
    description: '+2 na Defesa na primeira rodada',
  },
  {
    name: 'Reforçada',
    kind: 'melhoria',
    targets: ['protecao'],
    description: '+1 na Defesa; +1 na penalidade de armadura',
    buffs: [{ type: 'defense', value: '1' }],
  },
  {
    name: 'Selada',
    kind: 'melhoria',
    targets: ['protecao'],
    description: '+1 nos testes de resistência',
    buffs: [skill('fortitude', '1'), skill('reflexos', '1'), skill('vontade', '1')],
  },
  {
    name: 'Sob medida',
    kind: 'melhoria',
    targets: ['protecao'],
    description: '-2 na penalidade de armadura',
    prerequisite: 'Ajustada',
  },

  /* ──────────────── Melhorias · Arma, armadura e escudo ──────────────── */
  {
    name: 'Banhada a ouro',
    kind: 'melhoria',
    targets: ['arma', 'protecao'],
    description: '+2 em Diplomacia',
    buffs: [skill('diplomacia', '2')],
  },
  {
    name: 'Cravejada de gemas',
    kind: 'melhoria',
    targets: ['arma', 'protecao'],
    description: '+2 em Enganação',
    buffs: [skill('enganacao', '2')],
  },
  {
    name: 'Discreta',
    kind: 'melhoria',
    targets: ['arma', 'protecao'],
    description: '-1 espaço; +5 para ocultar',
  },
  {
    name: 'Luxuosa',
    kind: 'melhoria',
    targets: ['arma', 'protecao'],
    description: '+2 em Intimidação; +2 em Diplomacia',
    buffs: [skill('intimidacao', '2'), skill('diplomacia', '2')],
  },
  {
    name: 'Macabro',
    kind: 'melhoria',
    targets: ['arma', 'protecao'],
    description: '+2 em Intimidação; -2 em Diplomacia',
    buffs: [skill('intimidacao', '2'), skill('diplomacia', '-2')],
  },
  {
    name: 'Material especial',
    kind: 'melhoria',
    targets: ['arma', 'protecao'],
    description: 'Conforme o material',
  },

  /* ────────────────────────────── Encantos ───────────────────────────── */
  { name: 'Ameaçadora', kind: 'encanto', targets: ['arma'], description: 'Duplica margem de ameaça' },
  { name: 'Anticriatura', kind: 'encanto', targets: ['arma'], description: 'Bônus contra tipo de criatura' },
  { name: 'Arremesso', kind: 'encanto', targets: ['arma'], description: 'Pode ser arremessada' },
  { name: 'Assassina', kind: 'encanto', targets: ['arma'], description: 'Aumenta ataque furtivo' },
  { name: 'Caçadora', kind: 'encanto', targets: ['arma'], description: 'Ignora camuflagem leve e total e cobertura leve' },
  {
    name: 'Congelante',
    kind: 'encanto',
    targets: ['arma'],
    description: '+1d6 de dano de frio',
    attackModifiers: [{ label: 'Congelante', damageDice: '1d6' }],
  },
  { name: 'Conjuradora', kind: 'encanto', targets: ['arma'], description: 'Pode guardar e lançar magias' },
  {
    name: 'Corrosiva',
    kind: 'encanto',
    targets: ['arma'],
    description: '+1d6 de dano de ácido',
    attackModifiers: [{ label: 'Corrosiva', damageDice: '1d6' }],
  },
  { name: 'Dançarina', kind: 'encanto', targets: ['arma'], description: 'Ataca sozinha' },
  {
    name: 'Defensora',
    kind: 'encanto',
    targets: ['arma'],
    description: 'Defesa +2',
    buffs: [{ type: 'defense', value: '2' }],
  },
  { name: 'Destruidora', kind: 'encanto', targets: ['arma'], description: 'Bônus contra construtos' },
  { name: 'Dilacerante', kind: 'encanto', targets: ['arma'], description: '+10 de dano em acertos críticos' },
  { name: 'Drenante', kind: 'encanto', targets: ['arma'], description: 'Crítico drena vítima' },
  {
    name: 'Elétrica',
    kind: 'encanto',
    targets: ['arma'],
    description: '+1d6 de dano de eletricidade',
    attackModifiers: [{ label: 'Elétrica', damageDice: '1d6' }],
  },
  {
    name: 'Energética',
    kind: 'encanto',
    targets: ['arma'],
    description: '+4 em testes de ataque',
    attackModifiers: [{ label: 'Energética', attackRoll: 4 }],
  },
  { name: 'Excruciante', kind: 'encanto', targets: ['arma'], description: 'Causa fraqueza' },
  {
    name: 'Flamejante',
    kind: 'encanto',
    targets: ['arma'],
    description: '+1d6 de dano de fogo',
    attackModifiers: [{ label: 'Flamejante', damageDice: '1d6' }],
  },
  {
    name: 'Formidável',
    kind: 'encanto',
    targets: ['arma'],
    description: 'Ataque e dano +2',
    attackModifiers: [{ label: 'Formidável', attackRoll: 2, damageBonus: 2 }],
  },
  { name: 'Lancinante*', kind: 'encanto', targets: ['arma'], description: 'Causa crítico terrível' },
  {
    name: 'Magnífica',
    kind: 'encanto',
    targets: ['arma'],
    description: '+4 em ataque e dano',
    attackModifiers: [{ label: 'Magnífica', attackRoll: 4, damageBonus: 4 }],
  },
  {
    name: 'Piedosa',
    kind: 'encanto',
    targets: ['arma'],
    description: 'Dano não letal (+1d8 de Impacto)',
    attackModifiers: [{ label: 'Piedosa', damageDice: '1d8' }],
  },
  { name: 'Profana', kind: 'encanto', targets: ['arma'], description: 'Bônus contra devotos do Bem' },
  { name: 'Sagrada', kind: 'encanto', targets: ['arma'], description: 'Bônus contra devotos do Mal' },
  { name: 'Sanguinária', kind: 'encanto', targets: ['arma'], description: 'Causa sangramento' },
  { name: 'Trovejante', kind: 'encanto', targets: ['arma'], description: 'Causa atordoamento' },
  {
    name: 'Tumular',
    kind: 'encanto',
    targets: ['arma'],
    description: '+1d8 de dano de trevas',
    attackModifiers: [{ label: 'Tumular', damageDice: '1d8' }],
  },
  { name: 'Veloz', kind: 'encanto', targets: ['arma'], description: 'Fornece ataque extra' },
  { name: 'Venenosa', kind: 'encanto', targets: ['arma'], description: 'Causa envenenamento' },
];
