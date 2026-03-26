import { useState, useRef, useEffect } from 'react';
import { useCombatContext } from '../../../contexts/CombatContext';
import { getInitials } from '../../../utils/formatters';
import { hpPercent } from '../../../utils/calculations';
import { getClassIconUrl } from '../../../features/tormenta/data/tormentaClasses';
import DanoPopover from '../DamagePopover/DamagePopover';
import type { CombatRow } from '../../../types/combat';
import styles from './CombatCard.module.css';

const VILAO_ICON = (
  <svg className={styles.villainIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2C7.58 2 4 5.58 4 10c0 2.76 1.34 5.2 3.4 6.72L6 22h3l1-2h4l1 2h3l-1.4-5.28C18.66 15.2 20 12.76 20 10c0-4.42-3.58-8-8-8zm-2.5 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  </svg>
);

interface CombateCardProps {
  row: CombatRow;
  isTurno: boolean;
}

export default function CombateCard({ row, isTurno }: CombateCardProps) {
  const {
    masterMode,
    updateInitiative,
    updateEnemyName,
    removeEnemy,
    applyHpChange,
    updateEnemyMaxHp,
  } = useCombatContext();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editingPvMax, setEditingPvMax] = useState(false);
  const [draftPvMax, setDraftPvMax] = useState('');
  const hpBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editingPvMax) setDraftPvMax(String(row.maxHp ?? 1));
  }, [row.maxHp, editingPvMax]);

  const isJogador = row.type === 'player';
  const pvMax = row.maxHp || 1;
  const pvAtual = row.currentHp || 0;
  const pmMax = row.maxMp || 0;
  const pmAtual = row.currentMp || 0;
  const hpPct = hpPercent(pvAtual, pvMax);
  const pmPct = hpPercent(pmAtual, pmMax);

  // Faixas de PV restante (% do máximo): amarelo 48–76%, vermelho 6–28%
  const isAlerta = !isJogador && hpPct >= 48 && hpPct <= 76;
  const isCritico = !isJogador && hpPct >= 6 && hpPct <= 28;

  const inimigoIdx = !isJogador
    ? parseInt(row.id.split('_').pop() || '0', 10)
    : undefined;

  const primeiraClasse = row.classes?.[0]?.name;
  const classeIconSrc = primeiraClasse ? getClassIconUrl(primeiraClasse) : '';

  const cardCls = [
    styles.card,
    isJogador ? styles.cardPlayer : styles.cardEnemy,
    isTurno ? styles.turn : '',
    isAlerta ? styles.alert : '',
    isCritico ? styles.critical : '',
  ].filter(Boolean).join(' ');

  const handleHpApply = async (delta: number) => {
    await applyHpChange(row.type, row.characterId || row.id, inimigoIdx, delta);
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
      updateEnemyMaxHp(inimigoIdx, n);
    }
    setEditingPvMax(false);
  };

  const showEnemyBars = isJogador || masterMode;
  const iniciativaVal =
    row.initiative === undefined || row.initiative === null ? '' : String(row.initiative);

  return (
    <div className={cardCls}>
      {isTurno && <div className={styles.turnIndicator}>▶ TURNO ATUAL</div>}

      <div className={`${styles.avatar} ${isJogador ? styles.avatarPlayer : styles.avatarEnemy}`}>
        {row.avatar ? (
          <img className={styles.avatarImg} src={row.avatar} alt="" />
        ) : (
          <span className={styles.avatarInitials}>{getInitials(row.name)}</span>
        )}
      </div>

      {isJogador && primeiraClasse ? (
        <div className={styles.classStrip}>
          <img
            className={styles.classIcon}
            src={classeIconSrc}
            alt=""
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : !isJogador ? (
        <div className={`${styles.classStrip} ${styles.classStripEnemy}`}>{VILAO_ICON}</div>
      ) : null}

      <div className={styles.cardTop}>
        <div className={styles.info}>
          <div className={styles.nameRow}>
            {isJogador ? (
              <span className={styles.name}>{row.name}</span>
            ) : (
              <input
                className={styles.nameInput}
                value={row.name}
                onChange={(e) => inimigoIdx !== undefined && updateEnemyName(inimigoIdx, e.target.value)}
              />
            )}
          </div>
          <div className={styles.meta}>
            <span className={`${styles.tipoTag} ${isJogador ? styles.typePlayer : styles.typeEnemy}`}>
              {isJogador ? 'Jogador' : 'Inimigo'}
            </span>
            <div className={styles.initField}>
              <label>Iniciativa:</label>
              <input
                type="number"
                className={styles.initInput}
                value={iniciativaVal}
                placeholder="—"
                onChange={(e) => updateInitiative(row.id, row.type, e.target.value)}
              />
            </div>
          </div>
        </div>

        <div
          className={`${styles.bars} ${!isJogador ? styles.barsEnemy : ''} ${!showEnemyBars ? styles.barsHidden : ''}`}
        >
          <div
            className={`${styles.bar} ${styles.barHp} ${masterMode ? styles.barClickable : ''}`}
            ref={hpBarRef}
            onClick={() => masterMode && showEnemyBars && setPopoverOpen(true)}
            role="presentation"
          >
            <div className={`${styles.barFill} ${styles.hpFill}`} style={{ width: `${hpPct}%` }} />
            <span className={styles.barLabel}>
              {showEnemyBars ? `${pvAtual} / ${pvMax}` : ''}
            </span>
          </div>

          {!isJogador && masterMode && showEnemyBars && (
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

        {!isJogador && masterMode && (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => inimigoIdx !== undefined && removeEnemy(inimigoIdx)}
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
