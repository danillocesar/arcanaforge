import { describe, it, expect } from 'vitest';
import type { Character, Buff, Ability, InventoryItem } from '../types/character';
import {
  createEmptyCharacter,
  getTotalLevel,
  getEffectiveAttribute,
  getActiveBuffs,
  calcTotalDefense,
  calcTotalSkill,
  toggleBuffState,
  normalizeBuffs,
  normalizeDamageReduction,
  isWeaponAttack,
  weaponToAttack,
} from './calculations';

function baseCharacter(overrides: Partial<Character> = {}): Character {
  return { ...createEmptyCharacter('Teste'), ...overrides };
}

function activeBuff(overrides: Partial<Buff> = {}): Buff {
  return { name: 'Buff', effects: [], mp: 0, active: true, ...overrides };
}

describe('getTotalLevel', () => {
  it('sums levels across multiple classes', () => {
    const character = baseCharacter({
      classes: [{ name: 'Guerreiro', level: 11 }, { name: 'Bucaneiro', level: 4 }],
    });
    expect(getTotalLevel(character)).toBe(15);
  });

  it('falls back to character.level when there are no classes', () => {
    const character = baseCharacter({ classes: [], level: 7 });
    expect(getTotalLevel(character)).toBe(7);
  });

  it('defaults to 1 when neither classes nor level are set', () => {
    const character = baseCharacter({ classes: [] });
    expect(getTotalLevel(character)).toBe(1);
  });
});

