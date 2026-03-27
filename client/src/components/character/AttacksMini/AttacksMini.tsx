import { useCharacterContext } from '../../../contexts/CharacterContext';
import {
  formatMod,
  calcAttackRoll,
  buildDamageSummary,
  calcTotalMp,
} from '../../../utils/calculations';
import { playSwordSound, playArrowSound } from '../../../utils/sounds';
import { triggerAttackAnim, type AnimationStyle } from '../../../utils/animations';
import styles from './AttacksMini.module.css';

interface AttacksMiniProps {
  type: 'attacks' | 'spells';
  onCast?: (idx: number) => void;
}

export default function AttacksMini({ type, onCast }: AttacksMiniProps) {
  const { character, updateCharacter } = useCharacterContext();
  if (!character) return null;

  const animationStyle = 'toast' as AnimationStyle;

  const useAttack = (idx: number) => {
    const atk = character.attacks[idx];
    const pm = calcTotalMp(atk);
    updateCharacter(f => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - pm) },
      logs: [...f.logs, {
        type: 'attack',
        name: atk.name || 'Ataque',
        mpSpent: pm,
        timestamp: Date.now(),
        details: {
          attackRoll: calcAttackRoll(f, atk),
          damage: buildDamageSummary(f, atk),
          rangeType: atk.rangeType === 'ranged' ? 'A Distância' : 'Corpo a Corpo',
        },
      }],
    }));

    if (atk.rangeType === 'ranged') {
      playArrowSound();
    } else {
      playSwordSound();
    }
    triggerAttackAnim(animationStyle, {
      type: atk.rangeType === 'ranged' ? 'ranged' : 'melee',
      name: atk.name || 'Ataque',
      mpCost: pm,
    });
  };

  if (type === 'attacks') {
    if (character.attacks.length === 0) return null;
    return (
      <div>
        <div className={styles.title}>Ataques</div>
        {character.attacks.map((atk, idx) => {
          const roll = calcAttackRoll(character, atk);
          const damage = buildDamageSummary(character, atk);
          const pm = calcTotalMp(atk);
          return (
            <div key={idx} className={styles.row}>
              <span className={styles.nome}>{atk.name || '—'}</span>
              <span className={styles.badge}>{formatMod(roll)}</span>
              <span className={`${styles.badge} ${styles.badgeDamage}`}>{damage}</span>
              {pm > 0 && (
                <span className={`${styles.badge} ${styles.badgePm}`}>{pm} PM</span>
              )}
              <button className={styles.useBtn} onClick={() => useAttack(idx)}>⚔</button>
            </div>
          );
        })}
      </div>
    );
  }

  if (character.spells.length === 0) return null;
  return (
    <div>
      <div className={styles.title}>Magias</div>
      {character.spells.map((spell, idx) => (
        <div key={idx} className={styles.row}>
          <span className={styles.nome}>{spell.name || '—'}</span>
          <span className={`${styles.badge} ${styles.badgePm}`}>{spell.mpCost} PM</span>
          <button className={styles.useBtn} onClick={() => onCast?.(idx)}>✨</button>
        </div>
      ))}
    </div>
  );
}
