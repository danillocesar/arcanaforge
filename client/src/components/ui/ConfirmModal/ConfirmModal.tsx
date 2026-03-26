import { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  requireText?: string;
  requireTextLabel?: string;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Tem certeza?',
  message,
  icon,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  requireText,
  requireTextLabel,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!open) setInputValue('');
  }, [open]);

  const canConfirm = requireText == null || inputValue === requireText;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.panel}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <h3 className={styles.title}>{title}</h3>
        {message && <p className={styles.message}>{message}</p>}

        {requireText != null && (
          <div className={styles.requireBlock}>
            {requireTextLabel && (
              <label className={styles.requireLabel}>{requireTextLabel}</label>
            )}
            <input
              className={styles.requireInput}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
              spellCheck={false}
            />
          </div>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          {variant === 'danger' ? (
            <button
              type="button"
              className={styles.btnDanger}
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {confirmLabel}
            </button>
          ) : (
            <Button type="button" variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
