import type { ReactNode } from 'react';
import styles from './TabNav.module.css';

interface TabNavSection {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabNavTrailing {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  active?: boolean;
}

interface TabNavProps {
  sections: TabNavSection[];
  active: string;
  onChange: (id: string) => void;
  variant: 'tabs' | 'sidebar';
  /** Optional trailing action rendered as an extra cell in the bottom bar (tabs variant). */
  trailing?: TabNavTrailing;
}

function TabNav({ sections, active, onChange, variant, trailing }: TabNavProps) {
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

  const columns = sections.length + (trailing ? 1 : 0);

  return (
    <nav
      className={styles.tabbar}
      aria-label="Seções"
      style={{ gridTemplateColumns: `repeat(${columns || 1}, 1fr)` }}
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

      {trailing && (
        <button
          type="button"
          className={[styles.tab, trailing.active ? styles.active : ''].filter(Boolean).join(' ')}
          aria-haspopup="menu"
          aria-expanded={trailing.active ?? undefined}
          onClick={trailing.onClick}
        >
          {trailing.icon != null && <span className={styles.ti}>{trailing.icon}</span>}
          <span className={styles.tl}>{trailing.label}</span>
        </button>
      )}
    </nav>
  );
}

TabNav.displayName = 'TabNav';

export default TabNav;
