import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Sheet.module.css';

interface SheetProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * useDesktop — true on the desktop breakpoint (min-width: 768px).
 * Drives the centered-modal vs bottom-sheet variant.
 */
function useDesktop(): boolean {
  const query = '(min-width: 768px)';
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

function Sheet({ open, title, onClose, footer, children, className }: SheetProps) {
  const isDesktop = useDesktop();
  // Keep the node mounted through the close animation.
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = window.setTimeout(() => setMounted(false), 380);
    return () => window.clearTimeout(t);
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const sheetClass = [
    styles.sheet,
    isDesktop ? styles.modal : '',
    open ? styles.open : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <>
      <div
        className={`${styles.overlay} ${open ? styles.open : ''}`}
        onClick={onClose}
      />
      <div className={sheetClass} role="dialog" aria-modal="true">
        <div className={styles.sheetHead}>
          <div className={styles.stRow}>
            {title ? <h2>{title}</h2> : <span />}
            <button
              type="button"
              className={styles.sheetX}
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
        <div className={styles.sheetBody}>{children}</div>
        {footer ? <div className={styles.sheetFoot}>{footer}</div> : null}
      </div>
    </>,
    document.body,
  );
}

Sheet.displayName = 'Sheet';

export default Sheet;
