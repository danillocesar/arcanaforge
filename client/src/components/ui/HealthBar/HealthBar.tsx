import type { MouseEventHandler } from 'react';
import styles from './HealthBar.module.css';

interface BarraVidaProps {
  atual: number;
  maximo: number;
  tipo: 'hp' | 'pm';
  showLabel?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export default function BarraVida({
  atual,
  maximo,
  tipo,
  showLabel = true,
  onClick,
  className,
}: BarraVidaProps) {
  const pct = maximo > 0 ? Math.max(0, Math.min(100, (atual / maximo) * 100)) : 0;

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
        className={`${styles.fill} ${tipo === 'hp' ? styles.hp : styles.pm}`}
        style={{ width: `${pct}%` }}
      />
      {showLabel && (
        <div className={styles.label}>
          {atual}/{maximo}
        </div>
      )}
    </div>
  );
}
