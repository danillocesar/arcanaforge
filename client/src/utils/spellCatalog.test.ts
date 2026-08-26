import { describe, it, expect } from 'vitest';
import type { Spell } from '../types/character';
import type { OfficialSpell } from '../data/spells';
import { hydrateSpell, hydrateSpells, computeSpellOverrides } from './spellCatalog';

const catalog: OfficialSpell[] = [
  {
    id: 'arma-magica', publication: 'Edição Jogo do Ano', name: 'Arma Mágica', school: 'Transmutação',
    spellType: 'Universal', spellLevel: 1, castingTime: 'padrão', range: 'toque', area: '1 arma empunhada',
    duration: 'cena', resistance: '', description: 'Texto novo do catálogo.',
    enhancements: [{ mpCost: 2, description: 'aumenta o bônus em +1.' }],
  },
  {
    id: 'silencio', publication: 'Edição Jogo do Ano', name: 'Silêncio', school: 'Ilusão', spellType: 'Arcana',
    spellLevel: 2, castingTime: 'padrão', range: 'curto', area: 'esfera de 6m', duration: 'cena',
    resistance: '', description: 'Silencia.', enhancements: [],
  },
];

function sheetSpell(overrides: Partial<Spell> = {}): Spell {
  return {
    name: 'Arma Mágica', school: 'Transmutação', castingTime: 'padrão', range: 'toque', area: '1 arma',
    duration: 'cena', resistance: '', mpCost: 1, spellLevel: 1, description: 'Texto antigo.',
    enhancements: [{ mpCost: 2, description: 'aumenta o bônus em +1.' }],
    ...overrides,
  };
}

describe('hydrateSpell', () => {
  it('sem catalogId devolve a magia intacta', () => {
    const sp = sheetSpell();
    expect(hydrateSpell(sp, catalog)).toBe(sp);
  });

  it('com catalogId, campos não editados vêm do catálogo e os editados prevalecem', () => {
    const sp = sheetSpell({ catalogId: 'arma-magica', overrides: ['area'], mpCost: 3, summary: 'meu resumo' });
    const out = hydrateSpell(sp, catalog);
    expect(out.description).toBe('Texto novo do catálogo.'); // não editado → catálogo
    expect(out.area).toBe('1 arma'); // override → mantém
    expect(out.mpCost).toBe(3); // sempre do jogador
    expect(out.summary).toBe('meu resumo');
  });

  it('preserva buffs/attackModifiers dos aprimoramentos ao trazer o texto novo', () => {
    const sp = sheetSpell({
      catalogId: 'arma-magica',
      enhancements: [{ mpCost: 2, description: 'texto antigo', buffs: [{ type: 'attack_roll', value: '1' }] }],
    });
    const out = hydrateSpell(sp, catalog);
    expect(out.enhancements[0].description).toBe('aumenta o bônus em +1.');
    expect(out.enhancements[0].buffs).toEqual([{ type: 'attack_roll', value: '1' }]);
  });

  it('id inexistente no catálogo não quebra: devolve a magia salva', () => {
    const sp = sheetSpell({ catalogId: 'nao-existe' });
    expect(hydrateSpell(sp, catalog)).toEqual(sp);
  });
});

describe('hydrateSpells (migração por nome)', () => {
  it('atribui catalogId por nome (sem acento/caixa) e marca como override o que já difere', () => {
    const [out] = hydrateSpells([sheetSpell({ name: 'arma magica', description: 'Texto antigo.' })], catalog);
    expect(out.catalogId).toBe('arma-magica');
    expect(out.name).toBe('Arma Mágica');
    // area '1 arma' ≠ '1 arma empunhada' e description diferem → viram overrides, mantidos
    expect(out.overrides).toEqual(expect.arrayContaining(['area', 'description']));
    expect(out.area).toBe('1 arma');
    expect(out.description).toBe('Texto antigo.');
  });

  it('não casa nomes parecidos ("Silêncio" ≠ "Silêncio Maior")', () => {
    const [out] = hydrateSpells([sheetSpell({ name: 'Silêncio Maior' })], catalog);
    expect(out.catalogId).toBeUndefined();
  });

  it('é idempotente', () => {
    const once = hydrateSpells([sheetSpell()], catalog);
    expect(hydrateSpells(once, catalog)).toEqual(once);
  });

  it('devolve a mesma referência da lista quando nada muda', () => {
    const list = [sheetSpell({ name: 'Magia da casa' })];
    expect(hydrateSpells(list, catalog)).toBe(list);
  });
});

describe('computeSpellOverrides', () => {
  it('lista só os campos hidratáveis que diferem do catálogo', () => {
    const next = sheetSpell({ catalogId: 'arma-magica', area: '1 arma', description: 'Texto novo do catálogo.' });
    expect(computeSpellOverrides(next, catalog[0])).toEqual(['area']);
  });

  it('aprimoramento com texto ou custo diferente conta como override de enhancements', () => {
    const next = sheetSpell({
      catalogId: 'arma-magica', area: '1 arma empunhada', description: 'Texto novo do catálogo.',
      enhancements: [{ mpCost: 3, description: 'aumenta o bônus em +1.' }],
    });
    expect(computeSpellOverrides(next, catalog[0])).toEqual(['enhancements']);
  });
});
