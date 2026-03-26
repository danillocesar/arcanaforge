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

interface AtaquesMiniProps {
  type: 'attacks' | 'spells';
  onCast?: (idx: number) => void;
}

export default function AtaquesMini({ type, onCast }: AtaquesMiniProps) {
  const { character, updateCharacter } = useCharacterContext();
  if (!character) return null;

  const estilo = 'toast' as AnimationStyle;

  const usarAtaque = (idx: number) => {
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
          teste: calcAttackRoll(f, atk),
          dano: buildDamageSummary(f, atk),
          custoTipo: atk.rangeType === 'ranged' ? 'A Distância' : 'Corpo a Corpo',
        },
      }],
    }));

    if (atk.rangeType === 'ranged') {
      playArrowSound();
    } else {
      playSwordSound();
    }
    triggerAttackAnim(estilo, {
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
          const teste = calcAttackRoll(character, atk);
          const dano = buildDamageSummary(character, atk);
          const pm = calcTotalMp(atk);
          return (
            <div key={idx} className={styles.row}>
              <span className={styles.nome}>{atk.name || '—'}</span>
              <span className={styles.badge}>{formatMod(teste)}</span>
              <span className={`${styles.badge} ${styles.badgeDano}`}>{dano}</span>
              {pm > 0 && (
                <span className={`${styles.badge} ${styles.badgePm}`}>{pm} PM</span>
              )}
              <button className={styles.useBtn} onClick={() => usarAtaque(idx)}>⚔</button>
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
      {character.spells.map((mag, idx) => (
        <div key={idx} className={styles.row}>
          <span className={styles.nome}>{mag.name || '—'}</span>
          <span className={`${styles.badge} ${styles.badgePm}`}>{mag.mpCost} PM</span>
          <button className={styles.useBtn} onClick={() => onCast?.(idx)}>✨</button>
        </div>
      ))}
    </div>
  );
}
