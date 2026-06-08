import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Switch.module.css';

interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked' | 'type'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onChange, disabled, className, ...rest }, ref) => {
    const cls = [styles.toggle, className].filter(Boolean).join(' ');
    return (
      <label className={cls}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          {...rest}
        />
        <span className={styles.tk} />
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
