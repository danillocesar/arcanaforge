import React, { useEffect, useRef, useState } from 'react';
import styles from './SectionNav.module.css';

const ACTIVE_ANCHOR_TOP_PX = 120;

export interface NavItem {
  id: string;
  label: string;
  hidden?: boolean;
  onClick?: () => void;
  active?: boolean;
}

interface SectionNavProps {
  items: NavItem[];
  useScrollObserver?: boolean;
  hiddenSections?: Record<string, boolean>;
  onToggleHidden?: (id: string) => void;
  rightSlot?: React.ReactNode;
}

export default function SectionNav({
  items,
  useScrollObserver = false,
  hiddenSections,
  onToggleHidden,
  rightSlot,
}: SectionNavProps) {
  const [observerActiveId, setObserverActiveId] = useState('');
  const [visibilityPanelOpen, setVisibilityPanelOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleSetRef = useRef(new Map<string, number>());
  const panelRef = useRef<HTMLDivElement | null>(null);
  const manualLockUntilRef = useRef(0);

  useEffect(() => {
    if (!useScrollObserver) return;

    observerRef.current?.disconnect();
    visibleSetRef.current.clear();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (Date.now() < manualLockUntilRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSetRef.current.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleSetRef.current.delete(entry.target.id);
          }
        });

        const visibleIds = [...visibleSetRef.current.keys()];
        if (visibleIds.length === 0) {
          setObserverActiveId('');
          return;
        }

        const ranked = visibleIds
          .map((id) => {
            const el = document.getElementById(id);
            if (!el) return null;
            const top = el.getBoundingClientRect().top;
            const dist = Math.abs(top - ACTIVE_ANCHOR_TOP_PX);
            const order = items.findIndex((s) => s.id === id);
            return { id, dist, order: order < 0 ? 999 : order };
          })
          .filter((x): x is NonNullable<typeof x> => x != null)
          .sort((a, b) => a.dist - b.dist || a.order - b.order);

        const best = ranked[0]?.id;
        if (best) setObserverActiveId(best);
      },
      { rootMargin: '-120px 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    items.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [items, useScrollObserver]);

  useEffect(() => {
    if (!visibilityPanelOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setVisibilityPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [visibilityPanelOpen]);

  const scrollTo = (id: string) => {
    manualLockUntilRef.current = Date.now() + 1400;
    setObserverActiveId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isActive = (item: NavItem) => {
    if (item.active) return true;
    if (useScrollObserver && !item.active) return observerActiveId === item.id;
    return false;
  };

  const handleClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (useScrollObserver) {
      scrollTo(item.id);
    }
  };

  return (
    <nav className={styles.nav}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.link} ${isActive(item) ? styles.active : ''} ${item.hidden ? styles.hidden : ''}`}
          onClick={() => handleClick(item)}
        >
          {item.label}
        </button>
      ))}

      {onToggleHidden && (
        <div className={styles.visibilityWrapper} ref={panelRef}>
          <button
            type="button"
            className={`${styles.link} ${styles.visibilityBtn}`}
            onClick={() => setVisibilityPanelOpen(!visibilityPanelOpen)}
            title="Seções visíveis"
          >
            ☰
          </button>
          {visibilityPanelOpen && (
            <div className={styles.visibilityPanel}>
              {items.map((item) => (
                <label key={item.id} className={styles.visibilityItem}>
                  <input
                    type="checkbox"
                    checked={!hiddenSections?.[item.id]}
                    onChange={() => onToggleHidden(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
    </nav>
  );
}
