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
  applicableRds,
  reduceDamage,
  computeDamageTaken,
  newDay,
  describeNewDay,
  endScene,
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

describe('applicableRds', () => {
  const rds = [
    { name: 'Geral', value: 5 },
    { name: 'fogo', value: 2 },
    { name: 'Frio e Ácido', value: 3 },
    { name: 'corte', value: 0 },
  ];

  it('liga Geral sempre e a RD do tipo escolhido (sem acento/caixa, como palavra)', () => {
    expect(applicableRds(rds, 'Fogo')).toEqual([true, true, false, false]);
    expect(applicableRds(rds, 'Ácido')).toEqual([true, false, true, false]);
  });

  it('sem tipo, só Geral', () => {
    expect(applicableRds(rds, undefined)).toEqual([true, false, false, false]);
  });

  it('nome vazio conta como Geral; valor zero nunca liga', () => {
    expect(applicableRds([{ name: '', value: 4 }, { name: 'Geral', value: 0 }], 'fogo')).toEqual([true, false]);
  });
});

describe('reduceDamage', () => {
  it('soma as RDs (regra da mesa) e nunca fica negativo', () => {
    expect(reduceDamage(12, [{ name: 'Geral', value: 5 }, { name: 'fogo', value: 2 }])).toEqual({ rdTotal: 7, net: 5 });
    expect(reduceDamage(3, [{ name: 'Geral', value: 5 }])).toEqual({ rdTotal: 5, net: 0 });
  });
});

describe('computeDamageTaken', () => {
  // hp 20/30, temp 5
  const c = char({ damageReductions: [{ name: 'Geral', value: 5 }, { name: 'fogo', value: 2 }] });

  it('aplica as RDs selecionadas, consome temporário primeiro e devolve o personagem', () => {
    const r = computeDamageTaken(c, { amount: 12, damageType: 'fogo', selected: [true, true] });
    expect(r).toMatchObject({ gross: 12, rdTotal: 7, net: 5, split: { fromTemp: 5, fromCurrent: 0 } });
    expect(r.character.temporaryHp).toBe(0);
    expect(r.character.hp.current).toBe(20);
  });

  it('ignoreRd zera a redução; RD não selecionada não conta', () => {
    expect(computeDamageTaken(c, { amount: 12, selected: [true, true], ignoreRd: true }).net).toBe(12);
    expect(computeDamageTaken(c, { amount: 12, selected: [true, false] }).net).toBe(7);
  });

  it('dano menor que a RD dá líquido 0 e não muda nada', () => {
    const r = computeDamageTaken(c, { amount: 4, selected: [true, false] });
    expect(r.net).toBe(0);
    expect(r.character.hp.current).toBe(20);
    expect(r.character.temporaryHp).toBe(5);
  });
});

describe('endScene', () => {
  it('desliga só buffs de cena (ou sem duração), zera temporários e não cura', () => {
    const c = char({
      hp: { max: 30, current: 9 },
      temporaryHp: 7,
      temporaryMp: 2,
      buffs: [
        { name: 'Cena', effects: [{ type: 'temp_hp', value: '4' }], mp: 0, active: true, duration: 'cena' },
        { name: 'Dia', effects: [], mp: 0, active: true, duration: 'dia' },
        { name: 'Perm', effects: [], mp: 0, active: true, duration: 'permanente' },
        { name: 'Sem duração', effects: [], mp: 0, active: true },
      ],
    });
    const d = endScene(c);
    expect(d.buffs.map((b) => b.active)).toEqual([false, true, true, false]);
    expect(d.temporaryHp).toBe(0);
    expect(d.temporaryMp).toBe(0);
    expect(d.hp.current).toBe(9);
  });
});

describe('newDay', () => {
  it('desliga todos os buffs, zera temporários (inclusive digitados) e cura PV/PM ao máximo efetivo', () => {
    const c = char({
      hp: { max: 30, current: 9 },
      mp: { max: 10, current: 1 },
      temporaryHp: 7,
      temporaryMp: 3,
      buffs: [{ name: 'A', effects: [{ type: 'temp_hp', value: '4' }], mp: 0, active: true }],
      abilities: [
        {
          name: 'Vigor', source: '', type: '', mpCost: 0, description: '',
          alwaysActive: true, buffs: [{ type: 'max_hp', value: '10' }],
        },
      ],
    });
    const d = newDay(c);
    expect(d.buffs[0].active).toBe(false);
    expect(d.temporaryHp).toBe(0);
    expect(d.temporaryMp).toBe(0);
    expect(d.hp.current).toBe(40);
    expect(d.mp.current).toBe(10);
  });

  it('describeNewDay resume o que vai acontecer', () => {
    const c = char({
      hp: { max: 30, current: 9 },
      mp: { max: 10, current: 1 },
      temporaryHp: 7,
      temporaryMp: 0,
      buffs: [
        { name: 'A', effects: [], mp: 0, active: true },
        { name: 'B', effects: [], mp: 0, active: false },
      ],
    });
    expect(describeNewDay(c)).toEqual({ buffsOff: 1, tempHp: 7, tempMp: 0, healHp: 21, healMp: 9 });
  });

  it('poupa buffs marcados como permanentes', () => {
    const c = char({
      buffs: [
        { name: 'Cena', effects: [], mp: 0, active: true, duration: 'cena' },
        { name: 'Dia', effects: [], mp: 0, active: true, duration: 'dia' },
        { name: 'Perm', effects: [], mp: 0, active: true, duration: 'permanente' },
        { name: 'Sem duração', effects: [], mp: 0, active: true },
      ],
    });
    expect(newDay(c).buffs.map((b) => b.active)).toEqual([false, false, true, false]);
  });

  it('renova os usos por dia dos poderes', () => {
    const c = char({
      abilities: [
        { name: 'Golpe', source: '', type: '', mpCost: 0, description: '', usesPerDay: 3, usesLeft: 0 },
        { name: 'Sem limite', source: '', type: '', mpCost: 0, description: '' },
      ],
    });
    const d = newDay(c);
    expect(d.abilities[0].usesLeft).toBe(3);
    expect(d.abilities[1].usesLeft).toBeUndefined();
  });
});
