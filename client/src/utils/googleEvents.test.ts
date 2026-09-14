import { describe, it, expect } from 'vitest';
import type { SessionProposal } from '../types/party';
import { hasGoogleEventFor } from './googleEvents';

function proposal(googleEvents?: SessionProposal['googleEvents']): SessionProposal {
  return {
    id: 'p1',
    proposedBy: 'a',
    date: '2026-09-03',
    time: '19:00',
    createdAt: '2026-08-31T10:00:00.000Z',
    responses: [],
    googleEvents,
  };
}

describe('hasGoogleEventFor', () => {
  it('reconhece o evento do próprio usuário', () => {
    expect(hasGoogleEventFor(proposal([{ uid: 'a', eventId: 'e', calendarId: 'c' }]), 'a')).toBe(true);
  });

  it('não confunde evento de outro membro com o próprio', () => {
    expect(hasGoogleEventFor(proposal([{ uid: 'b', eventId: 'e', calendarId: 'c' }]), 'a')).toBe(false);
  });

  it('é falso quando não há evento nenhum', () => {
    expect(hasGoogleEventFor(proposal([]), 'a')).toBe(false);
  });

  it('é falso quando o campo não existe (proposta antiga)', () => {
    expect(hasGoogleEventFor(proposal(undefined), 'a')).toBe(false);
  });

  it('é falso com uid vazio', () => {
    expect(hasGoogleEventFor(proposal([{ uid: '', eventId: 'e', calendarId: 'c' }]), '')).toBe(false);
  });
});
