import { applyMpReduction } from '../../../utils/mpReduction';
import styles from './MpTotalRow.module.css';

interface MpTotalRowProps {
  /** Custo somado (base + aprimoramentos/modificadores), antes dos redutores. */
  total: number;
  /** Quantos PM o jogador tirou pelos redutores dele. */
  reduction: number;
  onReductionChange: (reduction: number) => void;
}

/**
 * "Custo Total" do conjurar/atacar com −/+ para o jogador aplicar os próprios
 * redutores de custo (poderes, itens). Mostra a conta "6 − 2 de redução" e o
 * valor final; nunca passa do piso de 1 PM (ver applyMpReduction).
 */
function MpTotalRow({ total, reduction, onReductionChange }: MpTotalRowProps) {
  const { final, applied, canReduceMore } = applyMpReduction(total, reduction);

  return (
    <div className={styles.row}>
      <div className={styles.labels}>
        <span className={styles.label}>Custo Total</span>
        {applied > 0 && (
          <span className={styles.hint}>
            {total} − {applied} de redução
          </span>
        )}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onReductionChange(applied + 1)}
          disabled={!canReduceMore}
          aria-label="Reduzir 1 PM do custo"
          title="Reduzir 1 PM (redutores de custo)"
        >
          −
        </button>
        <span className={`${styles.value} ${applied > 0 ? styles.reduced : ''}`.trim()} aria-live="polite">
          {final} PM
        </span>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onReductionChange(Math.max(0, applied - 1))}
          disabled={applied === 0}
          aria-label="Desfazer 1 PM de redução"
          title="Desfazer 1 PM de redução"
        >
          +
        </button>
      </div>
    </div>
  );
}

MpTotalRow.displayName = 'MpTotalRow';

export default MpTotalRow;
