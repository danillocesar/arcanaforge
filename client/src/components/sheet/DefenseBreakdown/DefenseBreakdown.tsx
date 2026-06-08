import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getDefenseBreakdown, formatMod } from '../../../utils/calculations';
import styles from './DefenseBreakdown.module.css';

function DefenseBreakdown() {
  const { character } = useCharacterContext();

  if (!character) return null;

  const { base, items, buffs, total } = getDefenseBreakdown(character);

  return (
    <div className={styles.breakdown}>
      <div className={styles.popH}>Defesa · detalhamento</div>

      <div className={styles.popRow}>
        <span>Base</span>
        <b>{base}</b>
      </div>

      {items.map((row, i) => (
        <div className={styles.popRow} key={`item-${i}`}>
          <span>{row.name}</span>
          <b>{formatMod(row.value)}</b>
        </div>
      ))}

      {buffs.map((row, i) => (
        <div className={styles.popRow} key={`buff-${i}`}>
          <span>{row.name}</span>
          <b>{formatMod(row.value)}</b>
        </div>
      ))}

      <div className={`${styles.popRow} ${styles.tot}`}>
        <span>Defesa total</span>
        <b>{total}</b>
      </div>
    </div>
  );
}

DefenseBreakdown.displayName = 'DefenseBreakdown';

export default DefenseBreakdown;
