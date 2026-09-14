import type { Character } from '../types/character';

/** Sanitiza um texto para uso seguro em nome de arquivo. */
function sanitizeFileName(input: string): string {
  return (input || 'personagem')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'personagem';
}

/**
 * Faz o download do personagem como arquivo JSON formatado.
 * O arquivo é nomeado a partir do nome do personagem.
 */
export function downloadCharacterJson(character: Character): void {
  const json = JSON.stringify(character, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const baseName = sanitizeFileName(character.name);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${baseName}_${date}.json`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
