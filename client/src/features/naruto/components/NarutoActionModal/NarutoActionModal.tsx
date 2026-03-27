import type { ReactNode } from 'react';
import Modal from '../../../../components/ui/Modal/Modal';
import styles from './NarutoActionModal.module.css';

interface NarutoActionModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
}

export default function NarutoActionModal({ open, title, onClose, children, actions }: NarutoActionModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.frame}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button className={styles.closeBtn} onClick={onClose} title="Fechar">&#x2715;</button>
          </div>

          <div className={styles.body}>
            {children}
          </div>

          <div className={styles.actions}>
            {actions}
          </div>
        </div>
      </div>
    </Modal>
  );
}
