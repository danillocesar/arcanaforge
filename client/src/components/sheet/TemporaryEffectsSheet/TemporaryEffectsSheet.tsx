import { useCharacterContext } from '../../../contexts/CharacterContext';
import Sheet from '../../ui/Sheet/Sheet';
import styles from './TemporaryEffectsSheet.module.css';

interface TemporaryEffectsSheetProps {
  open: boolean;
  onClose: () => void;
}

function TemporaryEffectsSheet({ open, onClose }: TemporaryEffectsSheetProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  return (
    <Sheet open={open} onClose={onClose} title="Efeitos Temporários">
      <textarea
        className={styles.area}
        value={character.temporaryEffects ?? ''}
        onChange={(e) => updateCharacter((f) => ({ ...f, temporaryEffects: e.target.value }))}
        placeholder="Efeitos ativos, condições, durações..."
        readOnly={readOnly}
      />
    </Sheet>
  );
}

TemporaryEffectsSheet.displayName = 'TemporaryEffectsSheet';

export default TemporaryEffectsSheet;
