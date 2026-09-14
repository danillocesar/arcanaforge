import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Button from '../../ui/Button/Button';
import ConfirmModal from '../../ui/ConfirmModal/ConfirmModal';
import styles from './ProgressionDrawer.module.css';

export default function ProgressionDrawer() {
  const { character, updateCharacter } = useCharacterContext();
  const [removeIdx, setRemoveIdx] = useState<number | null>(null);

  if (!character) return null;

  const addProgression = () => {
    updateCharacter((f) => ({
      ...f,
      progression: [...f.progression, ''],
    }));
  };

  const removeProgression = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      progression: f.progression.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx: number, value: string) => {
    updateCharacter((f) => {
      const progression = [...f.progression];
      progression[idx] = value;
      return { ...f, progression };
    });
  };

  return (
    <div>
      {character.progression.map((p, i) => (
        <div key={i} className={styles.item}>
          <span className={styles.levelNumber}>{i + 1}.</span>
          <input
            className={styles.desc}
            value={p}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder="Poderes, classes, distinções etc."
          />
          <button className={styles.removeProgression} onClick={() => setRemoveIdx(i)} aria-label="Remover nível">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <Button variant="add" onClick={addProgression}>+ Adicionar nível</Button>

      <ConfirmModal
        open={removeIdx != null}
        onClose={() => setRemoveIdx(null)}
        onConfirm={() => {
          if (removeIdx != null) removeProgression(removeIdx);
        }}
        title="Remover nível?"
        message={`Isso apaga o registro do nível ${(removeIdx ?? 0) + 1}.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}
