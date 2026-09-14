import { useCharacterContext } from '../../../contexts/CharacterContext';
import Sheet from '../../ui/Sheet/Sheet';
import styles from './NotesSheet.module.css';

interface NotesSheetProps {
  open: boolean;
  onClose: () => void;
}

function NotesSheet({ open, onClose }: NotesSheetProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  return (
    <Sheet open={open} onClose={onClose} title="Anotações">
      <textarea
        className={styles.area}
        value={character.notes ?? ''}
        onChange={(e) => updateCharacter((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Escreva aqui suas anotações, lembretes, história..."
        readOnly={readOnly}
      />
    </Sheet>
  );
}

NotesSheet.displayName = 'NotesSheet';

export default NotesSheet;
