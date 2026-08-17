import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getTotalLevel } from '../../../utils/calculations';
import { TORMENTA_CLASSES } from '../../../features/tormenta/data/tormentaClasses';
import Stepper from '../../ui/Stepper/Stepper';
import styles from './ClassesBreakdown.module.css';

function ClassesBreakdown() {
  const { character, updateCharacter, readOnly } = useCharacterContext();
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);

  if (!character) return null;

  const classes = character.classes ?? [];
  const totalLevel = getTotalLevel(character);

  const updateClass = (idx: number, key: 'name' | 'level', value: string | number) => {
    updateCharacter((f) => {
      const next = [...f.classes];
      const prevLevel = Number(next[idx].level) || 0;
      next[idx] = { ...next[idx], [key]: value };

      if (key !== 'level') return { ...f, classes: next };

      const newLevel = Number(value) || 0;
      if (newLevel <= prevLevel) return { ...f, classes: next };

      const className = next[idx].name?.trim() || 'Classe';
      const gained: string[] = [];
      for (let lvl = prevLevel + 1; lvl <= newLevel; lvl++) {
        gained.push(`${className} nível ${lvl}`);
      }
      return { ...f, classes: next, progression: [...f.progression, ...gained] };
    });
  };

  const addClass = () => {
    updateCharacter((f) => ({ ...f, classes: [...f.classes, { name: '', level: 1 }] }));
  };

  const removeClass = (idx: number) => {
    updateCharacter((f) => {
      const next = f.classes.filter((_, i) => i !== idx);
      return { ...f, classes: next.length ? next : [{ name: '', level: 1 }] };
    });
    setConfirmIdx(null);
  };

  return (
    <div className={styles.breakdown}>
      <div className={styles.popH}>Classes · Nível</div>

      {classes.map((c, idx) =>
        confirmIdx === idx ? (
          <div key={idx} className={styles.confirmRow}>
            <span>Remover {c.name || 'classe'}?</span>
            <button type="button" className={`${styles.confirmBtn} ${styles.confirmNo}`} onClick={() => setConfirmIdx(null)}>
              Não
            </button>
            <button type="button" className={`${styles.confirmBtn} ${styles.confirmYes}`} onClick={() => removeClass(idx)}>
              Remover
            </button>
          </div>
        ) : (
          <div key={idx} className={styles.classRow}>
            {readOnly ? (
              <b>{c.name || 'Classe'}</b>
            ) : (
              <select value={c.name} onChange={(e) => updateClass(idx, 'name', e.target.value)}>
                <option value="">Selecione...</option>
                {TORMENTA_CLASSES.map((cl) => (
                  <option key={cl.id} value={cl.name}>{cl.name}</option>
                ))}
              </select>
            )}

            {!readOnly ? (
              <Stepper
                value={c.level}
                onChange={(n) => updateClass(idx, 'level', n)}
                min={1}
                className={styles.stepper}
              />
            ) : (
              <b>{c.level}</b>
            )}

            {!readOnly && classes.length > 1 && (
              <button
                type="button"
                className={styles.remove}
                aria-label="Remover classe"
                onClick={() => setConfirmIdx(idx)}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        ),
      )}

      <div className={styles.tot}>
        <span>Nível total</span>
        <b>{totalLevel}</b>
      </div>

      {!readOnly && (
        <button type="button" className={styles.btnAdd} onClick={addClass}>
          + Classe
        </button>
      )}
    </div>
  );
}

ClassesBreakdown.displayName = 'ClassesBreakdown';

export default ClassesBreakdown;
