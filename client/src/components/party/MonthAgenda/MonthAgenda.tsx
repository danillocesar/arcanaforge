import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Party, SessionProposal } from '../../../types/party';
import {
  addMonths,
  buildMonthGrid,
  formatMonthLabel,
  getMonthGrid,
  isSameMonth,
  startOfMonth,
} from '../../../utils/monthAgenda';
import { proposalTone, toDateKey, WEEKDAY_SHORT, type ProposalTone } from '../../../utils/weekAgenda';
import { hasGoogleEventFor } from '../../../utils/googleEvents';
import styles from './MonthAgenda.module.css';

/** Cada dia mostra no máximo 3 linhas de conteúdo: até 3 propostas, cada uma
 *  vira uma pílula; da 4ª em diante, as 2 primeiras viram pílula e o resto
 *  some num "+N" (2 pílulas + 1 "+N" = 3 linhas). */
const MAX_PILLS = 3;
const MAX_PILLS_WITH_OVERFLOW = 2;

const toneClass: Record<ProposalTone, string> = {
  confirmed: styles.pillConfirmed,
  pending: styles.pillPending,
  declined: styles.pillDeclined,
};

interface MonthAgendaProps {
  party: Party;
  uid: string;
  /** Clique numa pílula de proposta. */
  onSelectProposal: (proposalId: string) => void;
  /** Clique num dia vazio: 'YYYY-MM-DD' e uma hora-padrão (o mês não tem hora
   *  para clicar, e deixar em branco geraria um evento de dia inteiro no
   *  Google sem o usuário escolher isso). */
  onSelectSlot: (date: string, time: string) => void;
}

export default function MonthAgenda({ party, uid, onSelectProposal, onSelectSlot }: MonthAgendaProps) {
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => getMonthGrid(anchor), [anchor]);
  const grid = useMemo(() => buildMonthGrid(party.sessionProposals, days), [party.sessionProposals, days]);
  const todayKey = toDateKey(new Date());
  // Os 7 primeiros dias da grade são a primeira semana (segunda a domingo) —
  // servem de cabeçalho sem precisar de outra lista.
  const weekHead = days.slice(0, 7);

  const renderPill = (proposal: SessionProposal) => (
    <button
      key={proposal.id}
      type="button"
      className={`${styles.pill} ${toneClass[proposalTone(party, proposal)]}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectProposal(proposal.id);
      }}
    >
      <span className={styles.pillLabel}>{proposal.time || 's/ hora'}</span>
      {hasGoogleEventFor(proposal, uid) && (
        <CalendarCheck size={9} className={styles.pillSynced} aria-label="Na sua Google Agenda" />
      )}
    </button>
  );

  return (
    <div className={styles.month}>
      <header className={styles.toolbar}>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setAnchor((d) => addMonths(d, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={styles.todayBtn}
            onClick={() => setAnchor(startOfMonth(new Date()))}
          >
            Hoje
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setAnchor((d) => addMonths(d, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <h2 className={styles.range}>{formatMonthLabel(anchor)}</h2>

        <button type="button" className={styles.proposeBtn} onClick={() => onSelectSlot(todayKey, '')}>
          <CalendarPlus size={15} />
          Propor data
        </button>
      </header>

      <div className={styles.headRow}>
        {weekHead.map((day) => (
          <div key={toDateKey(day)} className={styles.dayHead}>
            {WEEKDAY_SHORT[day.getDay()]}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((day) => {
          const key = toDateKey(day);
          const inMonth = isSameMonth(day, anchor);
          const isToday = key === todayKey;
          const dayProposals = grid.get(key) ?? [];
          const hasOverflow = dayProposals.length > MAX_PILLS;
          const visible = dayProposals.slice(0, hasOverflow ? MAX_PILLS_WITH_OVERFLOW : MAX_PILLS);
          const extra = dayProposals.length - visible.length;

          return (
            <div
              key={key}
              className={[styles.cell, !inMonth && styles.cellOutside, isToday && styles.cellToday]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectSlot(key, '15:00')}
            >
              <span className={styles.dayNum}>{day.getDate()}</span>
              <div className={styles.pills}>
                {visible.map(renderPill)}
                {extra > 0 && <span className={styles.more}>+{extra}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
