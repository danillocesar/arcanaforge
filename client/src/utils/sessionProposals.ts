import type { Party, SessionProposal } from '../types/party';

export interface ProposalStatus {
  confirmed: boolean;
  pending: string[];
  declined: string[];
}

export function getProposalStatus(party: Party, proposal: SessionProposal): ProposalStatus {
  const pending: string[] = [];
  const declined: string[] = [];

  for (const member of party.members) {
    const response = proposal.responses.find((r) => r.uid === member.uid);
    if (!response) {
      pending.push(member.uid);
    } else if (response.vote === 'nao') {
      declined.push(member.uid);
    }
  }

  return { confirmed: pending.length === 0 && declined.length === 0, pending, declined };
}

export function getMyVote(proposal: SessionProposal, uid: string): 'sim' | 'nao' | null {
  return proposal.responses.find((r) => r.uid === uid)?.vote ?? null;
}

/** Como exibir um membro: e-mail quando houver, senão o uid (membro removido). */
export function memberLabel(party: Party, uid: string): string {
  return party.members.find((m) => m.uid === uid)?.email || uid;
}
