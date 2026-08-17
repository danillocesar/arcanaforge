import { useState, useRef } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getEffectiveAttribute, formatMod } from '../../../utils/calculations';
import { ATTRIBUTE_LABELS, ATTRIBUTE_FULL_NAMES } from '../../../data/atributos';
import type { AttributeId } from '../../../types/character';
import Stepper from '../../ui/Stepper/Stepper';
import styles from './AttributeBadge.module.css';

interface AttributeBadgeProps {
  attr: AttributeId;
}

function AttributeBadge({ attr }: AttributeBadgeProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();
  const [editing, setEditing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
      setEditing(false);
    }
  };

  const clsCard = [
    styles.attr,
    !readOnly && !editing ? styles.tappable : '',
    editing ? styles.editing : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={wrapRef}
      className={clsCard}
      tabIndex={editing ? -1 : undefined}
      onClick={!readOnly && !editing ? () => setEditing(true) : undefined}
      onBlur={editing ? handleBlur : undefined}
    >
      <div className={styles.lab}>{ATTRIBUTE_LABELS[attr]}</div>

      {editing ? (
        <div className={styles.stepperWrap}>
          <Stepper value={raw} onChange={setRaw} step={1} />
        </div>
      ) : (
        <div className={`${styles.mod} ${isBuffed ? styles.buffed : ''}`}>
          {formatMod(effective)}
          {isBuffed && <span className={styles.rawParen}>({formatMod(raw)})</span>}
        </div>
      )}

      <div className={styles.sub}>{ATTRIBUTE_FULL_NAMES[attr]}</div>

      {editing && (
        <button
          type="button"
          className={styles.doneBtn}
          onClick={(e) => { e.stopPropagation(); setEditing(false); }}
          aria-label="Fechar edição"
        >
          ✓
        </button>
      )}
    </div>
  );
}

AttributeBadge.displayName = 'AttributeBadge';

export default AttributeBadge;
