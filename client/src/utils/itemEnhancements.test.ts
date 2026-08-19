import { describe, it, expect } from 'vitest';
import { OFFICIAL_ITEM_ENHANCEMENTS } from '../data/itemEnhancements';
import { enhancementsFor, enhancementPatch } from './itemEnhancements';

const byName = (name: string) => {
  const found = OFFICIAL_ITEM_ENHANCEMENTS.find((e) => e.name === name);
  if (!found) throw new Error(`catálogo sem "${name}"`);
  return found;
};

describe('enhancementsFor', () => {
  it('offers weapon entries for a weapon', () => {
    const names = enhancementsFor('arma').map((e) => e.name);
    expect(names).toContain('Certeira');
    expect(names).toContain('Flamejante');
    expect(names).not.toContain('Ajustada');
  });

  it('offers armour entries for a protection item', () => {
    const names = enhancementsFor('protecao').map((e) => e.name);
    expect(names).toContain('Ajustada');
    expect(names).not.toContain('Certeira');
  });

  it('includes entries that apply to both', () => {
    expect(enhancementsFor('arma').map((e) => e.name)).toContain('Banhada a ouro');
    expect(enhancementsFor('protecao').map((e) => e.name)).toContain('Banhada a ouro');
  });
});

describe('enhancementPatch', () => {
  it('appends an attack modifier without dropping what the item already had', () => {
    const patch = enhancementPatch(byName('Cruel'), {
      buffs: [],
      attackModifiers: [{ label: 'Já existia', attackRoll: 1 }],
    });
    expect(patch.attackModifiers).toEqual([
      { label: 'Já existia', attackRoll: 1 },
      { label: 'Cruel', damageBonus: 1 },
    ]);
  });

  it('appends buff effects for a skill-based improvement', () => {
    const patch = enhancementPatch(byName('Banhada a ouro'), { buffs: [], attackModifiers: [] });
    expect(patch.buffs).toEqual([{ type: 'skill', skillId: 'diplomacia', value: '2' }]);
  });

  it('turns the fixed bonus on, since a melhoria is permanent', () => {
    const patch = enhancementPatch(byName('Cruel'), { buffs: [], attackModifiers: [] });
    expect(patch.alwaysActive).toBe('true');
  });

  it('records a procedural entry in the effect text instead of inventing numbers', () => {
    // "Maciça" changes the critical multiplier — there is no BuffEffect for that,
    // so it must survive as readable text rather than be silently dropped.
    const patch = enhancementPatch(byName('Maciça'), { buffs: [], attackModifiers: [], effect: '' });
    expect(patch.attackModifiers).toBeUndefined();
    expect(patch.effect).toBe('Maciça: +1 no multiplicador de crítico');
  });

  it('keeps existing effect text and appends the new entry', () => {
    const patch = enhancementPatch(byName('Maciça'), { buffs: [], attackModifiers: [], effect: 'Cetro élfico' });
    expect(patch.effect).toBe('Cetro élfico · Maciça: +1 no multiplicador de crítico');
  });

  it('names the effect text even when the entry also has numeric effects', () => {
    const patch = enhancementPatch(byName('Flamejante'), { buffs: [], attackModifiers: [], effect: '' });
    expect(patch.effect).toBe('Flamejante: +1d6 de dano de fogo');
    expect(patch.attackModifiers).toEqual([{ label: 'Flamejante', damageDice: '1d6' }]);
  });

  it('does not duplicate an enhancement already applied to the item', () => {
    const patch = enhancementPatch(byName('Cruel'), {
      buffs: [],
      attackModifiers: [{ label: 'Cruel', damageBonus: 1 }],
      effect: 'Cruel: +1 nas rolagens de dano',
    });
    expect(patch).toEqual({});
  });
});
