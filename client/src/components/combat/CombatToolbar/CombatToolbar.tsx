import { useCombatContext } from '../../../contexts/CombatContext';
import styles from './CombatToolbar.module.css';

export default function CombateToolbar() {
  const { resetTurn, sortInitiative, nextTurn } = useCombatContext();

  return (
    <div className={styles.toolbar}>
      <h2>Combate</h2>
      <div className={styles.buttons}>
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={resetTurn} title="Resetar Turno">
          <span className={styles.btnIcon}>⟲</span> Reset
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnGold}`} onClick={sortInitiative} title="Ordenar por Iniciativa">
          <span className={styles.btnIcon}>↕</span> Iniciar Combate
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={nextTurn} title="Próximo Turno">
          <span className={styles.btnIcon}>▶</span> Próximo Turno
        </button>
      </div>
    </div>
  );
}
