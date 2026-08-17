import Card from '../../ui/Card/Card';
import Chip from '../../ui/Chip/Chip';
import type { Ability } from '../../../types/character';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import styles from './AbilityCard.module.css';

interface AbilityCardProps {
  ability: Ability;
  index: number;
  onEdit?: (index: number) => void;
  onUse?: (index: number) => void;
}

function AbilityCard({ ability, index, onEdit, onUse }: AbilityCardProps) {
  const { readOnly } = useCharacterContext();

  const kind = ability.kind ?? 'Poder';
  const chipVariant = kind === 'Habilidade' ? 'warn' : 'buff';
  const mpCost = Number(ability.mpCost) || 0;
  const hasBuffs = (ability.buffs ?? []).length > 0;
  const showUse = onUse && (mpCost > 0 || hasBuffs);

  return (
    <Card className={styles.pow}>
      <div
        className={`${styles.txt} ${!readOnly ? styles.tappable : ''}`.trim()}
        onClick={!readOnly ? () => onEdit?.(index) : undefined}
        role={!readOnly ? 'button' : undefined}
        tabIndex={!readOnly ? 0 : undefined}
      >
        <div className={styles.head}>
          <h3 className={styles.name}>{ability.name || 'Sem nome'}</h3>
          <Chip label={kind} variant={chipVariant} active className={styles.tag} />
        </div>
        {(ability.source || ability.prerequisite || mpCost > 0) && (
          <div className={styles.metaRow}>
            {ability.source && <span className={styles.source}>{ability.source}</span>}
            {ability.prerequisite && <span className={styles.source}>Pré-req.: {ability.prerequisite}</span>}
            {mpCost > 0 && <span className={styles.pm}>{mpCost} PM</span>}
          </div>
        )}
        {ability.description && <p className={styles.desc}>{ability.description}</p>}
      </div>
      {!readOnly && showUse && (
        <button type="button" className={styles.btnUse} onClick={() => onUse?.(index)}>
          ▶ Usar
        </button>
      )}
    </Card>
  );
}

AbilityCard.displayName = 'AbilityCard';

export default AbilityCard;
