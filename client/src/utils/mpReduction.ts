/** Menor custo possível depois dos redutores (T20: nenhuma redução leva o custo abaixo de 1 PM). */
export const MIN_MP_COST_AFTER_REDUCTION = 1;

export interface MpReductionResult {
  /** Custo que sai do PM do personagem. */
  final: number;
  /** Quanto os redutores de fato tiraram (pode ser menor que o pedido, por causa do piso). */
  applied: number;
  /** Ainda dá para reduzir mais um? */
  canReduceMore: boolean;
}

/**
 * Aplica os redutores de custo que o jogador marcou na hora de conjurar/atacar.
 * Custo 0 continua 0 (nada a reduzir); qualquer custo positivo tem piso de 1 PM.
 */
export function applyMpReduction(total: number, reduction: number): MpReductionResult {
  const base = Math.max(0, Math.floor(Number(total) || 0));
  const asked = Math.max(0, Math.floor(Number(reduction) || 0));
  const floor = Math.min(base, MIN_MP_COST_AFTER_REDUCTION);
  const final = Math.max(floor, base - asked);
  return { final, applied: base - final, canReduceMore: final > floor };
}
