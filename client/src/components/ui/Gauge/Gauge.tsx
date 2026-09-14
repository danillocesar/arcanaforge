import type { ReactNode } from 'react';
import styles from './Gauge.module.css';

type GaugeVariant = 'pv' | 'pm' | 'def';

interface GaugeProps {
  label: string;
  value: number;
  max: number;
  variant?: GaugeVariant;
  suffix?: ReactNode;
  className?: string;
}

const variantMap: Record<GaugeVariant, string> = {
  pv: styles.pv,
  pm: styles.pm,
  def: styles.def,
};

export default function Gauge({
  label,
  value,
  max,
  variant = 'pv',
  suffix,
  className,
}: GaugeProps) {
  const cls = [styles.vital, variantMap[variant], className].filter(Boolean).join(' ');
  const ratio = max > 0 ? value / max : 0;
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  const showTrack = variant !== 'def';

  return (
    <div className={cls}>
      <div className={styles.lab}>{label}</div>
      <div className={styles.val}>
        {value}
        {variant !== 'def' && <small>/{max}</small>}
        {suffix != null && <small>{suffix}</small>}
      </div>
      {showTrack && (
        <div className={styles.track}>
          <i style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

Gauge.displayName = 'Gauge';
