import { describe, it, expect } from 'vitest';
import type { BuffEffect } from '../types/character';
import {
  normalizeEffectType,
  filterFixedBonusEffects,
  effectTag,
  summarizeEffects,
  formatEffectFormula,
} from './buffEffects';

describe('formatEffectFormula', () => {
  it('mostra fixo e variáveis', () => {
    expect(formatEffectFormula({ type: 'skill', value: '2', attributeBonus: 'int' })).toBe('+2 +Int');
    expect(formatEffectFormula({ type: 'defense', value: '', levelBonus: 'half' })).toBe('+½nível');
    expect(formatEffectFormula({ type: 'attribute', attributeId: 'str', value: '-1', attributeBonus: 'dex', levelBonus: 'full' }))
      .toBe('-1 +Des +nível');
  });

  it('sem fixo nem variável devolve null', () => {
    expect(formatEffectFormula({ type: 'defense', value: '' })).toBeNull();
    expect(formatEffectFormula({ type: 'defense', value: '0' })).toBeNull();
  });
});

describe('summarizeEffects com variáveis', () => {
  it('usa a fórmula quando o efeito tem variável', () => {
    expect(summarizeEffects([{ type: 'skill', skillId: 'misticismo', value: '', attributeBonus: 'int' }])).toBe('Misticismo +Int');
  });
});

describe('normalizeEffectType', () => {
  it('passes through current effect types unchanged', () => {
    expect(normalizeEffectType('max_hp')).toBe('max_hp');
    expect(normalizeEffectType('temp_hp')).toBe('temp_hp');
    expect(normalizeEffectType('attribute')).toBe('attribute');
  });

  it('maps the legacy `hp`/`mp` types (pre-rename saved data) to temp_hp/temp_mp', () => {
    expect(normalizeEffectType('hp' as unknown as BuffEffect['type'])).toBe('temp_hp');
    expect(normalizeEffectType('mp' as unknown as BuffEffect['type'])).toBe('temp_mp');
  });
});

describe('filterFixedBonusEffects', () => {
  it('strips temp_hp/temp_mp effects', () => {
    const effects: BuffEffect[] = [
      { type: 'temp_hp', value: '10' },
      { type: 'temp_mp', value: '5' },
      { type: 'defense', value: '2' },
    ];
    expect(filterFixedBonusEffects(effects)).toEqual([{ type: 'defense', value: '2' }]);
  });

  it('keeps max_hp/max_mp effects — they are meant to be a fixed bonus', () => {
    const effects: BuffEffect[] = [
      { type: 'max_hp', value: '5' },
      { type: 'max_mp', value: '3' },
    ];
    expect(filterFixedBonusEffects(effects)).toEqual(effects);
  });

  it('strips the legacy `hp`/`mp` types the same as temp_hp/temp_mp', () => {
    const effects = [{ type: 'hp', value: '10' } as unknown as BuffEffect];
    expect(filterFixedBonusEffects(effects)).toEqual([]);
  });
});

describe('effectTag', () => {
  it('tags max_hp/max_mp distinctly from temp_hp/temp_mp', () => {
    expect(effectTag({ type: 'temp_hp', value: '10' })).toBe('PV');
    expect(effectTag({ type: 'temp_mp', value: '10' })).toBe('PM');
    expect(effectTag({ type: 'max_hp', value: '5' })).toBe('PV Máx');
    expect(effectTag({ type: 'max_mp', value: '5' })).toBe('PM Máx');
  });
});

describe('summarizeEffects', () => {
  it('summarizes a single max_hp effect using its tag', () => {
    expect(summarizeEffects([{ type: 'max_hp', value: '5' }])).toBe('PV Máx +5');
  });
});
