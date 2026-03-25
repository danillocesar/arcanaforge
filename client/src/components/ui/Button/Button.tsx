import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'default' | 'add' | 'remove' | 'remove-sm' | 'gold' | 'ghost' | 'primary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantMap: Record<ButtonVariant, string> = {
  default: '',
  add: styles.add,
  remove: styles.remove,
  'remove-sm': styles.removeSm,
  gold: styles.gold,
  ghost: styles.ghost,
  primary: styles.primary,
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', className, children, ...rest }, ref) => {
    const cls = [styles.btn, variantMap[variant], className].filter(Boolean).join(' ');
    return (
      <button ref={ref} className={cls} {...rest}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
