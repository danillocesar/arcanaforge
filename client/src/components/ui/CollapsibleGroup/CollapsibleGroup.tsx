import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCollapsedSection } from '../../../hooks/useCollapsedSection';
import styles from './CollapsibleGroup.module.css';

interface CollapsibleGroupProps {
  /** Chave de persistência em `character.collapsedSections` — estável por grupo. */
  id: string;
  title: string;
  /** Contagem à direita do título (ex.: quantos poderes o grupo tem). */
  count?: number;
  /** Destaca o grupo com a cor de acento — para a prateleira fixa no topo. */
  accent?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Grupo colapsável no visual das abas novas da ficha: cabeçalho leve com contagem
 * e chevron, sem o card/borda do `ui/Section` — o conteúdo já são cards. O estado
 * aberto/fechado persiste por personagem via {@link useCollapsedSection}.
 */
function CollapsibleGroup({
  id,
  title,
  count,
  accent = false,
  defaultCollapsed = false,
  children,
  className,
}: CollapsibleGroupProps) {
  const [collapsed, toggle] = useCollapsedSection(id, defaultCollapsed);

  const cls = [
    styles.group,
    collapsed ? styles.collapsed : '',
    accent ? styles.accent : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={cls}>
      <button type="button" className={styles.head} onClick={toggle} aria-expanded={!collapsed}>
        <span className={styles.title}>{title}</span>
        {count != null && <span className={styles.count}>{count}</span>}
        <ChevronDown className={styles.chev} size={15} aria-hidden="true" />
      </button>
      {!collapsed && <div className={styles.body}>{children}</div>}
    </section>
  );
}

CollapsibleGroup.displayName = 'CollapsibleGroup';

export default CollapsibleGroup;
