import { forwardRef, useEffect, useRef, useState } from 'react';
import styles from './NumberField.module.css';

interface NumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ label, value, onChange, min, max, className, ...rest }, ref) => {
    const cls = [styles.field, className].filter(Boolean).join(' ');
    const [draft, setDraft] = useState(String(value));
    const focusedRef = useRef(false);

    useEffect(() => {
      if (!focusedRef.current) setDraft(String(value));
    }, [value]);

    const normalize = (raw: string): number => {
      const n = Number(raw);
      let result = raw.trim() === '' || Number.isNaN(n) ? 0 : n;
      if (min !== undefined) result = Math.max(min, result);
      if (max !== undefined) result = Math.min(max, result);
      return result;
    };

    return (
      <div className={cls}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          className={styles.control}
          value={draft}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            const n = Number(raw);
            if (raw.trim() !== '' && !Number.isNaN(n)) onChange(normalize(raw));
          }}
          onFocus={(e) => {
            focusedRef.current = true;
            e.target.select();
          }}
          onBlur={(e) => {
            focusedRef.current = false;
            const final = normalize(e.target.value);
            setDraft(String(final));
            onChange(final);
          }}
          {...rest}
        />
      </div>
    );
  },
);

NumberField.displayName = 'NumberField';

export default NumberField;
