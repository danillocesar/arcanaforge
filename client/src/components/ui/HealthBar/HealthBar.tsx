import type { MouseEventHandler } from 'react';
import styles from './HealthBar.module.css';

interface HealthBarProps {
  current: number;
  max: number;
  variant: 'hp' | 'pm';
  showLabel?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export default function HealthBar({
  current,
  max,
  variant,
  showLabel = true,
  onClick,
  className,
}: HealthBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  const cls = [
    styles.container,
    onClick ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} onClick={onClick}>
      <div
        className={`${styles.fill} ${variant === 'hp' ? styles.hp : styles.pm}`}
        style={{ width: `${pct}%` }}
      />
      {showLabel && (
        <div className={styles.label}>
          {current}/{max}
        </div>
      )}
    </div>
  );
}
