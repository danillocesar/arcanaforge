import { forwardRef } from 'react';
import styles from './NumberField.module.css';

interface NumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ label, value, onChange, min, max, step, className, ...rest }, ref) => {
    const cls = [styles.field, className].filter(Boolean).join(' ');

    return (
      <div className={cls}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          type="number"
          className={styles.control}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          {...rest}
        />
      </div>
    );
  },
);

NumberField.displayName = 'NumberField';

export default NumberField;
