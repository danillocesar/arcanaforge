import { useState, type ReactNode } from 'react';
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
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const cls = [
    styles.section,
    collapsed ? styles.collapsed : '',
    hidden ? styles.hidden : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div id={id} className={cls}>
      <h2 onClick={() => setCollapsed(c => !c)}>
        {title}
        <button type="button" className={styles.collapseBtn}>▼</button>
      </h2>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
