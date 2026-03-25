import { useCombateContext } from '../../../contexts/CombateContext';
import styles from './CombateToolbar.module.css';

export default function CombateToolbar() {
  const { resetTurno, ordenarIniciativa, proximoTurno } = useCombateContext();

  return (
    <div className={styles.toolbar}>
      <h2>Tracker de Combate</h2>
      <div className={styles.buttons}>
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={resetTurno} title="Resetar Turno">
          <span className={styles.btnIcon}>⟲</span> Reset
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnGold}`} onClick={ordenarIniciativa} title="Ordenar por Iniciativa">
          <span className={styles.btnIcon}>↕</span> Reordenar
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={proximoTurno} title="Próximo Turno">
          <span className={styles.btnIcon}>▶</span> Próximo Turno
        </button>
      </div>
    </div>
  );
}
