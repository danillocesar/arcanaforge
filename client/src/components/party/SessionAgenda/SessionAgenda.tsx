import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Party, SessionProposal } from '../../../types/party';
import {
  addDays,
  buildWeekGrid,
  cellKey,
  formatWeekRange,
  getWeekDays,
  initialScrollHour,
  proposalTone,
  toDateKey,
  WEEKDAY_SHORT,
  type ProposalTone,
} from '../../../utils/weekAgenda';
import { hasGoogleEventFor } from '../../../utils/googleEvents';
import styles from './SessionAgenda.module.css';

/** Altura de uma linha de hora. Espelha --hour-h no CSS: as duas precisam bater
 *  para o scroll inicial cair na hora certa. */
const HOUR_HEIGHT = 44;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

const toneClass: Record<ProposalTone, string> = {
  confirmed: styles.blockConfirmed,
  pending: styles.blockPending,
  declined: styles.blockDeclined,
};

interface SessionAgendaProps {
  party: Party;
  uid: string;
  /** Clique num bloco de proposta. */
  onSelectProposal: (proposalId: string) => void;
  /** Clique numa célula vazia: dia 'YYYY-MM-DD' e hora 'HH:mm' (ou '' na faixa sem horário). */
  onSelectSlot: (date: string, time: string) => void;
}

export default function SessionAgenda({ party, uid, onSelectProposal, onSelectSlot }: SessionAgendaProps) {
  const [anchor, setAnchor] = useState(() => new Date());
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);
  const grid = useMemo(() => buildWeekGrid(party.sessionProposals, weekDays), [party.sessionProposals, weekDays]);
  const todayKey = toDateKey(new Date());

  // Abre a semana já na altura da primeira sessão proposta (ou no início da noite).
  const weekStartKey = toDateKey(weekDays[0]);
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = initialScrollHour(grid) * HOUR_HEIGHT;
    // Depende só da semana: rolar de novo a cada voto seria desorientador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartKey]);

  const renderBlock = (proposal: SessionProposal) => (
    <button
      key={proposal.id}
      type="button"
      className={`${styles.block} ${toneClass[proposalTone(party, proposal)]}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectProposal(proposal.id);
      }}
    >
      {proposal.time && <span className={styles.blockTime}>{proposal.time}</span>}
      <span className={styles.blockLabel}>
        Sessão
        {hasGoogleEventFor(proposal, uid) && (
          <CalendarCheck size={10} className={styles.blockSynced} aria-label="Na sua Google Agenda" />
        )}
      </span>
    </button>
  );

  return (
    <div className={styles.agenda}>
      <header className={styles.toolbar}>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setAnchor((d) => addDays(d, -7))}
            aria-label="Semana anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button type="button" className={styles.todayBtn} onClick={() => setAnchor(new Date())}>
            Hoje
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setAnchor((d) => addDays(d, 7))}
            aria-label="Próxima semana"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <h2 className={styles.range}>{formatWeekRange(weekDays)}</h2>

        <button
          type="button"
          className={styles.proposeBtn}
          onClick={() => onSelectSlot(todayKey, '')}
        >
          <CalendarPlus size={15} />
          Propor data
        </button>
      </header>

      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.rows}>
          <div className={`${styles.row} ${styles.headRow}`}>
            <div className={styles.gutter} />
            {weekDays.map((day) => {
              const key = toDateKey(day);
              return (
                <div
                  key={key}
                  className={`${styles.dayHead} ${key === todayKey ? styles.dayHeadToday : ''}`}
                >
                  <span className={styles.dayName}>{WEEKDAY_SHORT[day.getDay()]}</span>
                  <span className={styles.dayNum}>{day.getDate()}</span>
                </div>
              );
            })}
          </div>

          <div className={`${styles.row} ${styles.allDayRow}`}>
            <div className={`${styles.gutter} ${styles.gutterLabel}`}>s/ hora</div>
            {weekDays.map((day) => {
              const key = toDateKey(day);
              return (
                <div
                  key={key}
                  className={`${styles.cell} ${key === todayKey ? styles.cellToday : ''}`}
                  onClick={() => onSelectSlot(key, '')}
                >
                  {grid.allDay.get(key)?.map(renderBlock)}
                </div>
              );
            })}
          </div>

          {HOURS.map((hour) => (
            <div key={hour} className={styles.row}>
              <div className={`${styles.gutter} ${styles.gutterLabel}`}>
                {String(hour).padStart(2, '0')}h
              </div>
              {weekDays.map((day) => {
                const key = toDateKey(day);
                return (
                  <div
                    key={key}
                    className={`${styles.cell} ${key === todayKey ? styles.cellToday : ''}`}
                    onClick={() => onSelectSlot(key, `${String(hour).padStart(2, '0')}:00`)}
                  >
                    {grid.timed.get(cellKey(key, hour))?.map(renderBlock)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
