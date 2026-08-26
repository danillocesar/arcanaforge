import { describe, it, expect } from 'vitest';
import { OFFICIAL_SPELLS } from './spells';

describe('OFFICIAL_SPELLS (catálogo)', () => {
  it('tem 202 magias: 197 da Edição Jogo do Ano + 5 de suplemento', () => {
    expect(OFFICIAL_SPELLS).toHaveLength(202);
    expect(OFFICIAL_SPELLS.filter((s) => s.publication === 'Edição Jogo do Ano')).toHaveLength(197);
  });

  it('tem ids únicos, em kebab-case sem acento', () => {
    const ids = OFFICIAL_SPELLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it('não tem nomes duplicados e mantém os nomes usados pelas fichas', () => {
    const names = OFFICIAL_SPELLS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('Lendas e Histórias');
    expect(names).toContain('Heroísmo');
    expect(names).toContain('Conjurar Mortos-Vivos');
  });

  it('só usa os três tipos e círculos de 1 a 5', () => {
    OFFICIAL_SPELLS.forEach((s) => {
      expect(['Arcana', 'Divina', 'Universal']).toContain(s.spellType);
      expect(s.spellLevel).toBeGreaterThanOrEqual(1);
      expect(s.spellLevel).toBeLessThanOrEqual(5);
    });
  });

  it('nunca grava "nenhuma" em resistance (convenção: vazio)', () => {
    OFFICIAL_SPELLS.forEach((s) => expect(s.resistance.toLowerCase()).not.toBe('nenhuma'));
  });
});
