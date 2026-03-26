import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Topbar.module.css';

interface TopbarProps {
  title?: string;
  right?: ReactNode;
}

export default function Topbar({ title, right }: TopbarProps) {
  const { pathname } = useLocation();

  const isPersonagens =
    pathname === '/personagens' ||
    pathname.endsWith('/char');

  const isGrupos =
    pathname === '/grupos' ||
    pathname.startsWith('/grupos/') ||
    pathname.includes('/grupo/');

  return (
    <nav className={styles.topbar}>
      <div className={styles.topRow}>
        <div className={styles.topLeft}>
          <span className={styles.logo}>ArcanaForge</span>
          {title && (
            <>
              <span className={styles.separator}>/</span>
              <span className={styles.title}>{title}</span>
            </>
          )}
        </div>
        {right && <div className={styles.topRight}>{right}</div>}
      </div>
      <div className={styles.navRow}>
        <Link
          to="/personagens"
          className={`${styles.navLink} ${isPersonagens ? styles.navLinkActive : ''}`}
        >
          Personagens
        </Link>
        <Link
          to="/grupos"
          className={`${styles.navLink} ${isGrupos ? styles.navLinkActive : ''}`}
        >
          Grupos
        </Link>
      </div>
    </nav>
  );
}

export { styles as topbarStyles };
