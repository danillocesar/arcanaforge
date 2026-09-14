import type { BuffEffect } from '../types/character';

export interface OfficialCondition {
  name: string;
  description: string;
  /** Só preenchido quando o efeito é um bônus/penalidade numérica simples — condições
   * puramente procedurais, condicionais ou com valor variável (ex.: "não pode agir",
   * dano em dado, penalidade por nível acumulado) ficam só com a descrição. */
  effects: BuffEffect[];
}

/** Catálogo de condições oficiais do Tormenta 20 (tsrd.fandom.com/pt-br/wiki/Condições). */
export const OFFICIAL_CONDITIONS: OfficialCondition[] = [
  {
    name: 'Abalado',
    description: 'Com medo de algo. Sofre –2 em jogadas de ataque e em testes de perícia, habilidade e resistência. Se ficar abalado de novo, passa a apavorado.',
    effects: [{ type: 'attack_roll', value: '-2' }],
  },
  {
    name: 'Agarrado',
    description: 'Preso em combate corpo a corpo. Sofre –2 nas jogadas de ataque, só pode atacar com armas leves, fica desprevenido (–4 na Defesa) e não pode se mover.',
    effects: [
      { type: 'attack_roll', value: '-2' },
      { type: 'defense', value: '-4' },
    ],
  },
  {
    name: 'Apavorado',
    description: 'Com muito medo de algo, tenta fugir da fonte do medo da melhor forma possível. Se não conseguir fugir, pode lutar, mas com as penalidades de Abalado.',
    effects: [],
  },
  {
    name: 'Atordoado',
    description: 'Incapaz de agir e desprevenido (–4 na Defesa).',
    effects: [{ type: 'defense', value: '-4' }],
  },
  {
    name: 'Caído',
    description: 'Deitado no chão. Sofre –4 nas jogadas de ataque corpo a corpo e move-se com metade do deslocamento. Oponentes corpo a corpo ganham +4 para acertá-lo, mas sofrem –4 em ataques à distância contra ele.',
    effects: [{ type: 'attack_roll', value: '-4' }],
  },
  {
    name: 'Cego',
    description: 'Incapaz de enxergar. Tem 50% de chance de errar qualquer ataque, fica desprevenido (–8 na Defesa no total), move-se com metade do deslocamento e sofre –4 em testes de perícia baseados em Força ou Destreza.',
    effects: [{ type: 'defense', value: '-8' }],
  },
  {
    name: 'Confuso',
    description: 'Discernimento afetado por um efeito. A cada turno, role 1d6: 1 foge do conjurador; 2-3 balbucia incoerentemente e não faz nada; 4-5 ataca a criatura mais próxima; 6 age normalmente.',
    effects: [],
  },
  {
    name: 'Dano de Habilidade',
    description: 'Perdeu temporariamente 1 ou mais pontos em um valor de habilidade. Os pontos voltam à razão de 1 por dia. Força ou Destreza chegando a 0 paralisa; Inteligência, Sabedoria ou Carisma chegando a 0 deixa inconsciente; Constituição chegando a 0 mata.',
    effects: [],
  },
  {
    name: 'Desprevenido',
    description: 'Com a guarda baixa. Sofre –4 na Defesa.',
    effects: [{ type: 'defense', value: '-4' }],
  },
  {
    name: 'Enjoado',
    description: 'Passando mal por qualquer motivo. Só pode realizar uma ação padrão ou de movimento (não as duas) por rodada.',
    effects: [],
  },
  {
    name: 'Enredado',
    description: 'Movimento prejudicado. Sofre –2 nas jogadas de ataque, –4 em Destreza, move-se com metade do deslocamento e não pode correr ou investir.',
    effects: [
      { type: 'attack_roll', value: '-2' },
      { type: 'attribute', value: '-4', attributeId: 'dex' },
    ],
  },
  {
    name: 'Exausto',
    description: 'Muito cansado. Sofre –6 em Força e Destreza, move-se com metade do deslocamento e não pode correr ou investir. Se ficar fatigado ou exausto de novo, cai inconsciente.',
    effects: [
      { type: 'attribute', value: '-6', attributeId: 'str' },
      { type: 'attribute', value: '-6', attributeId: 'dex' },
    ],
  },
  {
    name: 'Fascinado',
    description: 'Atenção presa em algo — fica parado observando e sofre –4 em Percepção. Qualquer ameaça óbvia anula o efeito, assim como uma ação padrão para sacudir o personagem.',
    effects: [{ type: 'skill', value: '-4', skillId: 'percepacao' }],
  },
  {
    name: 'Fatigado',
    description: 'Cansado. Sofre –2 em Força e Destreza e não pode correr ou investir. Se ficar fatigado de novo, fica exausto.',
    effects: [
      { type: 'attribute', value: '-2', attributeId: 'str' },
      { type: 'attribute', value: '-2', attributeId: 'dex' },
    ],
  },
  {
    name: 'Inconsciente',
    description: 'Indefeso e incapaz de agir.',
    effects: [],
  },
  {
    name: 'Incorpóreo',
    description: 'Sem corpo físico. Imune a ataques não mágicos; ataques mágicos têm 50% de chance de falhar contra ele. Atravessa objetos sólidos e seus ataques ignoram bônus de Defesa por armadura, escudo e armadura natural.',
    effects: [],
  },
  {
    name: 'Indefeso',
    description: 'Amarrado, inconsciente ou paralisado. Defesa igual a 5 + modificador de tamanho, e pode sofrer golpe de misericórdia.',
    effects: [],
  },
  {
    name: 'Invisível',
    description: 'Não pode ser visto. Tem camuflagem total, e todas as criaturas ficam desprevenidas contra seus ataques.',
    effects: [],
  },
  {
    name: 'Lento',
    description: 'Só pode realizar uma ação padrão ou de movimento (não as duas) por rodada. Sofre –1 nas jogadas de ataque, na Defesa e em Reflexos, e move-se com metade do deslocamento.',
    effects: [
      { type: 'attack_roll', value: '-1' },
      { type: 'defense', value: '-1' },
      { type: 'skill', value: '-1', skillId: 'reflexos' },
    ],
  },
  {
    name: 'Níveis Negativos',
    description: 'Cada nível negativo impõe –1 em jogadas de ataque e em testes de perícia, habilidade e resistência, além de remover a magia mais alta conhecida (ou PM equivalentes). Personagem que chega a nível efetivo 0 morre, desmaia ou vira plebeu.',
    effects: [],
  },
  {
    name: 'Ofuscado',
    description: 'Visão prejudicada. Sofre –1 nas jogadas de ataque.',
    effects: [{ type: 'attack_roll', value: '-1' }],
  },
  {
    name: 'Paralisado',
    description: 'Indefeso e incapaz de se mover. Força e Destreza efetivos tornam-se 0, mas ainda pode realizar ações puramente mentais. Defesa igual a 5 + modificador de tamanho.',
    effects: [],
  },
  {
    name: 'Pasmo',
    description: 'Incapaz de agir, mas ainda pode se defender normalmente.',
    effects: [],
  },
  {
    name: 'Sangrando',
    description: 'Ferimento aberto. No início de cada turno, faz um teste de Constituição (CD 15): se passar, estabiliza; se falhar, sofre 1d4 de dano e continua sangrando.',
    effects: [],
  },
  {
    name: 'Surdo',
    description: 'Incapaz de ouvir. Sofre –4 em Iniciativa e Percepção, e precisa de um teste de Vontade (CD 10 + nível da magia) para lançar qualquer magia.',
    effects: [
      { type: 'skill', value: '-4', skillId: 'percepacao' },
      { type: 'skill', value: '-4', skillId: 'iniciativa' },
    ],
  },
  {
    name: 'Surpreendido',
    description: 'Não está ciente de seus inimigos. Não pode agir e fica desprevenido (–4 na Defesa) durante a primeira rodada de combate.',
    effects: [{ type: 'defense', value: '-4' }],
  },
];
