import { ChevronRight, RotateCcw, Swords } from 'lucide-react';
import { useCombatContext } from '../../../contexts/CombatContext';
import styles from './CombatToolbar.module.css';

export default function CombatToolbar() {
  const { resetTurn, sortInitiative, nextTurn } = useCombatContext();

  return (
    <div className={styles.toolbar}>
      <h2>Combate</h2>
      <div className={styles.buttons}>
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={resetTurn} title="Resetar Turno">
          <span className={styles.btnIcon}><RotateCcw size={16} aria-hidden="true" /></span> Reset
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnGold}`} onClick={sortInitiative} title="Ordenar por Iniciativa">
          <span className={styles.btnIcon}><Swords size={16} aria-hidden="true" /></span> Iniciar Combate
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={nextTurn} title="Próximo Turno">
          <span className={styles.btnIcon}><ChevronRight size={16} aria-hidden="true" /></span> Próximo Turno
        </button>
      </div>
    </div>
  );
}
