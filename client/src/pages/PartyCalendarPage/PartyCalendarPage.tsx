import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetchParties, apiProposeSession, apiRespondToSession, apiCancelSession } from '../../api';
import type { Party, SessionProposal } from '../../types/party';
import { useAuth } from '../../features/auth';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { WsMessage } from '../../hooks/useWebSocket';
import { getProposalStatus, getMyVote } from '../../utils/sessionProposals';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import Skeleton from '../../components/ui/Skeleton/Skeleton';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import GroupInfoCard from '../../components/party/GroupInfoCard/GroupInfoCard';
import styles from './PartyCalendarPage.module.css';

function formatWhen(proposal: SessionProposal): string {
  return proposal.time ? `${proposal.date} às ${proposal.time}` : proposal.date;
}

function memberLabel(party: Party, uid: string): string {
  return party.members.find((m) => m.uid === uid)?.email || uid;
}

export default function PartyCalendarPage() {
  const { system, partyId } = useParams<{ system: string; partyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.uid ?? '';

  const [party, setParty] = useState<Party | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!partyId) return;
    try {
      const parties = await apiFetchParties();
      const found = parties.find((p) => p.id === partyId);
      if (!found) {
        setAccessDenied(true);
        return;
      }
      setParty(found);
    } catch (err) {
      console.error('Erro ao carregar calendário:', err);
    }
  }, [partyId]);

  useEffect(() => {
    if (!partyId) return;
    apiFetchParties()
      .then((parties) => {
        const found = parties.find((p) => p.id === partyId);
        if (!found) {
          setAccessDenied(true);
          return;
        }
        setParty(found);
      })
      .catch((err) => console.error('Erro ao carregar calendário:', err));
  }, [partyId]);

  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useWebSocket(
    useCallback(
      (msg: WsMessage) => {
        if (msg.type === 'party_roster_sync' && msg.partyId === partyId) {
          loadDataRef.current();
        }
      },
      [partyId],
    ),
  );

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!party || !newDate) return;
    setSubmitting(true);
    try {
      const updated = await apiProposeSession(party.id, { date: newDate, time: newTime || undefined });
      setParty(updated);
      setNewDate('');
      setNewTime('');
    } catch (err) {
      console.error('Erro ao propor sessão:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (proposalId: string, vote: 'sim' | 'nao') => {
    if (!party) return;
    try {
      const updated = await apiRespondToSession(party.id, proposalId, vote);
      setParty(updated);
    } catch (err) {
      console.error('Erro ao votar:', err);
    }
  };

  const handleCancel = async (proposalId: string) => {
    if (!party) return;
    try {
      const updated = await apiCancelSession(party.id, proposalId);
      setParty(updated);
    } catch (err) {
      console.error('Erro ao cancelar proposta:', err);
    }
  };

  if (accessDenied) return <AccessDeniedPage />;

  if (!party) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.loadingRows} role="status" aria-label="Carregando calendário">
            <Skeleton height={64} radius={12} />
            <Skeleton height={96} radius={14} />
            <Skeleton height={96} radius={14} />
          </div>
        </div>
      </div>
    );
  }

  const isOwner = party.ownerUid === uid;
  const proposals = [...party.sessionProposals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const navItems = [
    { id: 'members', label: 'Membros', onClick: () => navigate(`/${system}/party/${partyId}/members`) },
    { id: 'combat', label: 'Combate', onClick: () => navigate(`/${system}/party/${partyId}`) },
    { id: 'calendar', label: 'Calendário', active: true },
  ];

  return (
    <div className={styles.page}>
      <Topbar title={`Grupo - ${party.name}`} />
      <SectionNav items={navItems} />

      <div className={styles.content}>
      <div className={styles.mainCol}>
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
                        onClick={() => handleVote(proposal.id, 'sim')}
                      >
                        Sim, posso
                      </Button>
                      <Button
                        type="button"
                        variant={myVote === 'nao' ? 'primary' : 'ghost'}
                        onClick={() => handleVote(proposal.id, 'nao')}
                      >
                        Não posso
                      </Button>
                      {canCancel && (
                        <button
                          type="button"
                          className={styles.cancelLink}
                          onClick={() => handleCancel(proposal.id)}
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
      </div>

      <GroupInfoCard party={party} isOwner={isOwner} />
      </div>
    </div>
  );
}
