import { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCollapsedSection } from '../../../hooks/useCollapsedSection';
import styles from './Section.module.css';

interface SectionProps {
  id: string;
  title: string;
  defaultCollapsed?: boolean;
  hidden?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Section({
  id,
  title,
  defaultCollapsed = false,
  hidden,
  children,
  className,
}: SectionProps) {
  const [collapsed, toggleCollapse] = useCollapsedSection(id, defaultCollapsed);

  const cls = [
    styles.section,
    collapsed ? styles.collapsed : '',
    hidden ? styles.hidden : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section id={id} className={cls}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.titleButton}
          onClick={toggleCollapse}
          aria-expanded={!collapsed}
        >
          <span className={styles.titleText}>{title}</span>
          <ChevronDown className={styles.collapseIcon} size={18} aria-hidden="true" />
        </button>
      </header>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>{children}</div>
      </div>
    </section>
  );
}
