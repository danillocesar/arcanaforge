import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCharacterContextOptional } from '../../../contexts/CharacterContext';
import { isSectionKeyActive, SECTION_ID_LEGACY_PT } from '../../../data/constants';
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
  const charCtx = useCharacterContextOptional();
  const isControlled = charCtx?.character != null;

  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);

  const collapsed = isControlled
    ? isSectionKeyActive(charCtx!.character!.collapsedSections, id)
    : localCollapsed;

  const toggleCollapse = () => {
    if (isControlled) {
      charCtx!.updateCharacter((f) => {
        const was = isSectionKeyActive(f.collapsedSections, id);
        const next = { ...f.collapsedSections };
        Object.entries(SECTION_ID_LEGACY_PT).forEach(([pt, en]) => {
          if (en === id) delete next[pt];
        });
        next[id] = !was;
        return { ...f, collapsedSections: next };
      });
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
