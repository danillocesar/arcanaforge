import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './FabSpeedDial.module.css';

interface FabAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface FabSpeedDialProps {
  actions: FabAction[];
  position?: 'phone' | 'desk';
  className?: string;
}

function FabSpeedDial({ actions, position = 'phone', className }: FabSpeedDialProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleOption = (action: FabAction) => {
    action.onClick();
    setOpen(false);
  };

  const wrapClass = [
    styles.fabWrap,
    position === 'desk' ? styles.inDesk : styles.inPhone,
    open ? styles.open : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={`${styles.fabScrim} ${open ? styles.open : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div ref={wrapRef} className={wrapClass}>
        <div className={styles.fabMenu}>
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              className={styles.fabOpt}
              onClick={() => handleOption(action)}
              tabIndex={open ? 0 : -1}
            >
              <span className={styles.foLab}>{action.label}</span>
              <span className={styles.foIc} aria-hidden="true">
                {action.icon ?? '+'}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.fab}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        >
          <span className={styles.fabIco}>+</span>
        </button>
      </div>
    </>
  );
}

FabSpeedDial.displayName = 'FabSpeedDial';

export default FabSpeedDial;
