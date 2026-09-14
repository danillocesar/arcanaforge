/**
 * Quantos itens uma lista longa mostra por vez. 40 enche a viewport com folga em
 * qualquer tela, e é barato o suficiente pra refazer a cada tecla digitada na busca.
 */
export const DEFAULT_PAGE_SIZE = 40;

/** Itens visíveis ao abrir a lista, ou logo depois de mudar o filtro. */
export function initialCount(total: number, pageSize = DEFAULT_PAGE_SIZE): number {
  return Math.min(total, pageSize);
}

/**
 * Próxima fatia quando a sentinela do fim da lista entra em tela. Nunca passa do
 * total nem encolhe — o observer pode disparar várias vezes seguidas sem estragar
 * a contagem, e uma contagem herdada de um filtro anterior mais longo não some.
 */
export function grownCount(
  current: number,
  total: number,
  pageSize = DEFAULT_PAGE_SIZE,
): number {
  if (current >= total) return current;
  return Math.min(total, current + pageSize);
}
