import { Link } from 'react-router-dom';
import { getInitials, getAvatarColor } from '../../../utils/formatters';
import styles from './SelectGrid.module.css';

interface Resumo {
  nome: string;
  avatar: string;
  classes: { nome: string; nivel: number }[];
}

interface SelectGridProps {
  resumos: Resumo[];
  onNewCharacter: (nome: string) => void;
}

export default function SelectGrid({ resumos, onNewCharacter }: SelectGridProps) {
  const handleNew = () => {
    const nome = prompt('Nome do novo personagem:');
    if (!nome?.trim()) return;
    onNewCharacter(nome.trim());
  };

  return (
    <div className={styles.grid}>
      {resumos.map((r) => {
        const classesStr =
          r.classes
            ?.filter((c) => c.nome)
            .map((c) => `${c.nome} ${c.nivel || 1}`)
            .join(', ') || 'Sem classe';

        return (
          <Link
            key={r.nome}
            to={`/?char=${encodeURIComponent(r.nome)}`}
            className={styles.card}
          >
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
          </Link>
        );
      })}

      <button className={styles.newCard} onClick={handleNew}>
        <span className={styles.newIcon}>+</span>
        <span className={styles.newLabel}>Novo Personagem</span>
      </button>
    </div>
  );
}
