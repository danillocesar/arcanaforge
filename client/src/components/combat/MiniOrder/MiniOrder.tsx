import { Fragment } from 'react';
import { useCombatContext } from '../../../contexts/CombatContext';
import { getInitials, getAvatarColor } from '../../../utils/formatters';
import type { CombatRow } from '../../../types/combat';
import styles from './MiniOrder.module.css';

const MAX_VISIBLE = 14;

interface MiniOrderProps {
  rows: CombatRow[];
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
  isCurrentTurn,
}: {
  row: CombatRow;
  isCurrentTurn: boolean;
}) {
  const isPlayer = row.type === 'player';
  const cor = getAvatarColor(row.name);

  return (
    <div className={styles.trackRow}>
      <TimelineMarker active={isCurrentTurn} />
      <div
        className={`${styles.unitCard} ${isPlayer ? styles.unitAlly : styles.unitEnemy} ${isCurrentTurn ? styles.unitActive : ''}`}
        title={row.name}
      >
        <span className={styles.unitRail} aria-hidden />
        <div
          className={styles.unitFace}
          style={
            isPlayer
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
            <img className={styles.unitImg} src={row.avatar} alt={row.name} />
          ) : (
            <span className={styles.unitInitials}>{getInitials(row.name)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MiniOrder({ rows }: MiniOrderProps) {
  const { turnIndex, combatData } = useCombatContext();
  const rodadaBase = combatData.round ?? 1;

  if (!rows || rows.length === 0) return null;

  const n = rows.length;

  if (turnIndex < 0) {
    const visible = rows.slice(0, MAX_VISIBLE);
    return (
      <div className={styles.column}>
        <div className={styles.track}>
          {visible.map((row) => (
            <TrackUnit key={row.id} row={row} isCurrentTurn={false} />
          ))}
        </div>
      </div>
    );
  }

  const slots: { k: number; row: CombatRow }[] = [];
  for (let k = 0; k < MAX_VISIBLE; k++) {
    slots.push({ k, row: rows[(turnIndex + k) % n] });
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
          const realIdx = (turnIndex + k) % n;
          const isRoundStart = k > 0 && realIdx === 0;
          const rodadaNoSeparador = rodadaBase + Math.floor((turnIndex + k) / n);
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
              <TrackUnit row={row} isCurrentTurn={k === 0} />
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
