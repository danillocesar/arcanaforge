import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetchParties, apiProposeSession, apiRespondToSession, apiCancelSession } from '../../api';
import type { Party } from '../../types/party';
import { migrateCalendarView, type CalendarView } from '../../utils/calendarView';
import { useAuth } from '../../features/auth';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { WsMessage } from '../../hooks/useWebSocket';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import Skeleton from '../../components/ui/Skeleton/Skeleton';
import SegmentedControl from '../../components/ui/SegmentedControl/SegmentedControl';
import GroupInfoCard from '../../components/party/GroupInfoCard/GroupInfoCard';
import MonthAgenda from '../../components/party/MonthAgenda/MonthAgenda';
import SessionAgenda from '../../components/party/SessionAgenda/SessionAgenda';
import ProposalList from '../../components/party/ProposalList/ProposalList';
import ProposalDetailModal from '../../components/party/ProposalDetailModal/ProposalDetailModal';
import ProposeSessionModal, {
  type ProposeSlot,
} from '../../components/party/ProposeSessionModal/ProposeSessionModal';
import styles from './PartyCalendarPage.module.css';

const VIEW_KEY = 'arcanaforge:calendarView';

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'mes', label: 'Mês' },
  { value: 'semana', label: 'Semana' },
  { value: 'lista', label: 'Lista' },
];

// A grade semanal (24h) virou a de 10h-22h e ganhou companhia do mês; o nome
// da chave antiga ('agenda') não descreve mais qual grade era. Migra o valor
// salvo para o novo vocabulário e regrava, para a chave antiga não persistir.
function loadView(): CalendarView {
  try {
    const stored = localStorage.getItem(VIEW_KEY);
    const migrated = migrateCalendarView(stored);
    if (migrated !== stored) saveView(migrated);
    return migrated;
  } catch {
    return 'mes';
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
  // Proposta com requisição de voto/cancelamento em voo. Mesmo padrão do
  // `busy` do GoogleCalendarLink e do `submitting` do ProposalList: enquanto
  // não for null, os botões de voto e de cancelar ficam desabilitados.
  const [pendingProposalId, setPendingProposalId] = useState<string | null>(null);

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

  // O retorno do consentimento do Google (`?google=ok|error`) é lido pelo
  // GroupInfoCard, que é onde o botão Conectar vive e que também aparece na
  // aba Membros — de onde a pessoa pode ter saído para o Google.

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

  // Guarda de in-flight. Duas requisições de voto sobrepostas leem o mesmo
  // estado no server e, quando a proposta cruza para confirmada, cada uma faz
  // o fan-out inteiro: dois eventos de verdade na Google Agenda de cada membro
  // por um duplo clique. Isto estreita a janela no cliente; a corrida em si é
  // do server e continua aberta lá.
  const handleVote = async (proposalId: string, vote: 'sim' | 'nao') => {
    if (!party || pendingProposalId) return;
    setPendingProposalId(proposalId);
    try {
      const updated = await apiRespondToSession(party.id, proposalId, vote);
      setParty(updated);
    } catch (err) {
      console.error('Erro ao votar:', err);
    } finally {
      setPendingProposalId(null);
    }
  };

  const handleCancel = async (proposalId: string) => {
    if (!party || pendingProposalId) return;
    setPendingProposalId(proposalId);
    setSelectedId((current) => (current === proposalId ? null : current));
    try {
      const updated = await apiCancelSession(party.id, proposalId);
      setParty(updated);
    } catch (err) {
      console.error('Erro ao cancelar proposta:', err);
    } finally {
      setPendingProposalId(null);
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
  // As duas grades (mês e semana) precisam da largura extra; só a lista cabe
  // na coluna estreita.
  const isWideView = view !== 'lista';

  const navItems = [
    { id: 'members', label: 'Membros', onClick: () => navigate(`/${system}/party/${partyId}/members`) },
    { id: 'combat', label: 'Combate', onClick: () => navigate(`/${system}/party/${partyId}`) },
    { id: 'calendar', label: 'Calendário', active: true },
  ];

  const viewSwitch = <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={(v) => changeView(v as CalendarView)} />;

  return (
    <div className={styles.page}>
      <Topbar title={`Grupo - ${party.name}`} />
      <SectionNav items={navItems} rightSlot={viewSwitch} />

      <div className={`${styles.content} ${isWideView ? styles.contentWide : ''}`}>
        <div className={styles.mainCol}>
          {view === 'mes' && (
            <MonthAgenda
              party={party}
              uid={uid}
              onSelectProposal={setSelectedId}
              onSelectSlot={(date, time) => setProposeSlot({ date, time })}
            />
          )}
          {view === 'semana' && (
            <SessionAgenda
              party={party}
              uid={uid}
              onSelectProposal={setSelectedId}
              onSelectSlot={(date, time) => setProposeSlot({ date, time })}
            />
          )}
          {view === 'lista' && (
            <ProposalList
              party={party}
              uid={uid}
              isOwner={isOwner}
              onPropose={handlePropose}
              onVote={handleVote}
              onCancel={handleCancel}
              pendingProposalId={pendingProposalId}
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
        pendingProposalId={pendingProposalId}
      />

      <ProposeSessionModal
        slot={proposeSlot}
        onClose={() => setProposeSlot(null)}
        onSubmit={handlePropose}
      />
    </div>
  );
}
