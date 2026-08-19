import { describe, it, expect } from 'vitest';
import { baseMpCostForLevel } from './constants';

describe('baseMpCostForLevel', () => {
  it('returns the official T20 base PM cost per spell circle', () => {
    expect(baseMpCostForLevel(1)).toBe(1);
    expect(baseMpCostForLevel(2)).toBe(3);
    expect(baseMpCostForLevel(3)).toBe(6);
    expect(baseMpCostForLevel(4)).toBe(10);
    expect(baseMpCostForLevel(5)).toBe(15);
  });

  it('falls back to 1 for an unmapped circle', () => {
    expect(baseMpCostForLevel(6)).toBe(1);
  });
});
