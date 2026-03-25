import { useCombateContext } from '../../../contexts/CombateContext';
import { getInitials, getAvatarColor } from '../../../utils/formatters';
import type { CombateRow } from '../../../types/combate';
import styles from './MiniOrder.module.css';

interface MiniOrderProps {
  rows: CombateRow[];
}

export default function MiniOrder({ rows }: MiniOrderProps) {
  const { turnoIdx } = useCombateContext();

  if (!rows || rows.length === 0) return null;

  return (
    <div className={styles.column}>
      {rows.map((row, i) => {
        const isTurno = turnoIdx >= 0 && i === turnoIdx;
        const cor = getAvatarColor(row.nome);
        const isJogador = row.tipo === 'jogador';
        return (
          <div
            key={row.id}
            className={`${styles.item} ${isTurno ? styles.itemTurno : ''}`}
          >
            <div
              className={`${styles.miniAvatar} ${isJogador ? styles.miniJogador : styles.miniInimigo}`}
              style={
                isJogador
                  ? { background: `${cor}20`, borderColor: `${cor}55`, color: cor }
                  : undefined
              }
            >
              {row.avatar ? (
                <img className={styles.miniAvatarImg} src={row.avatar} alt={row.nome} />
              ) : (
                getInitials(row.nome)
              )}
            </div>
            <span className={styles.miniName}>{row.nome}</span>
          </div>
        );
      })}
    </div>
  );
}
