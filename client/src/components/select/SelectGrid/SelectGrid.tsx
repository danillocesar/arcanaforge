import { Link } from 'react-router-dom';
import { getInitials, getAvatarColor, formatClassesStr } from '../../../utils/formatters';
import type { CharacterSummary, RPGSystem } from '../../../types/character';
import { SYSTEM_ROUTES } from '../../../data/constants';
import styles from './SelectGrid.module.css';

interface SelectGridProps {
  resumos: CharacterSummary[];
  onNewCharacter: () => void;
  onDelete?: (resumo: CharacterSummary) => void;
  newDisabled?: boolean;
  newDisabledTooltip?: string;
}

const SISTEMA_BADGE: Record<RPGSystem, string> = {
  tormenta: '⚔️',
  naruto: '🍥',
};

export default function SelectGrid({ resumos, onNewCharacter, onDelete, newDisabled, newDisabledTooltip }: SelectGridProps) {
  return (
    <div className={styles.grid}>
      <button
        className={`${styles.newCard} ${newDisabled ? styles.newCardDisabled : ''}`}
        onClick={newDisabled ? undefined : onNewCharacter}
        disabled={newDisabled}
        title={newDisabledTooltip}
      >
        <span className={styles.newIcon}>+</span>
        <span className={styles.newLabel}>Novo Personagem</span>
        {newDisabledTooltip && <span className={styles.newLimitHint}>{newDisabledTooltip}</span>}
      </button>

      {resumos.map((r) => {
        const classesStr = formatClassesStr(r.classes);

        const route = SYSTEM_ROUTES[r.system] ?? '/';

        return (
          <Link
            key={r._id}
            to={`${route}?id=${encodeURIComponent(r._id)}`}
            className={styles.card}
          >
            <span className={styles.systemBadge} title={r.system === 'naruto' ? 'Naruto: Shinobi no Sho' : 'Tormenta 20'}>
              {SISTEMA_BADGE[r.system]}
            </span>
            <div
              className={styles.avatar}
              style={r.avatar ? undefined : { background: getAvatarColor(r.name) }}
            >
              {r.avatar ? (
                <img src={r.avatar} alt="" />
              ) : (
                getInitials(r.name)
              )}
            </div>
            <span className={styles.cardName}>{r.name}</span>
            <span className={styles.cardClass}>{classesStr}</span>
            {onDelete && (
              <button
                type="button"
                className={styles.deleteBtn}
                title="Excluir"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(r);
                }}
              >
                ✕
              </button>
            )}
          </Link>
        );
      })}
    </div>
  );
}
