import type { ReactNode } from 'react';
import styles from './Drawer.module.css';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  position?: 'right';
}

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />
      <div className={`${styles.drawer} ${open ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </>
  );
}
