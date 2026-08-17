/** Normaliza texto pra busca: minúsculas, sem acento/diacrítico, sem espaço nas pontas. */
export function normalizeSearch(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
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

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#f43f5e', '#84cc16', '#a855f7', '#14b8a6',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
