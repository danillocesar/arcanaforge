import { forwardRef } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, value, onChange, placeholder, className, ...rest }, ref) => {
    const cls = [styles.field, className].filter(Boolean).join(' ');

    return (
      <div className={cls}>
        {label && <label className={styles.label}>{label}</label>}
        <textarea
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

Textarea.displayName = 'Textarea';

export default Textarea;
