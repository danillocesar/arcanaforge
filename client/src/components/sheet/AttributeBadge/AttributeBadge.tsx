import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getEffectiveAttribute, formatMod } from '../../../utils/calculations';
import { ATTRIBUTE_LABELS, ATTRIBUTE_FULL_NAMES } from '../../../data/atributos';
import type { AttributeId } from '../../../types/character';
import Stepper from '../../ui/Stepper/Stepper';
import styles from './AttributeBadge.module.css';

interface AttributeBadgeProps {
  attr: AttributeId;
  editMode?: boolean;
}

function AttributeBadge({ attr, editMode = false }: AttributeBadgeProps) {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const raw = character.attributes[attr] || 0;
  const effective = getEffectiveAttribute(character, attr);
  const isBuffed = effective !== raw;

  const setRaw = (value: number) => {
    updateCharacter((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: value },
    }));
  };

  return (
    <div className={styles.attr}>
      <div className={styles.lab}>{ATTRIBUTE_LABELS[attr]}</div>

      {editMode ? (
        <div className={styles.edit}>
          <Stepper value={raw} onChange={setRaw} step={1} />
        </div>
      ) : (
        <div className={`${styles.mod} ${isBuffed ? styles.buffed : ''}`}>
          {formatMod(effective)}
          {isBuffed && <span className={styles.rawParen}>({formatMod(raw)})</span>}
        </div>
      )}

      <div className={styles.sub}>{ATTRIBUTE_FULL_NAMES[attr]}</div>
    </div>
  );
}

AttributeBadge.displayName = 'AttributeBadge';

export default AttributeBadge;
