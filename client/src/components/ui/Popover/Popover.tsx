import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { computePopoverPlacement } from './computePopoverPlacement';
import type { PopoverAlign, PopoverPlacement } from './PopoverPlacement';
import styles from './Popover.module.css';

interface PopoverProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  align?: PopoverAlign;
  className?: string;
  /** Accent glow shadow (default). Set false for a neutral shadow (e.g. menus). */
  glow?: boolean;
}

function Popover({
  open,
  anchorRef,
  onClose,
  children,
  align = 'center',
  className,
  glow = true,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PopoverPlacement | null>(null);

  const reposition = () => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor) return;
    setPos(computePopoverPlacement({
      anchor: anchor.getBoundingClientRect(),
      panelWidth: panel?.offsetWidth ?? 200,
      // Altura natural do conteúdo (ignora o maxHeight aplicado num reposition anterior).
      panelHeight: panel ? panel.scrollHeight + (panel.offsetHeight - panel.clientHeight) : 0,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      align,
    }));
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
      className={`${styles.popover} ${glow ? '' : styles.noGlow} ${className ?? ''}`.trim()}
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, maxHeight: pos?.maxHeight }}
    >
      {children}
    </div>,
    document.body,
  );
}

Popover.displayName = 'Popover';

export default Popover;
