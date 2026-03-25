import { Fragment } from 'react';
import { useCombateContext } from '../../../contexts/CombateContext';
import { getInitials, getAvatarColor } from '../../../utils/formatters';
import type { CombateRow } from '../../../types/combate';
import styles from './MiniOrder.module.css';

const MAX_VISIBLE = 14;

interface MiniOrderProps {
  rows: CombateRow[];
}

function TimelineMarker({ active }: { active: boolean }) {
  return (
    <div className={styles.markerWrap}>
      {active ? (
        <svg className={styles.chevronMarker} viewBox="0 0 10 14" aria-hidden>
          <path
            d="M1.5 1.5l6 5.25-6 5.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span className={styles.dotMarker} aria-hidden />
      )}
    </div>
  );
}

function TrackUnit({
  row,
  isTurno,
}: {
  row: CombateRow;
  isTurno: boolean;
}) {
  const isJogador = row.tipo === 'jogador';
  const cor = getAvatarColor(row.nome);

  return (
    <div className={styles.trackRow}>
      <TimelineMarker active={isTurno} />
      <div
        className={`${styles.unitCard} ${isJogador ? styles.unitAlly : styles.unitEnemy} ${isTurno ? styles.unitActive : ''}`}
        title={row.nome}
      >
        <span className={styles.unitRail} aria-hidden />
        <div
          className={styles.unitFace}
          style={
            isJogador
              ? {
                  background: `linear-gradient(135deg, color-mix(in srgb, ${cor} 18%, transparent) 0%, rgba(15, 20, 28, 0.85) 100%)`,
                }
              : {
                  background:
                    'linear-gradient(135deg, rgba(232, 93, 93, 0.14) 0%, rgba(15, 18, 24, 0.9) 100%)',
                }
          }
        >
          {row.avatar ? (
            <img className={styles.unitImg} src={row.avatar} alt={row.nome} />
          ) : (
            <span className={styles.unitInitials}>{getInitials(row.nome)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MiniOrder({ rows }: MiniOrderProps) {
  const { turnoIdx, mestreData } = useCombateContext();
  const rodadaBase = mestreData.rodada ?? 1;

  if (!rows || rows.length === 0) return null;

  const n = rows.length;

  if (turnoIdx < 0) {
    const visible = rows.slice(0, MAX_VISIBLE);
    return (
      <div className={styles.column}>
        <div className={styles.track}>
          {visible.map((row) => (
            <TrackUnit key={row.id} row={row} isTurno={false} />
          ))}
        </div>
      </div>
    );
  }

  const slots: { k: number; row: CombateRow }[] = [];
  for (let k = 0; k < MAX_VISIBLE; k++) {
    slots.push({ k, row: rows[(turnoIdx + k) % n] });
  }

  return (
    <div className={styles.column}>
      <div className={styles.roundTab} title="Rodada atual do combate">
        <span className={styles.roundTabIcon} aria-hidden>◇</span>
        <div className={styles.roundTabText}>
          <span className={styles.roundTabLabel}>Rodada</span>
          <span className={styles.roundTabNum}>{rodadaBase}</span>
        </div>
      </div>

      <div className={styles.track}>
        {slots.map(({ k, row }) => {
          const realIdx = (turnoIdx + k) % n;
          const isRoundStart = k > 0 && realIdx === 0;
          const rodadaNoSeparador = rodadaBase + Math.floor((turnoIdx + k) / n);
          return (
            <Fragment key={`${row.id}__${k}`}>
              {isRoundStart && (
                <div
                  className={styles.cycleDividerRow}
                  role="separator"
                  aria-label={`Rodada ${rodadaNoSeparador}`}
                >
                  <span className={styles.cycleGapLine} />
                  <div className={styles.cyclePill}>
                    <span className={styles.cyclePillIcon} aria-hidden>↻</span>
                    <span className={styles.cyclePillText}>R{rodadaNoSeparador}</span>
                  </div>
                  <span className={styles.cycleGapLine} />
                </div>
              )}
              <TrackUnit row={row} isTurno={k === 0} />
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
