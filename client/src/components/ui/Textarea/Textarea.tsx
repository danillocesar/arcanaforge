import { forwardRef, useEffect, useRef } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
}

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, value, onChange, placeholder, compact, className, ...rest }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? innerRef;

    useEffect(() => {
      if (resolvedRef.current) autoGrow(resolvedRef.current);
    }, [value, resolvedRef]);

    const cls = [styles.field, compact ? styles.compact : '', className].filter(Boolean).join(' ');

    return (
      <div className={cls}>
        {label && <label className={styles.label}>{label}</label>}
        <textarea
          ref={resolvedRef}
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
