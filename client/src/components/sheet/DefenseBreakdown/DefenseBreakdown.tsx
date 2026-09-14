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
  const damageReductions = character.damageReductions ?? [];

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
          onKeyDown={!readOnly ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openEdit('armadura', idx);
            }
          } : undefined}
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

      <div className={styles.popSubHead}>Redução de Dano</div>

      {damageReductions.length > 0 ? (
        damageReductions.map((rd, idx) => (
          <div
            key={idx}
            className={`${styles.popRow} ${!readOnly ? styles.tappable : ''}`}
            onClick={!readOnly ? () => openEdit('rd', idx) : undefined}
            role={!readOnly ? 'button' : undefined}
            tabIndex={!readOnly ? 0 : undefined}
            onKeyDown={!readOnly ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openEdit('rd', idx);
              }
            } : undefined}
          >
            <span>{rd.name || 'Geral'}</span>
            <b>{rd.value}</b>
          </div>
        ))
      ) : (
        <div className={styles.popRow}>
          <span>Nenhuma</span>
          <b>—</b>
        </div>
      )}

      {!readOnly && (
        <div className={styles.addRow}>
          <button type="button" className={styles.btnAdd} onClick={() => openCreate('item')}>
            + Armadura / Item
          </button>
          <button type="button" className={styles.btnAdd} onClick={() => openCreate('rd')}>
            + RD
          </button>
        </div>
      )}
    </div>
  );
}

DefenseBreakdown.displayName = 'DefenseBreakdown';

export default DefenseBreakdown;
