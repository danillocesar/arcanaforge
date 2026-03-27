import { useState, useRef, useEffect } from 'react';
import { useCombatContext } from '../../../contexts/CombatContext';
import { getInitials } from '../../../utils/formatters';
import { hpPercent } from '../../../utils/calculations';
import { getClassIconUrl } from '../../../features/tormenta/data/tormentaClasses';
import DamagePopover from '../DamagePopover/DamagePopover';
import type { CombatRow } from '../../../types/combat';
import styles from './CombatCard.module.css';

const VILLAIN_ICON = (
  <svg className={styles.villainIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2C7.58 2 4 5.58 4 10c0 2.76 1.34 5.2 3.4 6.72L6 22h3l1-2h4l1 2h3l-1.4-5.28C18.66 15.2 20 12.76 20 10c0-4.42-3.58-8-8-8zm-2.5 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  </svg>
);

interface CombatCardProps {
  row: CombatRow;
  isActiveTurn: boolean;
}

export default function CombatCard({ row, isActiveTurn }: CombatCardProps) {
  const {
    isMaster,
    updateInitiative,
    updateEnemyName,
    removeEnemy,
    applyHpChange,
    updateEnemyMaxHp,
  } = useCombatContext();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editingMaxHp, setEditingMaxHp] = useState(false);
  const [draftMaxHp, setDraftMaxHp] = useState('');
  const hpBarRef = useRef<HTMLDivElement>(null);

  const isPlayer = row.type === 'player';
  const maxHp = row.maxHp || 1;
  const currentHp = row.currentHp || 0;
  const maxMp = row.maxMp || 0;
  const currentMp = row.currentMp || 0;
  const hpPct = hpPercent(currentHp, maxHp);
  const mpPercent = hpPercent(currentMp, maxMp);

  const enemyIndex = !isPlayer
    ? parseInt(row.id.split('_').pop() || '0', 10)
    : undefined;

  const firstClassName = row.classes?.[0]?.name;
  const classIconSrc = firstClassName ? getClassIconUrl(firstClassName) : '';

  useEffect(() => {
    if (!editingMaxHp) setDraftMaxHp(String(row.maxHp ?? 1));
  }, [row.maxHp, editingMaxHp]);

  // HP band thresholds (% of max): yellow 48–76%, red 6–28%
  const isAlertBand = !isPlayer && hpPct >= 48 && hpPct <= 76;
  const isCriticalBand = !isPlayer && hpPct >= 6 && hpPct <= 28;

  const cardCls = [
    styles.card,
    isPlayer ? styles.cardPlayer : styles.cardEnemy,
    isActiveTurn ? styles.turn : '',
    isAlertBand ? styles.alert : '',
    isCriticalBand ? styles.critical : '',
  ].filter(Boolean).join(' ');

  const handleHpApply = async (delta: number) => {
    await applyHpChange(row.type, row.characterId || row.id, enemyIndex, delta);
    setPopoverOpen(false);
  };

  const startEditMaxHp = () => {
    if (enemyIndex === undefined) return;
    setDraftMaxHp(String(maxHp));
    setEditingMaxHp(true);
  };

  const commitMaxHp = () => {
    if (enemyIndex === undefined) return;
    const n = Math.floor(Number(draftMaxHp));
    if (!Number.isNaN(n) && n >= 1) {
      updateEnemyMaxHp(enemyIndex, n);
    }
    setEditingMaxHp(false);
  };

  const showEnemyBars = isPlayer || isMaster;
  const initiativeValue =
    row.initiative === undefined || row.initiative === null ? '' : String(row.initiative);

  return (
    <div className={cardCls}>
      {isActiveTurn && <div className={styles.turnIndicator}>▶ TURNO ATUAL</div>}

      <div className={`${styles.avatar} ${isPlayer ? styles.avatarPlayer : styles.avatarEnemy}`}>
        {row.avatar ? (
          <img className={styles.avatarImg} src={row.avatar} alt="" />
        ) : (
          <span className={styles.avatarInitials}>{getInitials(row.name)}</span>
        )}
      </div>

      {isPlayer && firstClassName ? (
        <div className={styles.classStrip}>
          <img
            className={styles.classIcon}
            src={classIconSrc}
            alt=""
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : !isPlayer ? (
        <div className={`${styles.classStrip} ${styles.classStripEnemy}`}>{VILLAIN_ICON}</div>
      ) : null}

      <div className={styles.cardTop}>
        <div className={styles.info}>
          <div className={styles.nameRow}>
            {isPlayer ? (
              <span className={styles.name}>{row.name}</span>
            ) : (
              <input
                className={styles.nameInput}
                value={row.name}
                onChange={(e) => enemyIndex !== undefined && updateEnemyName(enemyIndex, e.target.value)}
              />
            )}
          </div>
          <div className={styles.meta}>
            <span className={`${styles.tipoTag} ${isPlayer ? styles.typePlayer : styles.typeEnemy}`}>
              {isPlayer ? 'Jogador' : 'Inimigo'}
            </span>
            <div className={styles.initField}>
              <label>Iniciativa:</label>
              <input
                type="number"
                className={styles.initInput}
                value={initiativeValue}
                placeholder="—"
                onChange={(e) => updateInitiative(row.id, row.type, e.target.value)}
              />
            </div>
          </div>
        </div>

        <div
          className={`${styles.bars} ${!isPlayer ? styles.barsEnemy : ''} ${!showEnemyBars ? styles.barsHidden : ''}`}
        >
          <div
            className={`${styles.bar} ${styles.barHp} ${isMaster ? styles.barClickable : ''}`}
            ref={hpBarRef}
            onClick={() => isMaster && showEnemyBars && setPopoverOpen(true)}
            role="presentation"
          >
            <div className={`${styles.barFill} ${styles.hpFill}`} style={{ width: `${hpPct}%` }} />
            <span className={styles.barLabel}>
              {showEnemyBars ? `${currentHp} / ${maxHp}` : ''}
            </span>
          </div>

          {!isPlayer && isMaster && showEnemyBars && (
            <div className={styles.pvMaxEditRow}>
              <span className={styles.pvMaxLabel}>PV total</span>
              {editingMaxHp ? (
                <input
                  type="number"
                  className={styles.pvMaxEditInput}
                  min={1}
                  value={draftMaxHp}
                  onChange={(e) => setDraftMaxHp(e.target.value)}
                  onBlur={commitMaxHp}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitMaxHp();
                    if (e.key === 'Escape') setEditingMaxHp(false);
                  }}
                  autoFocus
                />
              ) : (
                <>
                  <span className={styles.pvMaxValue}>{maxHp}</span>
                  <button
                    type="button"
                    className={styles.editPencil}
                    onClick={startEditMaxHp}
                    title="Editar PV total"
                  >
                    ✎
                  </button>
                </>
              )}
            </div>
          )}

          {isPlayer && maxMp > 0 && (
            <div className={`${styles.bar} ${styles.barPm}`}>
              <div className={`${styles.barFill} ${styles.pmFill}`} style={{ width: `${mpPercent}%` }} />
              <span className={styles.barLabel}>
                {currentMp} / {maxMp}
              </span>
            </div>
          )}
        </div>

        {!isPlayer && isMaster && (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => enemyIndex !== undefined && removeEnemy(enemyIndex)}
            title="Remover"
          >
            ✕
          </button>
        )}
      </div>

      {popoverOpen && showEnemyBars && (
        <DamagePopover
          barRef={hpBarRef}
          onApply={handleHpApply}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </div>
  );
}
