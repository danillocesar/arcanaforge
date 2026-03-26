import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../features/auth';
import styles from './Topbar.module.css';

interface TopbarProps {
  title?: string;
  right?: ReactNode;
}

export default function Topbar({ title, right }: TopbarProps) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isPersonagens =
    pathname === '/characters' ||
    pathname.endsWith('/char');

  const isGrupos =
    pathname === '/parties' ||
    pathname.startsWith('/parties/') ||
    pathname.includes('/party/');

  const displayName = useMemo(() => {
    if (!user) return 'Conta';
    if (user.displayName?.trim()) return user.displayName.trim();
    if (user.email?.includes('@')) return user.email.split('@')[0];
    return 'Usuário';
  }, [user]);

  const displayEmail = user?.email || 'Sem e-mail';
  const initials = useMemo(() => {
    const source = (user?.displayName || user?.email || 'U').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
  }, [user]);

  useEffect(() => {
    function handlePointerDown(evt: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(evt.target as Node)) {
        setOpenMenu(false);
      }
    }

    function handleEsc(evt: KeyboardEvent) {
      if (evt.key === 'Escape') {
        setOpenMenu(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    setOpenMenu(false);
  }

  return (
    <nav className={styles.topbar}>
      <div className={styles.topRow}>
        <div className={styles.topLeft}>
          <img
            src="/assets/transparent-logo.svg"
            alt="ArcanaForge"
            className={styles.logoImage}
            loading="eager"
          />
          {title && (
            <>
              <span className={styles.separator}>/</span>
              <span className={styles.title}>{title}</span>
            </>
          )}
        </div>
        <div className={styles.topRight}>
          {right}
          <div className={styles.userMenuWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.userMenuButton}
              onClick={() => setOpenMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={openMenu}
              aria-label="Menu da conta"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={displayName} className={styles.userAvatarImg} />
              ) : (
                <span className={styles.userAvatar}>{initials}</span>
              )}
              <span className={styles.userMeta}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userEmail}>{displayEmail}</span>
              </span>
            </button>

            {openMenu && (
              <div className={styles.userDropdown} role="menu">
                <div className={styles.dropdownUserInfo}>
                  <span className={styles.dropdownUserName}>{displayName}</span>
                  <span className={styles.dropdownUserEmail}>{displayEmail}</span>
                </div>
                <button
                  type="button"
                  className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.navRow}>
        <Link
          to="/characters"
          className={`${styles.navLink} ${isPersonagens ? styles.navLinkActive : ''}`}
        >
          Personagens
        </Link>
        <Link
          to="/parties"
          className={`${styles.navLink} ${isGrupos ? styles.navLinkActive : ''}`}
        >
          Grupos
        </Link>
      </div>
    </nav>
  );
}

export { styles as topbarStyles };
