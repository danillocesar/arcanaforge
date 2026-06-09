import { useCharacterContext } from '../../../contexts/CharacterContext';
import {
  formatMod,
  calcAttackRoll,
  buildDamageSummary,
  calcTotalMp,
} from '../../../utils/calculations';
import { playSwordSound, playArrowSound } from '../../../utils/sounds';
import { triggerAttackAnim } from '../../../utils/animations';
import type { Attack } from '../../../types/character';
import Card from '../../ui/Card/Card';
import styles from './ActionCard.module.css';

interface ActionCardProps {
  attack: Attack;
  index: number;
  onEdit?: (index: number) => void;
}

/**
 * Read-presentation weapon card for the "C dark" sheet. Shows attack/dano/crítico
 * (and PM when > 0) and a "🎲 Rolar ataque" play action.
 *
 * The roll flow is the SAME mechanism used by the legacy AttackCard.useAttack:
 * spend the attack's total MP, append an 'attack' log entry, play the sword/arrow
 * SFX and fire the toast animation via triggerAttackAnim('toast'). We reuse the
 * combat selectors (calcAttackRoll / buildDamageSummary / calcTotalMp) — no new
 * dice engine is invented.
 */
function ActionCard({ attack, index, onEdit }: ActionCardProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  const attackRollTotal = calcAttackRoll(character, attack);
  const damageSummary = buildDamageSummary(character, attack);
  const pmTotal = calcTotalMp(attack);
  const rangeLabel = attack.rangeType === 'ranged' ? 'À distância' : 'Corpo a corpo';

  const rollAttack = () => {
    if (readOnly) return;
    const pm = pmTotal;
    updateCharacter((f) => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - pm) },
      logs: [
        ...f.logs,
        {
          type: 'attack',
          name: attack.name || 'Ataque',
          mpSpent: pm,
          timestamp: Date.now(),
          details: {
            attackRoll: attackRollTotal,
            damage: damageSummary,
            rangeType: rangeLabel,
          },
        },
      ],
    }));

    if (attack.rangeType === 'ranged') {
      playArrowSound();
    } else {
      playSwordSound();
    }

    triggerAttackAnim('toast', {
      type: attack.rangeType === 'ranged' ? 'ranged' : 'melee',
      name: attack.name || 'Ataque',
      mpCost: pm,
    });
  };

  const removeAttack = () => {
    updateCharacter((f) => ({
      ...f,
      attacks: f.attacks.filter((_, i) => i !== index),
    }));
  };

  return (
    <Card padding={false} className={styles.weapon}>
      <div className={styles.top}>
        <div className={styles.wname}>
          <h3>{attack.name || 'Arma sem nome'}</h3>
          <span>{rangeLabel}</span>
        </div>
        {!readOnly && (
          <button type="button" className={styles.pen} aria-label="Editar" onClick={() => onEdit?.(index)}>✎</button>
        )}
        {!readOnly && (
          <button type="button" className={styles.rmX} onClick={removeAttack} aria-label="Remover">×</button>
        )}
      </div>

      <div className={styles.stats}>
        <div>
          <span>Ataque</span>
          <b>{formatMod(attackRollTotal)}</b>
        </div>
        <div>
          <span>Dano</span>
          <b>{damageSummary}</b>
        </div>
        <div>
          <span>Crítico</span>
          <b>{attack.critical || '—'}</b>
        </div>
        {pmTotal > 0 && (
          <div>
            <span>PM</span>
            <b>{pmTotal}</b>
          </div>
        )}
      </div>

      {!readOnly && (
        <button type="button" className={styles.btnRoll} onClick={rollAttack}>
          🎲 Rolar ataque
        </button>
      )}

    </Card>
  );
}

ActionCard.displayName = 'ActionCard';

export default ActionCard;
