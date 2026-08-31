import { useState } from 'react';
import type { Party, SessionProposal } from '../../../types/party';
import { getMyVote, getProposalStatus, memberLabel } from '../../../utils/sessionProposals';
import Input from '../../ui/Input/Input';
import Button from '../../ui/Button/Button';
import EmptyState from '../../ui/EmptyState/EmptyState';
import styles from './ProposalList.module.css';

function formatWhen(proposal: SessionProposal): string {
  return proposal.time ? `${proposal.date} às ${proposal.time}` : proposal.date;
}

interface ProposalListProps {
  party: Party;
  uid: string;
  isOwner: boolean;
  onPropose: (date: string, time: string) => Promise<void>;
  onVote: (proposalId: string, vote: 'sim' | 'nao') => void;
  onCancel: (proposalId: string) => void;
}

export default function ProposalList({
  party,
  uid,
  isOwner,
  onPropose,
  onVote,
  onCancel,
}: ProposalListProps) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const proposals = [...party.sessionProposals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || submitting) return;
    setSubmitting(true);
    try {
      await onPropose(newDate, newTime);
      setNewDate('');
      setNewTime('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form className={styles.proposeForm} onSubmit={handlePropose}>
        <div className={styles.proposeField}>
          <label className={styles.proposeLabel} htmlFor="proposal-date">Data</label>
          <Input
            id="proposal-date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
        </div>
        <div className={styles.proposeField}>
          <label className={styles.proposeLabel} htmlFor="proposal-time">Horário (opcional)</label>
          <Input
            id="proposal-time"
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
          />
        </div>
        <Button type="submit" variant="primary" disabled={!newDate || submitting}>
          Propor data
        </Button>
      </form>

      <div>
        <h3 className={styles.sectionTitle}>Propostas ({proposals.length})</h3>

        {proposals.length === 0 ? (
          <EmptyState
            icon="🗓️"
            title="Nenhuma data proposta ainda."
            hint="Proponha uma data acima para organizar a próxima sessão."
          />
        ) : (
          <div className={styles.proposalsList}>
            {proposals.map((proposal) => {
              const status = getProposalStatus(party, proposal);
              const myVote = getMyVote(proposal, uid);
              const canCancel = proposal.proposedBy === uid || isOwner;

              return (
                <div
                  key={proposal.id}
                  className={`${styles.proposalCard} ${status.confirmed ? styles.proposalCardConfirmed : ''}`}
                >
                  <div className={styles.proposalHeader}>
                    <span className={styles.proposalWhen}>{formatWhen(proposal)}</span>
                    <span className={styles.proposalBy}>
                      Proposto por {memberLabel(party, proposal.proposedBy)}
                    </span>
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
                      const chipClass = vote === 'sim'
                        ? styles.memberChipSim
                        : vote === 'nao'
                          ? styles.memberChipNao
                          : styles.memberChipPending;
                      return (
                        <span key={member.uid} className={`${styles.memberChip} ${chipClass}`}>
                          {member.email || member.uid}: {vote === 'sim' ? '✓' : vote === 'nao' ? '✗' : 'aguardando'}
                        </span>
                      );
                    })}
                  </div>

                  <div className={styles.proposalActions}>
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
                    {canCancel && (
                      <button
                        type="button"
                        className={styles.cancelLink}
                        onClick={() => onCancel(proposal.id)}
                      >
                        Cancelar proposta
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
