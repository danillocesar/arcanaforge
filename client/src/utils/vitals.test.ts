import { describe, it, expect } from 'vitest';
import type { Character } from '../types/character';
import { createEmptyCharacter } from './calculations';
import {
  damageVital,
  healVital,
  clampVital,
  getVital,
  applyDamage,
  splitDamage,
  applyHeal,
  normalizeVitals,
} from './vitals';

function char(overrides: Partial<Character> = {}): Character {
  return {
    ...createEmptyCharacter('T'),
    hp: { max: 30, current: 20 },
    mp: { max: 10, current: 4 },
    temporaryHp: 5,
    ...overrides,
  };
}

describe('damageVital', () => {
  it('consome o temporário antes do atual', () => {
    const { state, split } = damageVital({ current: 20, max: 30, temp: 5 }, 3);
    expect(state).toEqual({ current: 20, max: 30, temp: 2 });
    expect(split).toEqual({ fromTemp: 3, fromCurrent: 0 });
  });

  it('o excedente sai do atual, nunca abaixo de zero', () => {
    const { state, split } = damageVital({ current: 20, max: 30, temp: 5 }, 40);
    expect(state).toEqual({ current: 0, max: 30, temp: 0 });
    expect(split).toEqual({ fromTemp: 5, fromCurrent: 20 });
  });

  it('dano zero, negativo ou NaN não muda nada', () => {
    const v = { current: 20, max: 30, temp: 5 };
    expect(damageVital(v, 0).state).toEqual(v);
    expect(damageVital(v, -4).state).toEqual(v);
    expect(damageVital(v, Number.NaN).state).toEqual(v);
  });
});

describe('healVital', () => {
  it('sobe o atual até o máximo e não toca o temporário', () => {
    expect(healVital({ current: 20, max: 30, temp: 5 }, 100)).toEqual({ current: 30, max: 30, temp: 5 });
    expect(healVital({ current: 20, max: 30, temp: 5 }, 3)).toEqual({ current: 23, max: 30, temp: 5 });
  });

  it('aceita Infinity como "curar tudo"', () => {
    expect(healVital({ current: 1, max: 30, temp: 0 }, Infinity).current).toBe(30);
  });
});

describe('clampVital / normalizeVitals', () => {
  it('clampa atual acima do máximo (o excesso era o temporário do modelo antigo) e temp negativo', () => {
    expect(clampVital({ current: 38, max: 30, temp: -2 })).toEqual({ current: 30, max: 30, temp: 0 });
  });

  it('normalizeVitals devolve a mesma referência quando nada muda', () => {
    const c = char();
    expect(normalizeVitals(c)).toBe(c);
  });

  it('normalizeVitals clampa PV e PM contra o máximo EFETIVO (bônus fixo conta)', () => {
    const c = char({
      hp: { max: 30, current: 45 },
      abilities: [
        {
          name: 'Vigor', source: '', type: '', mpCost: 0, description: '',
          alwaysActive: true, buffs: [{ type: 'max_hp', value: '10' }],
        },
      ],
    });
    expect(normalizeVitals(c).hp.current).toBe(40);
  });
});

describe('wrappers de Character', () => {
  it('getVital usa o máximo efetivo e o temporário do pool certo', () => {
    expect(getVital(char({ temporaryMp: 2 }), 'mp')).toEqual({ current: 4, max: 10, temp: 2 });
  });

  it('applyDamage / splitDamage / applyHeal escrevem no pool certo e só nele', () => {
    const c = char();
    const hit = applyDamage(c, 7, 'hp');
    expect(hit.temporaryHp).toBe(0);
    expect(hit.hp.current).toBe(18);
    expect(hit.mp).toEqual(c.mp);
    expect(splitDamage(c, 7, 'hp')).toEqual({ fromTemp: 5, fromCurrent: 2 });
    expect(applyHeal(hit, Infinity, 'hp').hp.current).toBe(30);
    expect(applyHeal(hit, Infinity, 'hp').temporaryHp).toBe(0);
  });
});
