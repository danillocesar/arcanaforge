import type { ReactNode } from 'react';
import styles from './Topbar.module.css';

interface TopbarProps {
  left: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export default function Topbar({ left, center, right }: TopbarProps) {
  return (
    <nav className={styles.topbar}>
      <div className={styles.left}>{left}</div>
      {center && <div className={styles.center}>{center}</div>}
      {right && <div className={styles.right}>{right}</div>}
    </nav>
  );
}

export { styles as topbarStyles };
