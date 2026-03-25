import { Fragment } from 'react';
import { useCombateContext } from '../../../contexts/CombateContext';
import { getInitials, getAvatarColor } from '../../../utils/formatters';
import type { CombateRow } from '../../../types/combate';
import styles from './MiniOrder.module.css';

const MAX_MINI_SLOTS = 24;

interface MiniOrderProps {
  rows: CombateRow[];
}

function FlowConnector() {
  return (
    <div className={styles.flowConnector} aria-hidden>
      <span className={styles.flowLine} />
      <svg className={styles.flowArrow} viewBox="0 0 12 8" aria-hidden>
        <path
          d="M2.75 1.75L6 5.25 9.25 1.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function renderMiniItem(row: CombateRow, isTurno: boolean) {
  const cor = getAvatarColor(row.nome);
  const isJogador = row.tipo === 'jogador';
  return (
    <div className={`${styles.item} ${isTurno ? styles.itemTurno : ''}`}>
      <div
        className={`${styles.miniAvatar} ${isJogador ? styles.miniJogador : styles.miniInimigo}`}
        style={
          isJogador
            ? { background: `${cor}20`, borderColor: `${cor}55`, color: cor }
            : undefined
        }
      >
        {row.avatar ? (
          <img className={styles.miniAvatarImg} src={row.avatar} alt={row.nome} />
        ) : (
          getInitials(row.nome)
        )}
      </div>
      <span className={styles.miniName}>{row.nome}</span>
    </div>
  );
}

export default function MiniOrder({ rows }: MiniOrderProps) {
  const { turnoIdx, mestreData } = useCombateContext();
  const rodadaBase = mestreData.rodada ?? 1;

  if (!rows || rows.length === 0) return null;

  const n = rows.length;

  if (turnoIdx < 0) {
    return (
      <div className={`${styles.column} ${styles.columnLinear}`}>
        {rows.map((row) => (
          <Fragment key={row.id}>{renderMiniItem(row, false)}</Fragment>
        ))}
      </div>
    );
  }

  const maxSlots =
    n <= 1 ? Math.min(MAX_MINI_SLOTS, n + 3) : Math.min(MAX_MINI_SLOTS, n * 4);

  const slots: { k: number; row: CombateRow }[] = [];
  for (let k = 0; k < maxSlots; k++) {
    const idx = (turnoIdx + k) % n;
    slots.push({ k, row: rows[idx] });
  }

  return (
    <div className={styles.column}>
      <div className={styles.currentRoundStrip} title="Rodada atual do combate">
        <span className={styles.currentRoundLabel}>Rodada</span>
        <span className={styles.currentRoundNum}>{rodadaBase}</span>
      </div>
      {slots.map(({ k, row }) => {
        const isLapStart = k > 0 && (turnoIdx + k) % n === turnoIdx;
        const lapNum = isLapStart ? Math.floor(k / n) : 0;
        const rodadaNoSeparador = rodadaBase + lapNum;
        return (
          <Fragment key={`${row.id}__${k}`}>
            {k > 0 && <FlowConnector />}
            {isLapStart && (
              <div
                className={styles.cycleDivider}
                role="separator"
                aria-label={`Rodada ${rodadaNoSeparador}`}
              >
                <span className={styles.cycleLine} />
                <div className={styles.cycleBadge}>
                  <span className={styles.cycleIcon} aria-hidden>
                    ↻
                  </span>
                  <span className={styles.cycleRound}>Rodada {rodadaNoSeparador}</span>
                </div>
                <span className={styles.cycleLine} />
              </div>
            )}
            {renderMiniItem(row, k === 0)}
          </Fragment>
        );
      })}
    </div>
  );
}
