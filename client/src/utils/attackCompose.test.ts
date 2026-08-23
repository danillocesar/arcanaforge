import { describe, it, expect } from 'vitest';
import type { Attack, Character, Ability, Spell } from '../types/character';
import { createEmptyCharacter, calcTotalSkill, calcAttackRoll, buildDamageSummary } from './calculations';
import { buildAttackChecklist, composeAttack, multiplyDamageDice } from './attackCompose';

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

  it('omits the attackModifiers of a suppressed ability', () => {
    const ability: Ability = {
      name: 'Ataque Poderoso',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      suppressed: true,
      attackModifiers: [{ label: 'Acerto', attackRoll: -2 }],
    };
    const character = baseCharacter({ abilities: [ability] });
    expect(buildAttackChecklist(character, baseAttack())).toHaveLength(0);
  });

  it('lists each attackModifiers line of the same ability as its own selectable item', () => {
    // Linhas separadas pra permitir empilhar só uma delas (ex.: multiplicar só o
    // dado de dano sem multiplicar o bônus de acerto).
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
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      key: 'ability-0-mod-0',
      label: 'Ataque Poderoso — Acerto',
      source: 'Poder',
      attackRoll: -2,
      damageBonus: 0,
      defaultChecked: false,
    });
    expect(items[1]).toMatchObject({
      key: 'ability-0-mod-1',
      label: 'Ataque Poderoso — Dano',
      damageBonus: 5,
    });
  });

  it('keeps the plain entity name as label when there is a single modifier line', () => {
    const ability: Ability = {
      name: 'Smite Divino',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      attackModifiers: [{ label: 'Smite', damageDice: '1d8', mpCost: 1 }],
    };
    const [item] = buildAttackChecklist(baseCharacter({ abilities: [ability] }), baseAttack());
    expect(item.label).toBe('Smite Divino');
  });

  it('marks an item repeatable only when its modifier line opts in', () => {
    const ability: Ability = {
      name: 'Smite Divino',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      attackModifiers: [
        { label: 'Smite', damageDice: '1d8', mpCost: 1, repeatable: true },
        { label: 'Acerto', attackRoll: 2 },
      ],
    };
    const items = buildAttackChecklist(baseCharacter({ abilities: [ability] }), baseAttack());
    expect(items[0].repeatable).toBe(true);
    expect(items[1].repeatable).toBe(false);
  });

  it('marks a spell enhancement item repeatable when any of its lines opts in', () => {
    const spell: Spell = {
      name: 'Toque Chocante', school: 'Evocação', castingTime: '', range: '', area: '',
      duration: '', resistance: '', mpCost: 1, spellLevel: 1, description: '',
      enhancements: [{
        description: '+1d8 por PM extra', mpCost: 1,
        attackModifiers: [{ label: 'Dano', damageDice: '1d8', repeatable: true }],
      }],
    };
    const [item] = buildAttackChecklist(baseCharacter({ spells: [spell] }), baseAttack());
    expect(item.repeatable).toBe(true);
  });

  it('resolves attribute-driven attack/damage bonuses into the item numbers', () => {
    // Bônus que vem de um atributo (ex.: soma a Sabedoria no teste e no dano),
    // acumulável com o valor fixo digitado na mesma linha.
    const ability: Ability = {
      name: 'Fúria Divina',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      attackModifiers: [{
        label: 'Fúria', attackRoll: 1, mpCost: 2,
        attackRollAttribute: 'wis', damageBonusAttribute: 'wis',
      }],
    };
    const character = baseCharacter({
      attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 4, cha: 0 },
      abilities: [ability],
    });
    const [item] = buildAttackChecklist(character, baseAttack());
    expect(item).toMatchObject({ attackRoll: 5, damageBonus: 4, mpCost: 2 });
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

  it('lists each spell enhancement with modifiers as its own item, adding the enhancement PM cost', () => {
    // Toque Chocante: o efeito base (+2d8 no dano, 1 PM) e cada aprimoramento com
    // modificadores viram itens individuais do checklist — o custo do item do
    // aprimoramento inclui o "PM extra" do próprio aprimoramento.
    const spell: Spell = {
      name: 'Toque Chocante', school: 'Evocação', castingTime: '', range: '', area: '',
      duration: '', resistance: '', mpCost: 1, spellLevel: 1, description: '',
      attackModifiers: [{ label: 'Dano', damageDice: '2d8', mpCost: 1 }],
      enhancements: [
        { description: 'Muda o alcance para curto', mpCost: 1 },
        {
          description: '+2 no teste de ataque', mpCost: 2,
          attackModifiers: [{ label: 'Acerto', attackRoll: 2 }],
        },
      ],
    };
    const items = buildAttackChecklist(baseCharacter({ spells: [spell] }), baseAttack());
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      label: 'Toque Chocante', source: 'Magia', damageDice: '2d8', mpCost: 1,
    });
    expect(items[1]).toMatchObject({
      label: 'Toque Chocante — Aprimoramento 2', source: 'Magia',
      attackRoll: 2, mpCost: 2, defaultChecked: false,
    });
    expect(items.map((i) => i.key)).toEqual(['spell-0-mod-0', 'spell-0-enh-1']);
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

  it('sums only the enabled modifier line and lists its label as used', () => {
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
    expect(composed.usedLabels).toEqual(['Ataque Poderoso — Acerto']);
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

  it('caps a non-repeatable item at one application even when the count says more', () => {
    const ability: Ability = {
      name: 'Ataque Poderoso',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      attackModifiers: [{ label: 'Acerto', attackRoll: 2, mpCost: 1 }],
    };
    const character = baseCharacter({ abilities: [ability] });
    const atk = baseAttack();
    const checklist = buildAttackChecklist(character, atk);
    const composed = composeAttack(character, atk, checklist, new Map([[checklist[0].key, 3]]));

    expect(composed.attackRoll).toBe(calcTotalSkill(character, 'luta') + 2);
    expect(composed.mpTotal).toBe(1);
    expect(composed.usedLabels).toEqual(['Ataque Poderoso']);
  });

  it('applies a stacked modifier N times: numbers, PM and dice all scale', () => {
    // Smite Divino: 1d8 de dano por 1 PM gasto — marcado 3 vezes vira 3d8 e 3 PM.
    const ability: Ability = {
      name: 'Smite Divino',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      attackModifiers: [{ label: 'Smite', damageDice: '1d8', mpCost: 1, attackRoll: 1, repeatable: true }],
    };
    const character = baseCharacter({ abilities: [ability] });
    const atk = baseAttack();
    const checklist = buildAttackChecklist(character, atk);
    const composed = composeAttack(character, atk, checklist, new Map([[checklist[0].key, 3]]));

    expect(composed.attackRoll).toBe(calcTotalSkill(character, 'luta') + 3);
    expect(composed.mpTotal).toBe(3);
    expect(composed.damage).toContain('3d8');
    expect(composed.usedLabels).toEqual(['Smite Divino ×3']);
  });

  it('treats a Map count of 1 exactly like the checked Set entry', () => {
    const ability: Ability = {
      name: 'Smite Divino',
      source: 'Poder',
      type: 'Poder',
      mpCost: 0,
      description: '',
      attackModifiers: [{ label: 'Smite', damageDice: '1d8', mpCost: 1 }],
    };
    const character = baseCharacter({ abilities: [ability] });
    const atk = baseAttack();
    const checklist = buildAttackChecklist(character, atk);
    const viaMap = composeAttack(character, atk, checklist, new Map([[checklist[0].key, 1]]));
    const viaSet = composeAttack(character, atk, checklist, new Set([checklist[0].key]));

    expect(viaMap).toEqual(viaSet);
    expect(viaMap.usedLabels).toEqual(['Smite Divino']);
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

describe('multiplyDamageDice', () => {
  it('multiplies the dice count of a single term', () => {
    expect(multiplyDamageDice('1d8', 3)).toBe('3d8');
    expect(multiplyDamageDice('2d12', 2)).toBe('4d12');
  });

  it('keeps sign prefixes and multiplies every dice term in the string', () => {
    expect(multiplyDamageDice('+2d6', 2)).toBe('+4d6');
    expect(multiplyDamageDice('1d8+1d6', 2)).toBe('2d8+2d6');
  });

  it('treats a bare "d8" as one die', () => {
    expect(multiplyDamageDice('d8', 2)).toBe('2d8');
  });

  it('returns the string unchanged for times = 1', () => {
    expect(multiplyDamageDice('1d8+2', 1)).toBe('1d8+2');
  });
});
