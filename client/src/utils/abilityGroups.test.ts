import { describe, it, expect } from 'vitest';
import type { Ability } from '../types/character';
import { groupAbilities, FAVORITES_GROUP_KEY } from './abilityGroups';

function ability(overrides: Partial<Ability> = {}): Ability {
  return { name: 'Poder', source: '', type: '', mpCost: 0, description: '', ...overrides };
}

const keysOf = (abilities: Ability[]) => groupAbilities(abilities).map((g) => g.key);
const groupNamed = (abilities: Ability[], key: string) =>
  groupAbilities(abilities).find((g) => g.key === key);

describe('groupAbilities', () => {
  it('returns no groups for an empty list', () => {
    expect(groupAbilities([])).toEqual([]);
  });

  it('groups a power under its T20 category', () => {
    const group = groupNamed([ability({ name: 'Ataque Poderoso', type: 'Combate' })], 'Combate');
    expect(group?.label).toBe('Combate');
    expect(group?.items.map((i) => i.ability.name)).toEqual(['Ataque Poderoso']);
  });

  it('orders the categories canonically, not alphabetically nor by insertion', () => {
    const keys = keysOf([
      ability({ type: 'Tormenta' }),
      ability({ type: 'Magia' }),
      ability({ type: 'Combate' }),
      ability({ type: 'Destino' }),
      ability({ type: 'Concedido' }),
    ]);
    expect(keys).toEqual(['Combate', 'Destino', 'Magia', 'Concedido', 'Tormenta']);
  });

  it('omits categories that have no powers', () => {
    expect(keysOf([ability({ type: 'Magia' })])).toEqual(['Magia']);
  });

  it('keeps the original character.abilities index so editing still targets the right entry', () => {
    const list = [
      ability({ name: 'A', type: 'Tormenta' }),
      ability({ name: 'B', type: 'Combate' }),
      ability({ name: 'C', type: 'Combate' }),
    ];
    expect(groupNamed(list, 'Combate')?.items.map((i) => i.index)).toEqual([1, 2]);
    expect(groupNamed(list, 'Tormenta')?.items.map((i) => i.index)).toEqual([0]);
  });

  it('falls back to a Habilidades group for class abilities with no category', () => {
    // Habilidades de classe não têm categoria do T20 — sem isso cairiam todas
    // em "Sem categoria" junto com os poderes legados.
    const group = groupNamed([ability({ name: 'Ataque Especial', kind: 'Habilidade' })], 'Habilidade');
    expect(group?.label).toBe('Habilidades');
    expect(group?.items).toHaveLength(1);
  });

  it('respects an explicit category on a Habilidade instead of the fallback', () => {
    const keys = keysOf([ability({ kind: 'Habilidade', type: 'Magia' })]);
    expect(keys).toEqual(['Magia']);
  });

  it('collects uncategorised powers under "Sem categoria", last', () => {
    const keys = keysOf([ability({ name: 'Legado' }), ability({ type: 'Combate' })]);
    expect(keys).toEqual(['Combate', 'Sem categoria']);
    expect(groupNamed([ability({ name: 'Legado' })], 'Sem categoria')?.label).toBe('Sem categoria');
  });

  it('puts an explicit "Outro" category after the five official ones', () => {
    const keys = keysOf([ability({ type: 'Outro' }), ability({ type: 'Combate' })]);
    expect(keys).toEqual(['Combate', 'Outro']);
  });

  it('pins a Favoritos group first, duplicating the powers marked as favourite', () => {
    const list = [
      ability({ name: 'Comum', type: 'Combate' }),
      ability({ name: 'Preferido', type: 'Tormenta', favorite: true }),
    ];
    const groups = groupAbilities(list);
    expect(groups[0].key).toBe(FAVORITES_GROUP_KEY);
    expect(groups[0].items.map((i) => i.ability.name)).toEqual(['Preferido']);
    // still listed in its own category too — same power, two shelves
    expect(groupNamed(list, 'Tormenta')?.items.map((i) => i.ability.name)).toEqual(['Preferido']);
  });

  it('omits the Favoritos group entirely when nothing is marked', () => {
    expect(keysOf([ability({ type: 'Combate' })])).not.toContain(FAVORITES_GROUP_KEY);
  });
});
