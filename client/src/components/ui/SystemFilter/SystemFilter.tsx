import styles from './SystemFilter.module.css';

type TabFilter = 'todos' | 'tormenta' | 'naruto';

interface SystemFilterProps {
  value: TabFilter;
  onChange: (tab: TabFilter) => void;
}

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'tormenta', label: '⚔️ Tormenta' },
  { key: 'naruto', label: '🍥 Naruto' },
];

export default function SystemFilter({ value, onChange }: SystemFilterProps) {
  return (
    <div className={styles.tabs}>
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`${styles.tab} ${value === t.key ? styles.tabActive : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
