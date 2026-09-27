import { describe, it, expect } from 'vitest';
import { applyMpReduction } from './mpReduction';

describe('applyMpReduction', () => {
  it('sem redução, o custo fica igual', () => {
    expect(applyMpReduction(6, 0)).toEqual({ final: 6, applied: 0, canReduceMore: true });
  });

  it('desconta os redutores do total', () => {
    expect(applyMpReduction(6, 2)).toEqual({ final: 4, applied: 2, canReduceMore: true });
  });

  it('nunca desce abaixo de 1 PM', () => {
    expect(applyMpReduction(3, 5)).toEqual({ final: 1, applied: 2, canReduceMore: false });
  });

  it('custo 0 continua 0 e não há o que reduzir', () => {
    expect(applyMpReduction(0, 2)).toEqual({ final: 0, applied: 0, canReduceMore: false });
  });

  it('ignora valores inválidos ou negativos', () => {
    expect(applyMpReduction(5, -3).final).toBe(5);
    expect(applyMpReduction(Number.NaN, 1).final).toBe(0);
  });
});
