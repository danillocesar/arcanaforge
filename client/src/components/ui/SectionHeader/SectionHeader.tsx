import type { ReactNode } from 'react';
import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  icon,
  action,
  className,
}: SectionHeaderProps) {
  const cls = [styles.secHead, className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div className={styles.lead}>
        {icon != null && <span className={styles.icon}>{icon}</span>}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {action != null && <span className={styles.action}>{action}</span>}
    </div>
  );
}

SectionHeader.displayName = 'SectionHeader';
