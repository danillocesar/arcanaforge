import { describe, it, expect } from 'vitest';
import { normalizeSearch, firstSentence } from './formatters';

describe('normalizeSearch', () => {
  it('strips diacritics and lowercases so accented queries still match', () => {
    // Regression: pickers filtering with raw `.toLowerCase()` (no diacritic
    // stripping) failed to find "Heroísmo" when the player typed "heroismo".
    expect(normalizeSearch('Heroísmo').includes('heroismo')).toBe(true);
    expect(normalizeSearch('Bênção').includes('bencao')).toBe(true);
    expect(normalizeSearch('Explosão').includes('explosao')).toBe(true);
  });
});

describe('firstSentence', () => {
  it('returns the first sentence, keeping its period', () => {
    expect(firstSentence('Você cria uma esfera de fogo. Ela explode no alvo.')).toBe(
      'Você cria uma esfera de fogo.',
    );
  });

  it('returns the whole text when there is a single sentence', () => {
    expect(firstSentence('O alvo recebe +2 em Defesa')).toBe('O alvo recebe +2 em Defesa');
  });

  it('stops at the first paragraph break, so the "Truque:" block never leaks in', () => {
    // Catalog descriptions end with a Truque paragraph after a blank line.
    const text = 'O alvo fica abalado\n\nTruque: o alvo pode repetir o teste.';
    expect(firstSentence(text)).toBe('O alvo fica abalado');
  });

  it('does not split on an abbreviation like "T$" prices or "1d6+2"', () => {
    expect(firstSentence('Custa T$ 5,00 por dose. O resto é história.')).toBe(
      'Custa T$ 5,00 por dose.',
    );
  });

  it('does not split on a decimal number', () => {
    expect(firstSentence('O alvo avança 1.5m por rodada. Depois para.')).toBe(
      'O alvo avança 1.5m por rodada.',
    );
  });

  it('handles ! and ? as sentence ends', () => {
    expect(firstSentence('Que explosão! Agora corra.')).toBe('Que explosão!');
  });

  it('returns an empty string for empty or missing input', () => {
    expect(firstSentence('')).toBe('');
    expect(firstSentence(undefined)).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(firstSentence('  Você voa. Muito alto.  ')).toBe('Você voa.');
  });
});
