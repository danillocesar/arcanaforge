import { forwardRef, type HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Controls inner padding (~16px). Defaults to true. */
  padding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = true, className, children, ...rest }, ref) => {
    const cls = [styles.card, padding ? styles.padded : '', className]
      .filter(Boolean)
      .join(' ');
    return (
      <div ref={ref} className={cls} {...rest}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
