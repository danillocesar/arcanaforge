import Card from '../../ui/Card/Card';
import Button from '../../ui/Button/Button';
import type { Spell } from '../../../types/character';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import styles from './SpellCard.module.css';

interface SpellCardProps {
  spell: Spell;
  index: number;
  editMode?: boolean;
  onCast: (index: number) => void;
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
}

function SpellCard({ spell, index, editMode = false, onCast, onEdit, onRemove }: SpellCardProps) {
  const { readOnly } = useCharacterContext();

  const mpCost = Number(spell.mpCost) || 0;
  const circulo = Number(spell.spellLevel) || 0;
  const enhancements = Array.isArray(spell.enhancements) ? spell.enhancements : [];
  const editable = editMode && !readOnly;

  // One-line summary: school · area/effect snippet.
  const summaryBits = [spell.school, spell.area].filter((b) => b && b.trim());
  const summary = summaryBits.join(' · ');

  const handleCardClick = () => {
    if (editable && onEdit) onEdit(index);
  };

  return (
    <Card
      className={`${styles.spell} ${editable ? styles.editable : ''}`.trim()}
      onClick={handleCardClick}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={
        editable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEdit?.(index);
              }
            }
          : undefined
      }
    >
      <div className={styles.top}>
        <div className={styles.cost}>
          <b>{mpCost}</b>
          <span>PM</span>
        </div>
        <div className={styles.meta}>
          <h3 className={styles.name}>{spell.name || 'Sem nome'}</h3>
          <div className={styles.sch}>
            {circulo > 0 ? `${circulo}º Círculo` : 'Magia'}
            {summary ? ` · ${summary}` : ''}
          </div>
          {spell.description && <p className={styles.descr}>{spell.description}</p>}
          {enhancements.length > 0 && (
            <ul className={styles.enhList}>
              {enhancements.map((enh, i) => (
                <li key={i} className={styles.enhItem}>
                  <span className={styles.enhDesc}>
                    {enh.description || `Aprimoramento ${i + 1}`}
                  </span>
                  <span className={styles.enhPm}>+{Number(enh.mpCost) || 0} PM</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {editable && (
          <button
            type="button"
            className={styles.rmX}
            aria-label="Remover magia"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(index);
            }}
          >
            ×
          </button>
        )}
      </div>

      {!readOnly && (
        <Button
          className={styles.btnCast}
          onClick={(e) => {
            e.stopPropagation();
            onCast(index);
          }}
        >
          ✦ Lançar
        </Button>
      )}
    </Card>
  );
}

SpellCard.displayName = 'SpellCard';

export default SpellCard;
