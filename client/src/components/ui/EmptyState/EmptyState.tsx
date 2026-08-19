import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

function EmptyState({ icon, title, hint, action, compact, className }: EmptyStateProps) {
  const cls = [styles.empty, compact ? styles.compact : '', className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <p className={styles.title}>{title}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';

export default EmptyState;
