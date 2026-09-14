import { type ReactNode } from 'react';
import styles from './SegmentedControl.module.css';

interface SegmentedOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  const cls = [styles.segctl, className].filter(Boolean).join(' ');
  return (
    <div className={cls} role="tablist">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={active ? styles.on : undefined}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon != null && <span className={styles.gl}>{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

SegmentedControl.displayName = 'SegmentedControl';

export default SegmentedControl;
