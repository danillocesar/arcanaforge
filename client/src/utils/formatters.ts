/** Normaliza texto pra busca: minúsculas, sem acento/diacrítico, sem espaço nas pontas. */
export function normalizeSearch(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Primeira frase de um texto — resumo de emergência quando magia/poder não tem
 * `summary` preenchido, no lugar de despejar a descrição inteira do livro no card.
 *
 * Para antes do primeiro parágrafo (as descrições do catálogo terminam com um
 * bloco "Truque:" depois de linha em branco) e só corta em `.`/`!`/`?` seguidos de
 * espaço + letra maiúscula, pra não quebrar em "T$ 5,00" nem em "1.5m".
 */
export function firstSentence(text: string | undefined): string {
  const paragraph = (text ?? '').trim().split(/\n\s*\n/)[0]?.trim() ?? '';
  if (!paragraph) return '';
  const end = paragraph.search(/[.!?](?=\s+\p{Lu})/u);
  return end === -1 ? paragraph : paragraph.slice(0, end + 1);
}

export function formatClassesStr(classes: { name: string; level: number }[]): string {
  return (
    classes
      ?.filter((c) => c.name)
      .map((c) => `${c.name} ${c.level || 1}`)
      .join(', ') || 'Sem classe'
  );
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Paleta dessaturada (mesmos matizes da original, blend ~40% em direção a um
// cinza neutro) — a versão vívida original destoava contra o fundo/acento
// gelo mais frio e discreto da paleta atual do app.
const AVATAR_COLORS = [
  '#6f74a0', '#8c7aa8', '#bb7996', '#c99c5f', '#5c9c82',
  '#5a9aab', '#b96773', '#9aab5e', '#9c81b3', '#5aa89b',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
