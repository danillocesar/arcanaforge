import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'pm' | 'gold';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, string> = {
  default: styles.default,
  pm: styles.pm,
  gold: styles.gold,
};

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${variantMap[variant]}`}>
      {children}
    </span>
  );
}
