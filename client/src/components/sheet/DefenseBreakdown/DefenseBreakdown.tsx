import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getDefenseBreakdown, formatMod } from '../../../utils/calculations';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import Stepper from '../../ui/Stepper/Stepper';
import styles from './DefenseBreakdown.module.css';

function DefenseBreakdown() {
  const { character, updateCharacter, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();

  if (!character) return null;

  const { base, dexterity, buffs, total } = getDefenseBreakdown(character);

  const setBase = (val: number) =>
    updateCharacter((f) => ({ ...f, defense: { ...f.defense, base: val } }));

  return (
    <div className={styles.breakdown}>
      <div className={styles.popH}>Defesa · detalhamento</div>

      <div className={styles.popRow}>
        <span>Base</span>
        {!readOnly ? (
          <Stepper value={base} onChange={setBase} step={1} className={styles.stepper} />
        ) : (
          <b>{base}</b>
        )}
      </div>

      <div className={styles.popRow}>
        <span>Destreza</span>
        <b>{formatMod(dexterity)}</b>
      </div>

      {(character.defense?.items ?? []).map((arm, idx) => (
        <div
          key={idx}
          className={`${styles.popRow} ${!readOnly ? styles.tappable : ''}`}
          onClick={!readOnly ? () => openEdit('armadura', idx) : undefined}
          role={!readOnly ? 'button' : undefined}
          tabIndex={!readOnly ? 0 : undefined}
        >
          <span>{arm.name || 'Armadura'}</span>
          <b>{formatMod(arm.value)}</b>
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

      <div className={styles.popRow}>
        <span>Redução de Dano</span>
        {!readOnly ? (
          <Stepper
            value={character.damageReduction}
            onChange={(v) => updateCharacter((f) => ({ ...f, damageReduction: v }))}
            step={1}
            min={0}
            className={styles.stepper}
          />
        ) : (
          <b>{character.damageReduction || '—'}</b>
        )}
      </div>

      {!readOnly && (
        <button
          type="button"
          className={styles.btnAdd}
          onClick={() => openCreate('item')}
        >
          + Armadura / Item
        </button>
      )}
    </div>
  );
}

DefenseBreakdown.displayName = 'DefenseBreakdown';

export default DefenseBreakdown;
