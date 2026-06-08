import { forwardRef } from 'react';
import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, value, onChange, placeholder, className, ...rest }, ref) => {
    const cls = [styles.field, className].filter(Boolean).join(' ');

    return (
      <div className={cls}>
        {label && <label className={styles.label}>{label}</label>}
        <select
          ref={ref}
          className={styles.control}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
