import { Sparkles, Swords } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import {
  buildDamageSummary,
  calcAttackRoll,
  calcTotalMp,
  formatMod,
} from '../../../utils/calculations';
import { playArrowSound, playSwordSound } from '../../../utils/sounds';
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

    updateCharacter((f) => ({
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
          rangeType: atk.rangeType === 'ranged' ? 'A distancia' : 'Corpo a corpo',
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
      <div className={styles.quickList}>
        <div className={styles.title}>Golpes prontos</div>
        {character.attacks.map((atk, idx) => {
          const roll = calcAttackRoll(character, atk);
          const damage = buildDamageSummary(character, atk);
          const pm = calcTotalMp(atk);

          return (
            <button key={idx} type="button" className={styles.actionRow} onClick={() => useAttack(idx)}>
              <span className={styles.actionIcon}>
                <Swords size={18} aria-hidden="true" />
              </span>
              <span className={styles.actionMain}>
                <strong>{atk.name || 'Ataque'}</strong>
                <span>{formatMod(roll)} no teste</span>
              </span>
              <span className={styles.actionMeta}>
                <span className={styles.damage}>{damage}</span>
                {pm > 0 && <span className={styles.pm}>{pm} PM</span>}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (character.spells.length === 0) return null;

  return (
    <div className={styles.quickList}>
      <div className={styles.title}>Magias prontas</div>
      {character.spells.map((spell, idx) => (
        <button key={idx} type="button" className={styles.actionRow} onClick={() => onCast?.(idx)}>
          <span className={styles.actionIcon}>
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <span className={styles.actionMain}>
            <strong>{spell.name || 'Magia'}</strong>
            <span>{spell.school || 'Escola'} / {spell.castingTime || 'Acao'}</span>
          </span>
          <span className={styles.actionMeta}>
            <span className={styles.pm}>{spell.mpCost} PM</span>
          </span>
        </button>
      ))}
    </div>
  );
}
