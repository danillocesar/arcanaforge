import { describe, it, expect } from 'vitest';
import type { Attack, Character, Ability } from '../types/character';
import { createEmptyCharacter, calcTotalSkill, calcAttackRoll, buildDamageSummary } from './calculations';
import { buildAttackChecklist, composeAttack } from './attackCompose';

function baseCharacter(overrides: Partial<Character> = {}): Character {
  return { ...createEmptyCharacter('Teste'), ...overrides };
}

function baseAttack(overrides: Partial<Attack> = {}): Attack {
  return {
    name: 'Katana',
    damage: '4d10+11',
    critical: '19/x2',
    type: 'Corte',
    rangeType: 'melee',
    mpCost: 0,
    attributeDamageBonus: 'str',
    extraBonuses: [],
    extraDamage: [],
    ...overrides,
  };
}

describe('buildAttackChecklist', () => {
  it("pre-checks the attack's own extraBonuses/extraDamage", () => {
    const atk = baseAttack({
      extraBonuses: [{ name: 'Ataque Poderoso', value: -2, mp: 0 }],
      extraDamage: [{ name: 'Ataque Poderoso', value: '5', mp: 0 }],
    });
    const character = baseCharacter();
    const items = buildAttackChecklist(character, atk);
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.defaultChecked)).toBe(true);
    expect(items.every((i) => i.source === '')).toBe(true);
  });

  it('merges every attackModifiers line of the same ability into a single unchecked item', () => {
    const ability: Ability = {
      name: 'Ataque Poderoso',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      attackModifiers: [
        { label: 'Acerto', attackRoll: -2 },
        { label: 'Dano', damageBonus: 5 },
      ],
    };
    const character = baseCharacter({ abilities: [ability] });
    const items = buildAttackChecklist(character, baseAttack());
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      label: 'Ataque Poderoso',
      source: 'Poder',
      attackRoll: -2,
      damageBonus: 5,
      defaultChecked: false,
    });
  });

  it('only applies an attribute-based modifier line to the roll/damage it actually matches', () => {
    // Manopla de Força: +6 Força, resolved per-attack. A melee attack using Força
    // for both the roll (Luta) and the damage picks up the bonus in both places.
    const item = {
      name: 'Manopla de Força',
      quantity: 1,
      weight: 0,
      attackModifiers: [{ label: 'Manopla de Força', attributeId: 'str' as const, attributeValue: 6 }],
    };
    const meleeStrAttack = baseAttack({ rangeType: 'melee', attributeDamageBonus: 'str' });
    const character = baseCharacter({ inventory: [item] });
    const [meleeItem] = buildAttackChecklist(character, meleeStrAttack);
    expect(meleeItem).toMatchObject({ attackRoll: 6, damageBonus: 6 });

    // A ranged attack (Pontaria, Destreza-based roll) with damage still keyed to
    // Força only picks up the damage side, not the roll side.
    const rangedAttack = baseAttack({ rangeType: 'ranged', attributeDamageBonus: 'str' });
    const [rangedItem] = buildAttackChecklist(character, rangedAttack);
    expect(rangedItem).toMatchObject({ attackRoll: 0, damageBonus: 6 });
  });

  it('returns an empty checklist for a plain attack with nothing to compose', () => {
    const character = baseCharacter();
    expect(buildAttackChecklist(character, baseAttack())).toEqual([]);
  });
});

describe('composeAttack', () => {
  it('matches the resting calculation baseline when nothing is enabled and the attack has no extras', () => {
    // This is the invariant that protects against the two calculators (this file
    // and calculations.ts) silently drifting apart: with no extraBonuses/extraDamage
    // on the attack and nothing checked, composeAttack's base must equal what the
    // always-on calculators produce for the same "resting" attack.
    const character = baseCharacter({ attributes: { str: 6, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    const atk = baseAttack();
    const checklist = buildAttackChecklist(character, atk);
    const composed = composeAttack(character, atk, checklist, new Set());

    expect(composed.attackRoll).toBe(calcTotalSkill(character, 'luta'));
    expect(composed.attackRoll).toBe(calcAttackRoll(character, atk));
    expect(composed.damage).toBe(buildDamageSummary(character, atk));
  });

  it('reproduces the pre-existing result when only the attack’s own defaultChecked items are enabled', () => {
    // Same scenario the compose feature had to preserve exactly: an attack that
    // already had extraBonuses/extraDamage cadastrados before the compose sheet
    // existed must still resolve to the same numbers when nothing new is toggled.
    const character = baseCharacter({ attributes: { str: 6, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    const atk = baseAttack({
      extraBonuses: [{ name: 'Ataque Poderoso', value: -2, mp: 0 }],
      extraDamage: [{ name: 'Ataque Poderoso', value: '5', mp: 0 }],
    });
    const checklist = buildAttackChecklist(character, atk);
    const enabledKeys = new Set(checklist.filter((i) => i.defaultChecked).map((i) => i.key));
    const composed = composeAttack(character, atk, checklist, enabledKeys);

    expect(composed.attackRoll).toBe(calcAttackRoll(character, atk));
    expect(composed.damage).toBe(buildDamageSummary(character, atk));
  });

  it('sums an enabled external modifier and lists its label as used', () => {
    const ability: Ability = {
      name: 'Ataque Poderoso',
      source: 'Poder',
      type: 'Poder',
      mpCost: 1,
      description: '',
      attackModifiers: [{ label: 'Acerto', attackRoll: -2, mpCost: 1 }, { label: 'Dano', damageBonus: 5 }],
    };
    const character = baseCharacter({ attributes: { str: 6, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }, abilities: [ability] });
    const atk = baseAttack();
    const checklist = buildAttackChecklist(character, atk);
    const composed = composeAttack(character, atk, checklist, new Set([checklist[0].key]));

    expect(composed.attackRoll).toBe(calcTotalSkill(character, 'luta') - 2);
    expect(composed.mpTotal).toBe(1);
    expect(composed.usedLabels).toEqual(['Ataque Poderoso']);
  });

  it('leaves a disabled external modifier out of the total', () => {
    const ability: Ability = {
      name: 'Ataque Poderoso',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      attackModifiers: [{ label: 'Acerto', attackRoll: -2 }],
    };
    const character = baseCharacter({ abilities: [ability] });
    const atk = baseAttack();
    const checklist = buildAttackChecklist(character, atk);
    const composed = composeAttack(character, atk, checklist, new Set());

    expect(composed.attackRoll).toBe(calcTotalSkill(character, 'luta'));
    expect(composed.usedLabels).toEqual([]);
  });

  it('includes active buffs of type attack_roll/fixed_damage/extra_damage in the total', () => {
    const character = baseCharacter({
      attributes: { str: 6, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      buffs: [{
        name: 'Fúria',
        active: true,
        mp: 0,
        effects: [
          { type: 'attack_roll', value: '2' },
          { type: 'fixed_damage', value: '4' },
          { type: 'extra_damage', value: '1d6' },
        ],
      }],
    });
    const atk = baseAttack();
    const checklist = buildAttackChecklist(character, atk);
    const composed = composeAttack(character, atk, checklist, new Set());

    expect(composed.attackRoll).toBe(calcTotalSkill(character, 'luta') + 2);
    expect(composed.damage).toContain('1d6');
  });
});
