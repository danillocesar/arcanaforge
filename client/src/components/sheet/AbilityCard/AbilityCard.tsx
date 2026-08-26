import Card from '../../ui/Card/Card';
import Chip from '../../ui/Chip/Chip';
import type { Ability } from '../../../types/character';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { firstSentence } from '../../../utils/formatters';
import styles from './AbilityCard.module.css';

interface AbilityCardProps {
  ability: Ability;
  index: number;
  onEdit?: (index: number) => void;
  onUse?: (index: number) => void;
  onToggleFavorite?: (index: number) => void;
}

function AbilityCard({ ability, index, onEdit, onUse, onToggleFavorite }: AbilityCardProps) {
  const { readOnly } = useCharacterContext();

  const kind = ability.kind ?? 'Poder';
  const chipVariant = kind === 'Habilidade' ? 'warn' : 'buff';
  const mpCost = Number(ability.mpCost) || 0;
  const hasBuffs = (ability.buffs ?? []).length > 0;
  const showUse = onUse && !ability.alwaysActive && (mpCost > 0 || hasBuffs);
  const isPassive = !showUse;
  // Usos por dia: `usesLeft` ausente = dia ainda não começou a gastar (cheio).
  const uses = ability.usesPerDay
    ? { left: ability.usesLeft ?? ability.usesPerDay, max: ability.usesPerDay }
    : null;
  const exhausted = uses != null && uses.left <= 0;
  // Mesma regra do SpellCard: resumo no card, texto integral no formulário.
  const blurb = ability.summary?.trim() || firstSentence(ability.description);

  return (
    <Card className={styles.pow}>
      <div
        className={`${styles.txt} ${!readOnly ? styles.tappable : ''}`.trim()}
        onClick={!readOnly ? () => onEdit?.(index) : undefined}
        role={!readOnly ? 'button' : undefined}
        tabIndex={!readOnly ? 0 : undefined}
        onKeyDown={!readOnly ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit?.(index);
          }
        } : undefined}
      >
        <div className={styles.head}>
          <h3 className={styles.name}>{ability.name || 'Sem nome'}</h3>
          <Chip label={kind} variant={chipVariant} active className={styles.tag} />
          {!readOnly && onToggleFavorite && (
            <button
              type="button"
              className={`${styles.fav} ${ability.favorite ? styles.favOn : ''}`.trim()}
              aria-label={ability.favorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
              aria-pressed={!!ability.favorite}
              // O card inteiro abre a edição — nem o clique nem o Enter/Espaço na
              // estrela podem subir, senão favoritar pelo teclado também abriria o form.
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(index);
              }}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {ability.favorite ? '★' : '☆'}
            </button>
          )}
        </div>
        {(ability.source || ability.prerequisite || mpCost > 0 || isPassive || uses) && (
          <div className={styles.metaRow}>
            {isPassive && <span className={styles.source}>Passiva</span>}
            {ability.source && <span className={styles.source}>{ability.source}</span>}
            {ability.prerequisite && <span className={styles.source}>Pré-req.: {ability.prerequisite}</span>}
            {mpCost > 0 && <span className={styles.pm}>{mpCost} PM</span>}
            {uses && (
              <span className={`${styles.uses} ${exhausted ? styles.usesOut : ''}`.trim()}>
                {uses.left}/{uses.max} usos
              </span>
            )}
          </div>
        )}
        {blurb && <p className={styles.desc}>{blurb}</p>}
      </div>
      {!readOnly && showUse && (
        <button
          type="button"
          className={styles.btnUse}
          onClick={() => onUse?.(index)}
          disabled={exhausted}
          title={exhausted ? 'Sem usos hoje — renova no "Novo dia"' : undefined}
        >
          ▶ Usar
        </button>
      )}
    </Card>
  );
}

AbilityCard.displayName = 'AbilityCard';

export default AbilityCard;
