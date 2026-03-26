import { useState, useEffect, useRef, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import styles from './DamagePopover.module.css';

interface DanoPopoverProps {
  barRef: RefObject<HTMLDivElement | null>;
  onApply: (delta: number) => void;
  onClose: () => void;
}

export default function DanoPopover({
  barRef,
  onApply,
  onClose,
}: DanoPopoverProps) {
  const [valor, setValor] = useState('');
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const parseAmount = (): number => {
    const t = valor.trim();
    if (t === '') return 0;
    const n = Number(t);
    return Number.isFinite(n) ? Math.abs(n) : 0;
  };

  useEffect(() => {
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      const popW = 200;
      let left = rect.left + rect.width / 2 - popW / 2;
      let top = rect.bottom + 6;
      if (left < 8) left = 8;
      if (left + popW > window.innerWidth - 8) left = window.innerWidth - 8 - popW;
      const popH = 140;
      if (top + popH > window.innerHeight - 8) top = rect.top - popH - 6;
      setPos({ top, left });
    }
  }, [barRef]);

  const aplicarDano = () => onApply(-parseAmount());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        ref={popRef}
        className={styles.popover}
        style={{ top: pos.top, left: pos.left }}
      >
        <label className={styles.label} htmlFor="combat-damage-input">
          Alterar PV:
        </label>
        <input
          id="combat-damage-input"
          type="number"
          className={styles.input}
          min={0}
          placeholder=""
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              aplicarDano();
            }
          }}
          autoFocus
        />
        <div className={styles.actions}>
          <button
            className={styles.btnDamage}
            onClick={aplicarDano}
          >
            - Dano
          </button>
          <button
            className={styles.btnHeal}
            onClick={() => onApply(parseAmount())}
          >
            + Cura
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
