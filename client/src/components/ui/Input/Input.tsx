import { forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'secondary';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', className, ...rest }, ref) => {
    const cls = [
      styles.input,
      variant === 'secondary' ? styles.secondary : styles.default,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <input ref={ref} className={cls} {...rest} />;
  },
);

Input.displayName = 'Input';

export default Input;
