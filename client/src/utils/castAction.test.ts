import { describe, it, expect } from 'vitest';
import type { BuffEffect } from '../types/character';
import { composeCast, formatResistanceLine } from './castAction';

const dano = (value: string): BuffEffect => ({ type: 'extra_damage', value });

describe('composeCast', () => {
  it('returns just the base cost and base buffs when nothing is selected', () => {
    const result = composeCast(
      { mpCost: 3, buffs: [dano('1d8')], enhancements: [{ description: '+1d6', mpCost: 1 }] },
      [0],
    );
    expect(result.totalCost).toBe(3);
    expect(result.effects).toEqual([dano('1d8')]);
  });

  it('charges an enhancement once per application', () => {
    const result = composeCast(
      { mpCost: 3, enhancements: [{ description: '+1d6 de dano', mpCost: 1 }] },
      [3],
    );
    expect(result.totalCost).toBe(3 + 3 * 1);
  });

  it('replicates the enhancement buffs once per application', () => {
    // T20 "+1 PM: aumenta o dano em +1d6" applies repeatedly — three stacks must
    // produce three separate effects, not one capped effect.
    const result = composeCast(
      { mpCost: 3, enhancements: [{ description: '+1d6', mpCost: 1, buffs: [dano('1d6')] }] },
      [3],
    );
    expect(result.effects).toEqual([dano('1d6'), dano('1d6'), dano('1d6')]);
  });

  it('sums several enhancements applied different numbers of times', () => {
    const result = composeCast(
      {
        mpCost: 1,
        enhancements: [
          { description: '+1d6', mpCost: 1, buffs: [dano('1d6')] },
          { description: '+2 alcance', mpCost: 2, buffs: [dano('2')] },
        ],
      },
      [2, 1],
    );
    expect(result.totalCost).toBe(1 + 2 * 1 + 1 * 2);
    expect(result.effects).toEqual([dano('1d6'), dano('1d6'), dano('2')]);
  });

  it('ignores negative or missing counts instead of subtracting cost', () => {
    const result = composeCast(
      { mpCost: 5, enhancements: [{ description: 'a', mpCost: 2 }, { description: 'b', mpCost: 2 }] },
      [-3],
    );
    expect(result.totalCost).toBe(5);
  });

  it('keeps base buffs ahead of enhancement buffs', () => {
    const result = composeCast(
      { mpCost: 0, buffs: [dano('base')], enhancements: [{ description: 'e', mpCost: 0, buffs: [dano('extra')] }] },
      [1],
    );
    expect(result.effects.map((e) => e.value)).toEqual(['base', 'extra']);
  });
});

describe('formatResistanceLine', () => {
  it('joins the resistance type with the spell DC', () => {
    expect(formatResistanceLine('Vontade anula', 18)).toBe('Vontade anula · CD 18');
  });

  it('shows the resistance alone when there is no DC', () => {
    expect(formatResistanceLine('Fortitude parcial', undefined)).toBe('Fortitude parcial');
  });

  it('returns null when the spell has no resistance', () => {
    expect(formatResistanceLine('', 18)).toBeNull();
    expect(formatResistanceLine(undefined, 18)).toBeNull();
  });

  it('treats a dash-only resistance as no resistance (catalog writes "—")', () => {
    expect(formatResistanceLine('—', 18)).toBeNull();
    expect(formatResistanceLine('-', 18)).toBeNull();
  });

  it('treats the literal "nenhuma" of the catalog as no resistance', () => {
    // data/spells.ts spells out "nenhuma" on one entry — showing "nenhuma · CD 18"
    // would wrongly imply the target gets a save.
    expect(formatResistanceLine('nenhuma', 18)).toBeNull();
  });

  it('keeps "veja texto" — it points the player at a real rule', () => {
    expect(formatResistanceLine('veja texto', 18)).toBe('veja texto · CD 18');
  });
});
