import { useState, useRef, useEffect, type RefObject } from 'react';
import { ChevronRight, UserMinus, RefreshCw, UserCheck } from 'lucide-react';
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
  listVariant?: 'active' | 'inactive';
  spectatorMode?: boolean;
}

export default function CombatCard({ row, isActiveTurn, listVariant = 'active', spectatorMode = false }: CombatCardProps) {
  const {
    isMaster,
    partyOwnerUid,
    updateInitiative,
    updateEnemyName,
    removeEnemy,
    applyHpChange,
    updateEnemyMaxHp,
    setCharacterInactive,
    cycleGmVisual,
  } = useCombatContext();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editingMaxHp, setEditingMaxHp] = useState(false);
  const [draftMaxHp, setDraftMaxHp] = useState('');
  const hpBarRef = useRef<HTMLElement>(null);

  const isPartyCharacter = row.type === 'player';
  const visual = row.combatVisual ?? 'ally';
  const showAsEnemyCard = isPartyCharacter && visual === 'enemy';
  const cardLooksPlayer = isPartyCharacter && !showAsEnemyCard;

  const maxHp = row.maxHp || 1;
  const currentHp = row.currentHp || 0;
  const tempHp = row.temporaryHp || 0;
  const hpLabel = `${currentHp}${tempHp > 0 ? ` (+${tempHp})` : ''} / ${maxHp}`;
  const maxMp = row.maxMp || 0;
  const currentMp = row.currentMp || 0;
  const hpPct = hpPercent(currentHp, maxHp);
  const mpPercent = hpPercent(currentMp, maxMp);

  const enemyIndex = !isPartyCharacter
    ? parseInt(row.id.split('_').pop() || '0', 10)
    : undefined;

  const firstClassName = row.classes?.[0]?.name;
  const classIconSrc = firstClassName ? getClassIconUrl(firstClassName) : '';

  const hasAllyStripIcon = isPartyCharacter && !showAsEnemyCard && !!firstClassName;

  useEffect(() => {
    if (!editingMaxHp) setDraftMaxHp(String(row.maxHp ?? 1));
  }, [row.maxHp, editingMaxHp]);

  const highestNumberPercent = row.woundThreshold ?? 60;
  const lowestNumberPercent = row.criticalThreshold ?? 6;

  const isAlertBand = !cardLooksPlayer && hpPct > lowestNumberPercent && hpPct <= highestNumberPercent;
  const isCriticalBand = !cardLooksPlayer && hpPct > 0 && hpPct <= lowestNumberPercent;

  const cardCls = [
    styles.card,
    cardLooksPlayer ? styles.cardPlayer : styles.cardEnemy,
    isActiveTurn ? styles.turn : '',
    isAlertBand ? styles.alert : '',
    isCriticalBand ? styles.critical : '',
  ]
    .filter(Boolean)
    .join(' ');

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

  const showEnemyBars = isPartyCharacter || (isMaster && !spectatorMode);
  const initiativeValue =
    row.initiative === undefined || row.initiative === null ? '' : String(row.initiative);

  const tipoLabel = !isPartyCharacter
    ? 'Inimigo'
    : visual === 'npc'
      ? 'NPC'
      : visual === 'enemy'
        ? 'Inimigo'
        : 'Jogador';

  const canGmStyle =
    isMaster &&
    isPartyCharacter &&
    row.characterId &&
    partyOwnerUid &&
    row.ownerUid === partyOwnerUid;

  return (
    <div className={cardCls}>
      {isActiveTurn && (
        <div className={styles.turnIndicator}>
          <ChevronRight size={16} className={styles.turnIcon} aria-hidden="true" />
          TURNO ATUAL
        </div>
      )}

      <div className={`${styles.avatar} ${cardLooksPlayer ? styles.avatarPlayer : styles.avatarEnemy}`}>
        {row.avatar ? (
          <img className={styles.avatarImg} src={row.avatar} alt="" />
        ) : (
          <span className={styles.avatarInitials}>{getInitials(row.name)}</span>
        )}
      </div>

      {isPartyCharacter && showAsEnemyCard ? (
        <div className={`${styles.classStrip} ${styles.classStripEnemy}`}>{VILLAIN_ICON}</div>
      ) : hasAllyStripIcon ? (
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
      ) : !isPartyCharacter ? (
        <div className={`${styles.classStrip} ${styles.classStripEnemy}`}>{VILLAIN_ICON}</div>
      ) : null}

      <div className={styles.cardTop}>
        <div className={styles.info}>
          <div className={styles.nameRow}>
            {isPartyCharacter ? (
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
            <span
              className={`${styles.tipoTag} ${!isPartyCharacter || visual === 'enemy' ? styles.typeEnemy : styles.typePlayer}`}
            >
              {tipoLabel}
            </span>
            {listVariant === 'active' && (
              <div className={styles.initField}>
                <label>Iniciativa:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={styles.initInput}
                  value={initiativeValue}
                  placeholder="—"
                  onChange={(e) => updateInitiative(row.id, row.type, e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className={`${styles.bars} ${!cardLooksPlayer ? styles.barsEnemy : ''} ${!showEnemyBars ? styles.barsHidden : ''}`}
        >
          {isMaster && !spectatorMode ? (
            <button
              type="button"
              className={`${styles.bar} ${styles.barHp} ${styles.barClickable}`}
              ref={hpBarRef as RefObject<HTMLButtonElement>}
              onClick={() => showEnemyBars && setPopoverOpen(true)}
              aria-label={showEnemyBars ? `Vida: ${currentHp} de ${maxHp}. Ajustar vida.` : 'Ajustar vida'}
            >
              <div className={`${styles.barFill} ${styles.hpFill}`} style={{ width: `${hpPct}%` }} />
              <span className={styles.barLabel}>
                {showEnemyBars ? hpLabel : ''}
              </span>
            </button>
          ) : (
            <div
              className={`${styles.bar} ${styles.barHp}`}
              ref={hpBarRef as RefObject<HTMLDivElement>}
              role="img"
              aria-label={showEnemyBars ? `Vida: ${currentHp} de ${maxHp}` : 'Vida oculta'}
            >
              <div className={`${styles.barFill} ${styles.hpFill}`} style={{ width: `${hpPct}%` }} />
              <span className={styles.barLabel}>
                {showEnemyBars ? hpLabel : ''}
              </span>
            </div>
          )}

          {!isPartyCharacter && isMaster && !spectatorMode && showEnemyBars && (
            <div className={styles.pvMaxEditRow}>
              <span className={styles.pvMaxLabel}>PV total</span>
              {editingMaxHp ? (
                <input
                  type="text"
                  inputMode="numeric"
                  className={styles.pvMaxEditInput}
                  value={draftMaxHp}
                  onChange={(e) => setDraftMaxHp(e.target.value)}
                  onFocus={(e) => e.target.select()}
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

          {isPartyCharacter && maxMp > 0 && (
            <div className={`${styles.bar} ${styles.barPm}`}>
              <div className={`${styles.barFill} ${styles.pmFill}`} style={{ width: `${mpPercent}%` }} />
              <span className={styles.barLabel}>
                {currentMp} / {maxMp}
              </span>
            </div>
          )}
        </div>

        {isMaster && !spectatorMode && isPartyCharacter && row.characterId && (
          <div className={styles.masterActions}>
            {listVariant === 'inactive' ? (
              <button
                type="button"
                className={styles.masterIconBtn}
                title="Reativar na ordem de combate"
                onClick={() => setCharacterInactive(row.characterId!, false)}
              >
                <UserCheck size={20} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                className={styles.masterIconBtn}
                title="Marcar como inativo"
                onClick={() => setCharacterInactive(row.characterId!, true)}
              >
                <UserMinus size={20} aria-hidden />
              </button>
            )}
            {canGmStyle && listVariant === 'active' && (
              <button
                type="button"
                className={styles.masterIconBtn}
                title="Alternar visual: Jogador → NPC → Inimigo"
                onClick={() => cycleGmVisual(row.characterId!)}
              >
                <RefreshCw size={20} aria-hidden />
              </button>
            )}
          </div>
        )}

        {!isPartyCharacter && isMaster && !spectatorMode && (
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

