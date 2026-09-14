import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Sheet from '../../ui/Sheet/Sheet';
import styles from './ProgressionSheet.module.css';

interface ProgressionSheetProps {
  open: boolean;
  onClose: () => void;
}

function ProgressionSheet({ open, onClose }: ProgressionSheetProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);

  if (!character) return null;

  const progression = character.progression ?? [];

  const addProgression = () => {
    updateCharacter((f) => ({ ...f, progression: [...f.progression, ''] }));
  };

  const updateItem = (idx: number, value: string) => {
    updateCharacter((f) => {
      const next = [...f.progression];
      next[idx] = value;
      return { ...f, progression: next };
    });
  };

  const removeItem = (idx: number) => {
    updateCharacter((f) => ({ ...f, progression: f.progression.filter((_, i) => i !== idx) }));
    setConfirmIdx(null);
  };

  const footer = !readOnly ? (
    <button type="button" className={styles.btnAdd} onClick={addProgression}>
      + Adicionar nível
    </button>
  ) : undefined;

  return (
    <Sheet open={open} onClose={onClose} title="Progressão" footer={footer}>
      {progression.length === 0 ? (
        <p className={styles.empty}>Nenhum registro de progressão.</p>
      ) : (
        <div className={styles.list}>
          {progression.map((p, idx) =>
            confirmIdx === idx ? (
              <div key={idx} className={styles.confirmRow}>
                <span>Remover registro do nível {idx + 1}?</span>
                <button type="button" className={`${styles.confirmBtn} ${styles.confirmNo}`} onClick={() => setConfirmIdx(null)}>
                  Não
                </button>
                <button type="button" className={`${styles.confirmBtn} ${styles.confirmYes}`} onClick={() => removeItem(idx)}>
                  Remover
                </button>
              </div>
            ) : (
              <div key={idx} className={styles.item}>
                <span className={styles.levelNumber}>{idx + 1}.</span>
                <input
                  className={styles.desc}
                  value={p}
                  onChange={(e) => updateItem(idx, e.target.value)}
                  placeholder="Poderes, classes, distinções etc."
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <button type="button" className={styles.remove} aria-label="Remover" onClick={() => setConfirmIdx(idx)}>
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </Sheet>
  );
}

ProgressionSheet.displayName = 'ProgressionSheet';

export default ProgressionSheet;
