import Card from '../../ui/Card/Card';
import Chip from '../../ui/Chip/Chip';
import type { Ability } from '../../../types/character';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import styles from './AbilityCard.module.css';

interface AbilityCardProps {
  ability: Ability;
  index: number;
  editMode?: boolean;
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
}

function AbilityCard({ ability, index, editMode = false, onEdit, onRemove }: AbilityCardProps) {
  const { readOnly } = useCharacterContext();

  const kind = ability.kind ?? 'Poder';
  const chipVariant = kind === 'Habilidade' ? 'warn' : 'buff';
  const mpCost = Number(ability.mpCost) || 0;

  const editable = editMode && !readOnly;

  const handleCardClick = () => {
    if (editable && onEdit) onEdit(index);
  };

  return (
    <Card
      className={`${styles.pow} ${editable ? styles.editable : ''}`.trim()}
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
      <div className={styles.txt}>
        <div className={styles.head}>
          <h3 className={styles.name}>{ability.name || 'Sem nome'}</h3>
          <Chip label={kind} variant={chipVariant} active className={styles.tag} />
        </div>
        {(ability.source || mpCost > 0) && (
          <div className={styles.metaRow}>
            {ability.source && <span className={styles.source}>{ability.source}</span>}
            {mpCost > 0 && <span className={styles.pm}>{mpCost} PM</span>}
          </div>
        )}
        {ability.description && <p className={styles.desc}>{ability.description}</p>}
      </div>
      {editable && (
        <button
          type="button"
          className={styles.rmX}
          aria-label="Remover poder"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(index);
          }}
        >
          ×
        </button>
      )}
    </Card>
  );
}

AbilityCard.displayName = 'AbilityCard';

export default AbilityCard;
