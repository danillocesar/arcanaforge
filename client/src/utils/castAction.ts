import type { BuffEffect } from '../types/character';

export interface CastEnhancement {
  description: string;
  mpCost: number;
  buffs?: BuffEffect[];
}

/** Parte de uma magia/poder que a conjuração consome — `CastActionSpec` a satisfaz. */
export interface CastSource {
  mpCost: number;
  buffs?: BuffEffect[];
  enhancements?: CastEnhancement[];
}

export interface CastComposition {
  totalCost: number;
  effects: BuffEffect[];
}

/** Quantidade de aplicações de um aprimoramento: inteiro ≥ 0, nunca NaN. */
function applications(raw: number | undefined): number {
  const n = Math.floor(Number(raw) || 0);
  return n > 0 ? n : 0;
}

/**
 * Custo total e efeitos resultantes de conjurar, dado quantas vezes cada
 * aprimoramento foi aplicado. Aprimoramento do T20 do tipo "+1 PM: +1d6 de dano"
 * vale repetidamente, então tanto o custo quanto os efeitos multiplicam pela
 * contagem — o catálogo não distingue repetível de único, a contagem fica com o
 * jogador (que é o comportamento de mesa).
 */
export function composeCast(source: CastSource, counts: number[]): CastComposition {
  const enhancements = source.enhancements ?? [];

  let totalCost = Number(source.mpCost) || 0;
  const effects: BuffEffect[] = [...(source.buffs ?? [])];

  enhancements.forEach((enh, i) => {
    const times = applications(counts[i]);
    if (times === 0) return;
    totalCost += (Number(enh.mpCost) || 0) * times;
    for (let n = 0; n < times; n++) effects.push(...(enh.buffs ?? []));
  });

  return { totalCost, effects };
}

/** Valores que o catálogo usa pra dizer "não tem teste de resistência". */
const NO_RESISTANCE = new Set(['', '-', '—', '–', 'nenhuma', 'nenhum']);

/**
 * Linha de resistência pra exibir na ficha de quem recebeu o buff — "Vontade anula · CD 18".
 * A rolagem em si continua no dado físico: o app não tem motor de dados.
 */
export function formatResistanceLine(
  resistance: string | undefined,
  dc: number | undefined,
): string | null {
  const text = (resistance ?? '').trim();
  if (NO_RESISTANCE.has(text.toLowerCase())) return null;
  return dc != null ? `${text} · CD ${dc}` : text;
}
