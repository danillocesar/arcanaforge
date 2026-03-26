import { useEffect, useRef, useState } from 'react';
import styles from './SectionNav.module.css';

interface SectionDef {
  id: string;
  label: string;
  hidden?: boolean;
}

interface SectionNavProps {
  sections: SectionDef[];
  onPericiasClick: () => void;
  secoesOcultas?: Record<string, boolean>;
  onToggleOculta?: (id: string) => void;
}

export default function SectionNav({ sections, onPericiasClick, secoesOcultas, onToggleOculta }: SectionNavProps) {
  const [activeId, setActiveId] = useState('');
  const [secvisOpen, setSecvisOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    observerRef.current?.disconnect();

    const visibleSet = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSet.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleSet.delete(entry.target.id);
          }
        });

        let best = '';
        let bestRatio = 0;
        visibleSet.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        });
        if (best) setActiveId(best);
      },
      { rootMargin: '-120px 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [sections]);

  useEffect(() => {
    if (!secvisOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSecvisOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [secvisOpen]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className={styles.nav}>
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`${styles.link} ${activeId === s.id ? styles.active : ''} ${s.hidden ? styles.hidden : ''}`}
          onClick={() => {
            if (s.id === 'secPericias') {
              onPericiasClick();
            } else {
              scrollTo(s.id);
            }
          }}
        >
          {s.label}
        </button>
      ))}

      {onToggleOculta && (
        <div className={styles.secvisWrapper} ref={panelRef}>
          <button
            type="button"
            className={`${styles.link} ${styles.secvisBtn}`}
            onClick={() => setSecvisOpen(!secvisOpen)}
            title="Seções visíveis"
          >
            ☰
          </button>
          {secvisOpen && (
            <div className={styles.secvisPanel}>
              {sections.map((s) => (
                <label key={s.id} className={styles.secvisItem}>
                  <input
                    type="checkbox"
                    checked={!secoesOcultas?.[s.id]}
                    onChange={() => onToggleOculta(s.id)}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
