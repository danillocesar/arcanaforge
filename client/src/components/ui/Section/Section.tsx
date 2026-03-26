import { useState, type ReactNode } from 'react';
import { useFichaContextOptional } from '../../../contexts/FichaContext';
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
  const fichaCtx = useFichaContextOptional();
  const isControlled = fichaCtx?.ficha != null;

  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);

  const collapsed = isControlled
    ? !!fichaCtx!.ficha!.secoesFechadas?.[id]
    : localCollapsed;

  const toggleCollapse = () => {
    if (isControlled) {
      fichaCtx!.updateFicha((f) => ({
        ...f,
        secoesFechadas: { ...f.secoesFechadas, [id]: !f.secoesFechadas?.[id] },
      }));
    } else {
      setLocalCollapsed((c) => !c);
    }
  };

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
      <h2 onClick={toggleCollapse}>
        {title}
        <button type="button" className={styles.collapseBtn}>▼</button>
      </h2>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
