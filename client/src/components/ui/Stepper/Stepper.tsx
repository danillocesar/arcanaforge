import styles from './Stepper.module.css';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}

function Stepper({ value, onChange, step = 1, min, max, className }: StepperProps) {
  const atMin = min != null && value <= min;
  const atMax = max != null && value >= max;

  const clamp = (n: number) => {
    let next = n;
    if (min != null && next < min) next = min;
    if (max != null && next > max) next = max;
    return next;
  };

  const showBar = min != null && max != null;
  const range = showBar ? max - min : 0;
  const pct = showBar && range > 0 ? ((value - min) / range) * 100 : 0;

  const cls = [styles.stepper, className].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <button
        type="button"
        className={styles.stepBtn}
        aria-label="Diminuir"
        disabled={atMin}
        onClick={() => onChange(clamp(value - step))}
      >
        −
      </button>

      {showBar && (
        <span className={styles.bar}>
          <i style={{ width: `${pct}%` }} />
        </span>
      )}

      <span className={styles.val}>{value}</span>

      <button
        type="button"
        className={`${styles.stepBtn} ${styles.plus}`}
        aria-label="Aumentar"
        disabled={atMax}
        onClick={() => onChange(clamp(value + step))}
      >
        +
      </button>
    </div>
  );
}

Stepper.displayName = 'Stepper';

export default Stepper;
