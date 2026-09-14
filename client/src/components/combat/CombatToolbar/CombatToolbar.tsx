import { ChevronRight, RotateCcw, Swords } from 'lucide-react';
import { useCombatContext } from '../../../contexts/CombatContext';
import Button from '../../ui/Button/Button';
import styles from './CombatToolbar.module.css';

export default function CombatToolbar() {
  const { resetTurn, sortInitiative, nextTurn } = useCombatContext();

  return (
    <div className={styles.toolbar}>
      <h2>Combate</h2>
      <div className={styles.buttons}>
        <Button type="button" variant="ghost" onClick={resetTurn} title="Resetar Turno">
          <span className={styles.btnIcon}><RotateCcw size={16} aria-hidden="true" /></span> Reset
        </Button>
        <Button type="button" variant="primary" onClick={sortInitiative} title="Ordenar por Iniciativa">
          <span className={styles.btnIcon}><Swords size={16} aria-hidden="true" /></span> Iniciar Combate
        </Button>
        <Button type="button" variant="primary" onClick={nextTurn} title="Próximo Turno">
          <span className={styles.btnIcon}><ChevronRight size={16} aria-hidden="true" /></span> Próximo Turno
        </Button>
      </div>
    </div>
  );
}