describe('getEffectiveAttribute', () => {
  it('returns the base value with no active buffs', () => {
    const character = baseCharacter({ attributes: { str: 3, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    expect(getEffectiveAttribute(character, 'str')).toBe(3);
  });

  it('adds an active buff effect matching the attribute', () => {
    const character = baseCharacter({
      attributes: { str: 3, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      buffs: [activeBuff({ effects: [{ type: 'attribute', attributeId: 'str', value: '2' }] })],
    });
    expect(getEffectiveAttribute(character, 'str')).toBe(5);
  });

  it('ignores a buff effect for a different attribute', () => {
    const character = baseCharacter({
      attributes: { str: 3, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      buffs: [activeBuff({ effects: [{ type: 'attribute', attributeId: 'dex', value: '2' }] })],
    });
    expect(getEffectiveAttribute(character, 'str')).toBe(3);
  });

  it('ignores an inactive buff', () => {
    const character = baseCharacter({
      attributes: { str: 3, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      buffs: [activeBuff({ active: false, effects: [{ type: 'attribute', attributeId: 'str', value: '2' }] })],
    });
    expect(getEffectiveAttribute(character, 'str')).toBe(3);
  });
});

describe('getActiveBuffs', () => {
  it('includes manually active buffs and excludes inactive ones', () => {
    const on = activeBuff({ name: 'Ligado' });
    const off = activeBuff({ name: 'Desligado', active: false });
    const character = baseCharacter({ buffs: [on, off] });
    expect(getActiveBuffs(character).map((b) => b.name)).toEqual(['Ligado']);
  });

  it('synthesizes an always-active buff from an ability marked alwaysActive', () => {
    const ability: Ability = {
      name: 'Aura Sagrada',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      alwaysActive: true,
      buffs: [{ type: 'defense', value: '2' }],
    };
    const character = baseCharacter({ abilities: [ability] });
    const active = getActiveBuffs(character);
    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({ name: 'Aura Sagrada', source: 'Poder' });
    expect(active[0].effects).toEqual([{ type: 'defense', value: '2' }]);
  });

  it('synthesizes an always-active buff from an item marked alwaysActive', () => {
    const item: InventoryItem = {
      name: 'Manopla de Força',
      quantity: 1,
      weight: 0,
      alwaysActive: true,
      buffs: [{ type: 'attribute', attributeId: 'str', value: '4' }],
    };
    const character = baseCharacter({ inventory: [item] });
    const active = getActiveBuffs(character);
    expect(active).toHaveLength(1);
    expect(active[0].source).toBe('Item');
  });

  it('never synthesizes a buff from hp/mp-only effects, even when alwaysActive', () => {
    // Regression: hp/mp are one-shot mutations (toggleBuffState/applyBuffToCharacter),
    // not passive bonuses — an alwaysActive ability with only an hp/mp effect must
    // not appear as a synthetic Bônus Fixo.
    const ability: Ability = {
      name: 'Regeneração',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      alwaysActive: true,
      buffs: [{ type: 'hp', value: '10' }],
    };
    const character = baseCharacter({ abilities: [ability] });
    expect(getActiveBuffs(character)).toHaveLength(0);
  });
});

describe('calcTotalDefense', () => {
  it('sums base, Destreza, protection items and defense-type buffs', () => {
    const character = baseCharacter({
      attributes: { str: 0, dex: 3, con: 0, int: 0, wis: 0, cha: 0 },
      defense: { base: 10, items: [{ name: 'Armadura', value: 5, penalty: 0 }] },
      buffs: [activeBuff({ effects: [{ type: 'defense', value: '2' }] })],
    });
    expect(calcTotalDefense(character)).toBe(10 + 3 + 5 + 2);
  });
});

describe('calcTotalSkill', () => {
  it('combines half-level, attribute, training, misc, armor penalty and skill buffs', () => {
    // Acrobacia is Destreza-based and has armorPenalty:true in the official skill
    // config — needed to exercise the armor-penalty branch of the formula.
    const character = baseCharacter({
      classes: [{ name: 'Guerreiro', level: 11 }],
      attributes: { str: 0, dex: 6, con: 0, int: 0, wis: 0, cha: 0 },
      defense: { base: 10, items: [{ name: 'Armadura', value: 0, penalty: -2 }] },
      skills: { ...baseCharacter().skills, acrobacia: { trained: true, misc: 1 } },
      buffs: [activeBuff({ effects: [{ type: 'skill', skillId: 'acrobacia', value: '3' }] })],
    });
    const halfLevel = Math.floor(11 / 2);
    expect(calcTotalSkill(character, 'acrobacia')).toBe(halfLevel + 6 + 2 + 1 - 2 + 3);
  });

  it('returns 0 for an unknown skill id', () => {
    const character = baseCharacter();
    expect(calcTotalSkill(character, 'nao-existe')).toBe(0);
  });
});

describe('toggleBuffState', () => {
  it('deducts MP and adds temporary HP when activating a buff with hp/mp cost', () => {
    const buff: Buff = {
      name: 'Cura pelas mãos',
      effects: [{ type: 'hp', value: '10' }],
      mp: 2,
      active: false,
    };
    const character = baseCharacter({ mp: { max: 10, current: 10 }, buffs: [buff], temporaryHp: 0 });
    const next = toggleBuffState(character, 0);
    expect(next.mp.current).toBe(8);
    expect(next.temporaryHp).toBe(10);
    expect(next.buffs[0].active).toBe(true);
  });

  it('reverts temporary HP when deactivating (MP is not refunded for hp/mp buffs already spent)', () => {
    const buff: Buff = {
      name: 'Cura pelas mãos',
      effects: [{ type: 'hp', value: '10' }],
      mp: 2,
      active: true,
    };
    const character = baseCharacter({ mp: { max: 10, current: 8 }, buffs: [buff], temporaryHp: 10 });
    const next = toggleBuffState(character, 0);
    expect(next.temporaryHp).toBe(0);
    expect(next.buffs[0].active).toBe(false);
  });
});

describe('normalizeBuffs', () => {
  it('passes through buffs already in the effects[] format unchanged', () => {
    const buff: Buff = { name: 'Novo', effects: [{ type: 'defense', value: '1' }], mp: 0, active: true };
    expect(normalizeBuffs([buff])).toEqual([buff]);
  });

  it('converts a legacy flat buff into the effects[] format', () => {
    const legacy = { name: 'Antigo', type: 'attribute', attributeId: 'str', value: '2', mp: 1, active: true };
    const [result] = normalizeBuffs([legacy]);
    expect(result.name).toBe('Antigo');
    expect(result.effects).toEqual([{ type: 'attribute', attributeId: 'str', skillId: undefined, value: '2' }]);
  });
});

describe('normalizeDamageReduction', () => {
  it('returns a numeric value unchanged', () => {
    expect(normalizeDamageReduction(5)).toBe(5);
  });

  it('extracts the first number from a legacy free-text value', () => {
    expect(normalizeDamageReduction('5 (fogo)')).toBe(5);
  });

  it('returns 0 when no number is present', () => {
    expect(normalizeDamageReduction('nenhuma')).toBe(0);
  });
});

describe('isWeaponAttack / weaponToAttack', () => {
  it('is true only for weapon-category items with damage registered', () => {
    const withDamage: InventoryItem = { name: 'Katana', quantity: 1, weight: 1, category: 'arma', damage: '1d10' };
    const withoutDamage: InventoryItem = { name: 'Katana', quantity: 1, weight: 1, category: 'arma', damage: '' };
    const notAWeapon: InventoryItem = { name: 'Poção', quantity: 1, weight: 0, category: 'consumivel', damage: '1d10' };
    expect(isWeaponAttack(withDamage)).toBe(true);
    expect(isWeaponAttack(withoutDamage)).toBe(false);
    expect(isWeaponAttack(notAWeapon)).toBe(false);
  });

  it('adapts a weapon item into an Attack shape', () => {
    const item: InventoryItem = {
      name: 'Katana',
      quantity: 1,
      weight: 1,
      category: 'arma',
      damage: '4d10+11',
      critical: '19/x2',
      rangeType: 'melee',
      attributeDamageBonus: 'for',
    };
    expect(weaponToAttack(item)).toMatchObject({
      name: 'Katana',
      damage: '4d10+11',
      critical: '19/x2',
      rangeType: 'melee',
      attributeDamageBonus: 'for',
      extraBonuses: [],
      extraDamage: [],
    });
  });
});
