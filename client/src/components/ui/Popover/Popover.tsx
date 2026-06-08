import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Popover.module.css';

interface PopoverProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

function Popover({
  open,
  anchorRef,
  onClose,
  children,
  align = 'center',
  className,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const reposition = () => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const panelW = panel?.offsetWidth ?? 200;

    let left: number;
    if (align === 'start') left = rect.left;
    else if (align === 'end') left = rect.right - panelW;
    else left = rect.left + rect.width / 2 - panelW / 2;

    let top = rect.bottom + 8;

    // Clamp within viewport.
    const pad = 8;
    if (left < pad) left = pad;
    if (left + panelW > window.innerWidth - pad) {
      left = window.innerWidth - pad - panelW;
    }
    const panelH = panel?.offsetHeight ?? 0;
    if (panelH && top + panelH > window.innerHeight - pad) {
      top = rect.top - panelH - 8;
    }

    setPos({ top, left });
  };

  // Position before paint and whenever opened.
  useLayoutEffect(() => {
    if (open) reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align]);

  // Reposition on scroll/resize while open.
  useEffect(() => {
    if (!open) return;
    const handler = () => reposition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape + outside pointerdown.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      className={`${styles.popover} ${className ?? ''}`.trim()}
      style={{ top: pos.top, left: pos.left }}
    >
      {children}
    </div>,
    document.body,
  );
}

Popover.displayName = 'Popover';

export default Popover;
