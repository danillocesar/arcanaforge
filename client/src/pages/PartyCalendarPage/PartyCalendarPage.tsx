import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarDays, List } from 'lucide-react';
import { apiFetchParties, apiProposeSession, apiRespondToSession, apiCancelSession } from '../../api';
import type { Party } from '../../types/party';
import { useAuth } from '../../features/auth';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { WsMessage } from '../../hooks/useWebSocket';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import Skeleton from '../../components/ui/Skeleton/Skeleton';
import GroupInfoCard from '../../components/party/GroupInfoCard/GroupInfoCard';
import SessionAgenda from '../../components/party/SessionAgenda/SessionAgenda';
import ProposalList from '../../components/party/ProposalList/ProposalList';
import ProposalDetailModal from '../../components/party/ProposalDetailModal/ProposalDetailModal';
import ProposeSessionModal, {
  type ProposeSlot,
} from '../../components/party/ProposeSessionModal/ProposeSessionModal';
import styles from './PartyCalendarPage.module.css';

type CalendarView = 'agenda' | 'list';

const VIEW_KEY = 'arcanaforge:calendarView';

function loadView(): CalendarView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'agenda';
  } catch {
    return 'agenda';
  }
}

function saveView(view: CalendarView) {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    // localStorage indisponível (aba privada, storage bloqueado): a escolha
    // vale só para esta sessão.
  }
}

export default function PartyCalendarPage() {
  const { system, partyId } = useParams<{ system: string; partyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.uid ?? '';

  const [party, setParty] = useState<Party | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [view, setView] = useState<CalendarView>(loadView);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposeSlot, setProposeSlot] = useState<ProposeSlot | null>(null);

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

  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // Carga inicial inline (e não via loadData) porque o setState precisa ficar
  // dentro do callback da promise, não no corpo do effect.
  useEffect(() => {
    if (!partyId) return;
    let cancelled = false;
    apiFetchParties()
      .then((parties) => {
        if (cancelled) return;
        const found = parties.find((p) => p.id === partyId);
        if (!found) {
          setAccessDenied(true);
          return;
        }
        setParty(found);
      })
      .catch((err) => console.error('Erro ao carregar calendário:', err));
    return () => {
      cancelled = true;
    };
  }, [partyId]);

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

  const changeView = (next: CalendarView) => {
    setView(next);
    saveView(next);
  };

  const handlePropose = async (date: string, time: string) => {
    if (!party) return;
    try {
      const updated = await apiProposeSession(party.id, { date, time: time || undefined });
      setParty(updated);
    } catch (err) {
      console.error('Erro ao propor sessão:', err);
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
    setSelectedId((current) => (current === proposalId ? null : current));
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
  const selectedProposal = party.sessionProposals.find((p) => p.id === selectedId) ?? null;
  const isAgenda = view === 'agenda';

  const navItems = [
    { id: 'members', label: 'Membros', onClick: () => navigate(`/${system}/party/${partyId}/members`) },
    { id: 'combat', label: 'Combate', onClick: () => navigate(`/${system}/party/${partyId}`) },
    { id: 'calendar', label: 'Calendário', active: true },
  ];

  const viewToggle = (
    <button
      type="button"
      className={styles.viewToggle}
      onClick={() => changeView(isAgenda ? 'list' : 'agenda')}
      title={isAgenda ? 'Ver como lista' : 'Ver como agenda'}
      aria-label={isAgenda ? 'Ver como lista' : 'Ver como agenda'}
    >
      {isAgenda ? <List size={16} /> : <CalendarDays size={16} />}
    </button>
  );

  return (
    <div className={styles.page}>
      <Topbar title={`Grupo - ${party.name}`} />
      <SectionNav items={navItems} rightSlot={viewToggle} />

      <div className={`${styles.content} ${isAgenda ? styles.contentWide : ''}`}>
        <div className={styles.mainCol}>
          {isAgenda ? (
            <SessionAgenda
              party={party}
              onSelectProposal={setSelectedId}
              onSelectSlot={(date, time) => setProposeSlot({ date, time })}
            />
          ) : (
            <ProposalList
              party={party}
              uid={uid}
              isOwner={isOwner}
              onPropose={handlePropose}
              onVote={handleVote}
              onCancel={handleCancel}
            />
          )}
        </div>

        <GroupInfoCard party={party} isOwner={isOwner} />
      </div>

      <ProposalDetailModal
        proposal={selectedProposal}
        party={party}
        uid={uid}
        isOwner={isOwner}
        onClose={() => setSelectedId(null)}
        onVote={handleVote}
        onCancel={handleCancel}
      />

      <ProposeSessionModal
        slot={proposeSlot}
        onClose={() => setProposeSlot(null)}
        onSubmit={handlePropose}
      />
    </div>
  );
}
