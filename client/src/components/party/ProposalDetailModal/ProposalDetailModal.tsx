import Modal from '../../ui/Modal/Modal';
import Button from '../../ui/Button/Button';
import type { Party, SessionProposal } from '../../../types/party';
import { getMyVote, getProposalStatus, memberLabel } from '../../../utils/sessionProposals';
import { formatProposalWhen } from '../../../utils/weekAgenda';
import styles from './ProposalDetailModal.module.css';

interface ProposalDetailModalProps {
  /** `null` fecha a modal. */
  proposal: SessionProposal | null;
  party: Party;
  uid: string;
  isOwner: boolean;
  onClose: () => void;
  onVote: (proposalId: string, vote: 'sim' | 'nao') => void;
  onCancel: (proposalId: string) => void;
}

export default function ProposalDetailModal({
  proposal,
  party,
  uid,
  isOwner,
  onClose,
  onVote,
  onCancel,
}: ProposalDetailModalProps) {
  if (!proposal) return null;

  const status = getProposalStatus(party, proposal);
  const myVote = getMyVote(proposal, uid);
  const canCancel = proposal.proposedBy === uid || isOwner;

  return (
    <Modal open onClose={onClose}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.when}>{formatProposalWhen(proposal)}</h3>
          <span className={styles.by}>Proposto por {memberLabel(party, proposal.proposedBy)}</span>
        </div>

        {status.confirmed ? (
          <div className={styles.confirmedBanner}>Sessão confirmada! 🎲</div>
        ) : (
          <div className={styles.warningBanner}>
            {status.pending.length > 0 && (
              <div>Aguardando: {status.pending.map((u) => memberLabel(party, u)).join(', ')}</div>
            )}
            {status.declined.length > 0 && (
              <div>Recusaram: {status.declined.map((u) => memberLabel(party, u)).join(', ')}</div>
            )}
          </div>
        )}

        <div className={styles.memberChips}>
          {party.members.map((member) => {
            const vote = getMyVote(proposal, member.uid);
            const chipClass =
              vote === 'sim'
                ? styles.memberChipSim
                : vote === 'nao'
                  ? styles.memberChipNao
                  : styles.memberChipPending;
            return (
              <span key={member.uid} className={`${styles.memberChip} ${chipClass}`}>
                {memberLabel(party, member.uid)}: {vote === 'sim' ? '✓' : vote === 'nao' ? '✗' : 'aguardando'}
              </span>
            );
          })}
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant={myVote === 'sim' ? 'primary' : 'ghost'}
            onClick={() => onVote(proposal.id, 'sim')}
          >
            Sim, posso
          </Button>
          <Button
            type="button"
            variant={myVote === 'nao' ? 'primary' : 'ghost'}
            onClick={() => onVote(proposal.id, 'nao')}
          >
            Não posso
          </Button>
        </div>

        <div className={styles.footer}>
          {canCancel && (
            <button type="button" className={styles.cancelLink} onClick={() => onCancel(proposal.id)}>
              Cancelar proposta
            </button>
          )}
          <button type="button" className={styles.closeLink} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
