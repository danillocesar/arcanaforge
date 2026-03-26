import { Link } from 'react-router-dom';
import { getInitials, getAvatarColor, formatClassesStr } from '../../../utils/formatters';
import type { FichaResumo, SistemaRPG } from '../../../types/ficha';
import { SISTEMA_ROUTE } from '../../../data/constants';
import styles from './SelectGrid.module.css';

interface SelectGridProps {
  resumos: FichaResumo[];
  onNewCharacter: () => void;
  onDelete?: (resumo: FichaResumo) => void;
}

const SISTEMA_BADGE: Record<SistemaRPG, string> = {
  tormenta: '⚔️',
  naruto: '🍥',
};

export default function SelectGrid({ resumos, onNewCharacter, onDelete }: SelectGridProps) {
  return (
    <div className={styles.grid}>
      <button className={styles.newCard} onClick={onNewCharacter}>
        <span className={styles.newIcon}>+</span>
        <span className={styles.newLabel}>Novo Personagem</span>
      </button>

      {resumos.map((r) => {
        const classesStr = formatClassesStr(r.classes);

        const route = SISTEMA_ROUTE[r.sistema] ?? '/';

        return (
          <Link
            key={r._id}
            to={`${route}?id=${encodeURIComponent(r._id)}`}
            className={styles.card}
          >
            <span className={styles.sistemaBadge} title={r.sistema === 'naruto' ? 'Naruto: Shinobi no Sho' : 'Tormenta 20'}>
              {SISTEMA_BADGE[r.sistema]}
            </span>
            <div
              className={styles.avatar}
              style={r.avatar ? undefined : { background: getAvatarColor(r.nome) }}
            >
              {r.avatar ? (
                <img src={r.avatar} alt="" />
              ) : (
                getInitials(r.nome)
              )}
            </div>
            <span className={styles.cardNome}>{r.nome}</span>
            <span className={styles.cardClasse}>{classesStr}</span>
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
