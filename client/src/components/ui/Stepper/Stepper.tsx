import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Stepper.module.css';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  barColor?: string;
  className?: string;
}

function Stepper({ value, onChange, step = 1, min, max, barColor, className }: StepperProps) {
  const atMin = min != null && value <= min;
  const atMax = max != null && value >= max;
  const dragging = useRef(false);
  const barRef = useRef<HTMLSpanElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const focusedRef = useRef(false);

  const clamp = useCallback((n: number) => {
    let next = n;
    if (min != null && next < min) next = min;
    if (max != null && next > max) next = max;
    return next;
  }, [min, max]);

  useEffect(() => {
    if (!focusedRef.current) setDraft(String(value));
  }, [value]);

  const commitDraft = (raw: string) => {
    const n = Number(raw);
    const next = clamp(raw.trim() === '' || Number.isNaN(n) ? 0 : n);
    setDraft(String(next));
    focusedRef.current = false;
    setEditing(false);
    onChange(next);
  };

  const showBar = min != null && max != null;
  const range = showBar ? max - min : 0;
  const pct = showBar && range > 0 ? ((value - min) / range) * 100 : 0;

  const valueFromPointer = useCallback((clientX: number): number => {
    if (!barRef.current || !showBar) return value;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min! + ratio * (max! - min!);
    return clamp(Math.round(raw / step) * step);
  }, [showBar, min, max, step, value, clamp]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
    if (!showBar) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    onChange(valueFromPointer(e.clientX));
  }, [showBar, onChange, valueFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
    if (!dragging.current) return;
    onChange(valueFromPointer(e.clientX));
  }, [onChange, valueFromPointer]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const cls = [styles.stepper, className].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <button
        type="button"
        className={styles.stepBtn}
        aria-label="Diminuir"
        disabled={atMin}
        onClick={() => onChange(clamp(value - step))}
      >
        −
      </button>

      {showBar && (
        <span
          ref={barRef}
          className={styles.bar}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <i style={{ width: `${pct}%`, background: barColor ?? 'var(--accent)' }} />
        </span>
      )}

      {editing ? (
        <input
          type="text"
          inputMode="numeric"
          className={styles.valInput}
          value={draft}
          autoFocus
          onFocus={(e) => {
            focusedRef.current = true;
            e.target.select();
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commitDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
      ) : (
        <span
          className={styles.val}
          role="button"
          tabIndex={0}
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setDraft(String(value));
              setEditing(true);
            }
          }}
        >
          {value}
        </span>
      )}

      <button
        type="button"
        className={`${styles.stepBtn} ${styles.plus}`}
        aria-label="Aumentar"
        disabled={atMax}
        onClick={() => onChange(clamp(value + step))}
      >
        +
      </button>
    </div>
  );
}

Stepper.displayName = 'Stepper';

export default Stepper;
