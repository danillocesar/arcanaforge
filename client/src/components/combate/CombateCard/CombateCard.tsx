import { useState, useRef, useEffect } from 'react';
import { useCombateContext } from '../../../contexts/CombateContext';
import { getInitials } from '../../../utils/formatters';
import { pvPercent } from '../../../utils/calculations';
import { getClasseIconUrl } from '../../../features/tormenta/data/classesTormenta';
import DanoPopover from '../DanoPopover/DanoPopover';
import type { CombateRow } from '../../../types/combate';
import styles from './CombateCard.module.css';

const VILAO_ICON = (
  <svg className={styles.vilaoIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2C7.58 2 4 5.58 4 10c0 2.76 1.34 5.2 3.4 6.72L6 22h3l1-2h4l1 2h3l-1.4-5.28C18.66 15.2 20 12.76 20 10c0-4.42-3.58-8-8-8zm-2.5 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  </svg>
);

interface CombateCardProps {
  row: CombateRow;
  isTurno: boolean;
}

export default function CombateCard({ row, isTurno }: CombateCardProps) {
  const {
    modoMestre,
    updateIniciativa,
    updateInimigoNome,
    removerInimigo,
    aplicarHpChange,
    updateInimigoPvMax,
  } = useCombateContext();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editingPvMax, setEditingPvMax] = useState(false);
  const [draftPvMax, setDraftPvMax] = useState('');
  const hpBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editingPvMax) setDraftPvMax(String(row.pvMax ?? 1));
  }, [row.pvMax, editingPvMax]);

  const isJogador = row.tipo === 'jogador';
  const pvMax = row.pvMax || 1;
  const pvAtual = row.pvAtual || 0;
  const pmMax = row.pmMax || 0;
  const pmAtual = row.pmAtual || 0;
  const hpPct = pvPercent(pvAtual, pvMax);
  const pmPct = pvPercent(pmAtual, pmMax);

  // Faixas de PV restante (% do máximo): amarelo 48–76%, vermelho 6–28%
  const isAlerta = !isJogador && hpPct >= 48 && hpPct <= 76;
  const isCritico = !isJogador && hpPct >= 6 && hpPct <= 28;

  const inimigoIdx = !isJogador
    ? parseInt(row.id.split('_').pop() || '0', 10)
    : undefined;

  const primeiraClasse = row.classes?.[0]?.nome;
  const classeIconSrc = primeiraClasse ? getClasseIconUrl(primeiraClasse) : '';

  const cardCls = [
    styles.card,
    isJogador ? styles.cardJogador : styles.cardInimigo,
    isTurno ? styles.turno : '',
    isAlerta ? styles.alerta : '',
    isCritico ? styles.critico : '',
  ].filter(Boolean).join(' ');

  const handleHpApply = async (delta: number) => {
    await aplicarHpChange(row.tipo, row.fichaId || row.id, inimigoIdx, delta);
    setPopoverOpen(false);
  };

  const startEditPvMax = () => {
    if (inimigoIdx === undefined) return;
    setDraftPvMax(String(pvMax));
    setEditingPvMax(true);
  };

  const commitPvMax = () => {
    if (inimigoIdx === undefined) return;
    const n = Math.floor(Number(draftPvMax));
    if (!Number.isNaN(n) && n >= 1) {
      updateInimigoPvMax(inimigoIdx, n);
    }
    setEditingPvMax(false);
  };

  const showEnemyBars = isJogador || modoMestre;
  const iniciativaVal =
    row.iniciativa === undefined || row.iniciativa === null ? '' : String(row.iniciativa);

  return (
    <div className={cardCls}>
      {isTurno && <div className={styles.turnoIndicator}>▶ TURNO ATUAL</div>}

      <div className={`${styles.avatar} ${isJogador ? styles.avatarJogador : styles.avatarInimigo}`}>
        {row.avatar ? (
          <img className={styles.avatarImg} src={row.avatar} alt="" />
        ) : (
          <span className={styles.avatarInitials}>{getInitials(row.nome)}</span>
        )}
      </div>

      {isJogador && primeiraClasse ? (
        <div className={styles.classeStrip}>
          <img
            className={styles.classeIcon}
            src={classeIconSrc}
            alt=""
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : !isJogador ? (
        <div className={`${styles.classeStrip} ${styles.classeStripInimigo}`}>{VILAO_ICON}</div>
      ) : null}

      <div className={styles.cardTop}>
        <div className={styles.info}>
          <div className={styles.nameRow}>
            {isJogador ? (
              <span className={styles.name}>{row.nome}</span>
            ) : (
              <input
                className={styles.nameInput}
                value={row.nome}
                onChange={(e) => inimigoIdx !== undefined && updateInimigoNome(inimigoIdx, e.target.value)}
              />
            )}
          </div>
          <div className={styles.meta}>
            <span className={`${styles.tipoTag} ${isJogador ? styles.tipoJogador : styles.tipoInimigo}`}>
              {isJogador ? 'Jogador' : 'Inimigo'}
            </span>
            <div className={styles.inicField}>
              <label>Iniciativa:</label>
              <input
                type="number"
                className={styles.inicInput}
                value={iniciativaVal}
                placeholder="—"
                onChange={(e) => updateIniciativa(row.id, row.tipo, e.target.value)}
              />
            </div>
          </div>
        </div>

        <div
          className={`${styles.bars} ${!isJogador ? styles.barsInimigo : ''} ${!showEnemyBars ? styles.barsHidden : ''}`}
        >
          <div
            className={`${styles.bar} ${styles.barHp} ${modoMestre ? styles.barClickable : ''}`}
            ref={hpBarRef}
            onClick={() => modoMestre && showEnemyBars && setPopoverOpen(true)}
            role="presentation"
          >
            <div className={`${styles.barFill} ${styles.hpFill}`} style={{ width: `${hpPct}%` }} />
            <span className={styles.barLabel}>
              {showEnemyBars ? `${pvAtual} / ${pvMax}` : ''}
            </span>
          </div>

          {!isJogador && modoMestre && showEnemyBars && (
            <div className={styles.pvMaxEditRow}>
              <span className={styles.pvMaxLabel}>PV total</span>
              {editingPvMax ? (
                <input
                  type="number"
                  className={styles.pvMaxEditInput}
                  min={1}
                  value={draftPvMax}
                  onChange={(e) => setDraftPvMax(e.target.value)}
                  onBlur={commitPvMax}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitPvMax();
                    if (e.key === 'Escape') setEditingPvMax(false);
                  }}
                  autoFocus
                />
              ) : (
                <>
                  <span className={styles.pvMaxValue}>{pvMax}</span>
                  <button
                    type="button"
                    className={styles.editPencil}
                    onClick={startEditPvMax}
                    title="Editar PV total"
                  >
                    ✎
                  </button>
                </>
              )}
            </div>
          )}

          {isJogador && pmMax > 0 && (
            <div className={`${styles.bar} ${styles.barPm}`}>
              <div className={`${styles.barFill} ${styles.pmFill}`} style={{ width: `${pmPct}%` }} />
              <span className={styles.barLabel}>
                {pmAtual} / {pmMax}
              </span>
            </div>
          )}
        </div>

        {!isJogador && modoMestre && (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => inimigoIdx !== undefined && removerInimigo(inimigoIdx)}
            title="Remover"
          >
            ✕
          </button>
        )}
      </div>

      {popoverOpen && showEnemyBars && (
        <DanoPopover
          barRef={hpBarRef}
          onApply={handleHpApply}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </div>
  );
}
