import { useCharacterContext } from '../../../contexts/CharacterContext';
import Button from '../../ui/Button/Button';
import styles from './ProgressionDrawer.module.css';

export default function ProgressionDrawer() {
  const { character, updateCharacter } = useCharacterContext();

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
          <span className={styles.nivel}>{i + 1}.</span>
          <input
            className={styles.desc}
            value={p}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder="Poderes, classes, distinções etc."
          />
          <Button variant="remove-sm" onClick={() => removeProgression(i)}>×</Button>
        </div>
      ))}
      <Button variant="add" onClick={addProgression}>+ Adicionar nível</Button>
    </div>
  );
}
