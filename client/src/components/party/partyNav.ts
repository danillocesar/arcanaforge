import type { NavItem } from '../layout/SectionNav/SectionNav';

/** Abas do grupo, na ordem em que aparecem na barra. */
export const PartySection = {
  MEMBERS: 'members',
  COMBAT: 'combat',
  CALENDAR: 'calendar',
  FILES: 'files',
} as const;

export type PartySection = (typeof PartySection)[keyof typeof PartySection];

const SECTIONS: { id: PartySection; label: string; path: string }[] = [
  { id: PartySection.MEMBERS, label: 'Membros', path: '/members' },
  { id: PartySection.COMBAT, label: 'Combate', path: '' },
  { id: PartySection.CALENDAR, label: 'Calendário', path: '/calendar' },
  { id: PartySection.FILES, label: 'Arquivos', path: '/files' },
];

/** Rota de uma aba do grupo. */
export function partySectionPath(system: string, partyId: string, section: PartySection): string {
  const found = SECTIONS.find((s) => s.id === section);
  return `/${system}/party/${partyId}${found?.path ?? ''}`;
}

/** Itens da SectionNav do grupo: a aba atual fica marcada, as outras navegam. */
export function buildPartyNavItems(
  system: string,
  partyId: string,
  active: PartySection,
  navigate: (path: string) => void,
): NavItem[] {
  return SECTIONS.map((s) =>
    s.id === active
      ? { id: s.id, label: s.label, active: true }
      : { id: s.id, label: s.label, onClick: () => navigate(partySectionPath(system, partyId, s.id)) },
  );
}
