import { describe, it, expect } from 'vitest';
import type { Party, SessionProposal } from '../types/party';
import { getProposalStatus, getMyVote, memberLabel } from './sessionProposals';

function baseParty(overrides: Partial<Party> = {}): Party {
  return {
    id: 'party1',
    name: 'Grupo Teste',
    system: 'tormenta',
    inviteCode: 'ABC123',
    ownerUid: 'owner1',
    ownerEmail: 'owner@test.com',
    members: [
      { uid: 'owner1', email: 'owner@test.com', characterIds: [], joinedAt: '2026-01-01' },
      { uid: 'player2', email: 'player2@test.com', characterIds: [], joinedAt: '2026-01-01' },
      { uid: 'player3', email: 'player3@test.com', characterIds: [], joinedAt: '2026-01-01' },
    ],
    sessionProposals: [],
    ...overrides,
  };
}

function baseProposal(overrides: Partial<SessionProposal> = {}): SessionProposal {
  return {
    id: 'sp1',
    proposedBy: 'owner1',
    date: '2026-09-01',
    time: '19:00',
    createdAt: '2026-08-18T00:00:00.000Z',
    responses: [],
    ...overrides,
  };
}

describe('getProposalStatus', () => {
  it('marks every member without a response as pending', () => {
    const party = baseParty();
    const proposal = baseProposal({ responses: [] });
    const status = getProposalStatus(party, proposal);
    expect(status.confirmed).toBe(false);
    expect(status.pending.sort()).toEqual(['owner1', 'player2', 'player3']);
    expect(status.declined).toEqual([]);
  });

  it('lists members who voted "nao" as declined, not pending', () => {
    const party = baseParty();
    const proposal = baseProposal({
      responses: [
        { uid: 'owner1', vote: 'sim', respondedAt: '2026-08-18T01:00:00.000Z' },
        { uid: 'player2', vote: 'nao', respondedAt: '2026-08-18T01:00:00.000Z' },
      ],
    });
    const status = getProposalStatus(party, proposal);
    expect(status.confirmed).toBe(false);
    expect(status.pending).toEqual(['player3']);
    expect(status.declined).toEqual(['player2']);
  });

  it('is confirmed only when every member voted "sim"', () => {
    const party = baseParty();
    const proposal = baseProposal({
      responses: [
        { uid: 'owner1', vote: 'sim', respondedAt: '2026-08-18T01:00:00.000Z' },
        { uid: 'player2', vote: 'sim', respondedAt: '2026-08-18T01:00:00.000Z' },
        { uid: 'player3', vote: 'sim', respondedAt: '2026-08-18T01:00:00.000Z' },
      ],
    });
    const status = getProposalStatus(party, proposal);
    expect(status.confirmed).toBe(true);
    expect(status.pending).toEqual([]);
    expect(status.declined).toEqual([]);
  });
});

describe('getMyVote', () => {
  it('returns null when the member has not responded', () => {
    const proposal = baseProposal({ responses: [] });
    expect(getMyVote(proposal, 'owner1')).toBeNull();
  });

  it("returns the member's current vote", () => {
    const proposal = baseProposal({
      responses: [{ uid: 'owner1', vote: 'nao', respondedAt: '2026-08-18T01:00:00.000Z' }],
    });
    expect(getMyVote(proposal, 'owner1')).toBe('nao');
  });
});

describe('memberLabel', () => {
  const party = baseParty();

  it('usa o e-mail do membro quando ele existe no grupo', () => {
    expect(memberLabel(party, 'player2')).toBe('player2@test.com');
  });

  it('cai no uid quando o membro não está mais no grupo', () => {
    expect(memberLabel(party, 'saiu-do-grupo')).toBe('saiu-do-grupo');
  });

  it('cai no uid quando o membro está sem e-mail', () => {
    const semEmail = baseParty({
      members: [{ uid: 'anon', email: '', characterIds: [], joinedAt: '2026-01-01' }],
    });
    expect(memberLabel(semEmail, 'anon')).toBe('anon');
  });
});
