import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth';
import Sheet from '../../ui/Sheet/Sheet';
import styles from './MobileAppMenu.module.css';

interface MobileAppMenuProps {
  open: boolean;
  onClose: () => void;
}

function initialsOf(source: string): string {
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/** Mobile-only app menu (replaces the Topbar on phones): app navigation + account. */
function MobileAppMenu({ open, onClose }: MobileAppMenuProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const displayName = user?.displayName?.trim()
    || user?.email?.split('@')[0]
    || 'Conta';
  const email = user?.email || 'Sem e-mail';
  const initials = initialsOf(user?.displayName || user?.email || 'U');

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <Sheet open={open} title="Menu" onClose={onClose}>
      <nav className={styles.nav} aria-label="Navegação do app">
        <button type="button" className={styles.navItem} onClick={() => go('/characters')}>
          <span className={styles.navIco} aria-hidden="true">⚔</span>
          <span>Personagens</span>
        </button>
        <button type="button" className={styles.navItem} onClick={() => go('/parties')}>
          <span className={styles.navIco} aria-hidden="true">🛡</span>
          <span>Grupos</span>
        </button>
      </nav>

      <div className={styles.account}>
        <div className={styles.user}>
          {user?.photoURL ? (
            <img className={styles.avatarImg} src={user.photoURL} alt="" />
          ) : (
            <span className={styles.avatar}>{initials}</span>
          )}
          <div className={styles.userMeta}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userEmail}>{email}</span>
          </div>
        </div>
        <button type="button" className={styles.signOut} onClick={handleSignOut}>
          Sair
        </button>
      </div>
    </Sheet>
  );
}

MobileAppMenu.displayName = 'MobileAppMenu';

export default MobileAppMenu;
