import { useCharacterContext } from '../../../contexts/CharacterContext';
import styles from './NotesDrawer.module.css';

export default function NotesDrawer() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  return (
    <textarea
      className={styles.textarea}
      value={character.notes}
      onChange={(e) => updateCharacter((f) => ({ ...f, notes: e.target.value }))}
      placeholder="Suas anotações..."
    />
  );
}
