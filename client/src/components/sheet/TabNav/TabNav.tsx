import type { ReactNode } from 'react';
import styles from './TabNav.module.css';

interface TabNavSection {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabNavProps {
  sections: TabNavSection[];
  active: string;
  onChange: (id: string) => void;
  variant: 'tabs' | 'sidebar';
}

function TabNav({ sections, active, onChange, variant }: TabNavProps) {
  if (variant === 'sidebar') {
    return (
      <nav className={styles.dSide} aria-label="Seções">
        <div className={styles.dNav}>
          {sections.map((s) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                className={[styles.dNavitem, isActive ? styles.on : ''].filter(Boolean).join(' ')}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onChange(s.id)}
              >
                {s.icon != null && <span className={styles.dni}>{s.icon}</span>}
                <span className={styles.dnl}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={styles.tabbar}
      aria-label="Seções"
      style={{ gridTemplateColumns: `repeat(${sections.length || 1}, 1fr)` }}
    >
      {sections.map((s) => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            className={[styles.tab, isActive ? styles.active : ''].filter(Boolean).join(' ')}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(s.id)}
          >
            {s.icon != null && <span className={styles.ti}>{s.icon}</span>}
            <span className={styles.tl}>{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

TabNav.displayName = 'TabNav';

export default TabNav;
