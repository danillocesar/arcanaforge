import { forwardRef } from 'react';
import styles from './TextField.module.css';

interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, value, onChange, placeholder, className, ...rest }, ref) => {
    const cls = [styles.field, className].filter(Boolean).join(' ');

    return (
      <div className={cls}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          className={styles.control}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
      </div>
    );
  },
);

TextField.displayName = 'TextField';

export default TextField;
