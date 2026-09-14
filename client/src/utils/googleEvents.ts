import type { SessionProposal } from '../types/party';

/**
 * A proposta já gerou evento na agenda DESTE usuário. Deliberadamente pessoal:
 * o indicador diz "na sua agenda" e não mostra o estado dos outros membros.
 */
export function hasGoogleEventFor(proposal: SessionProposal, uid: string): boolean {
  if (!uid) return false;
  return (proposal.googleEvents || []).some((e) => e.uid === uid);
}
