import { useState } from 'react';
import Modal from '../../ui/Modal/Modal';
import Input from '../../ui/Input/Input';
import Button from '../../ui/Button/Button';
import styles from './ProposeSessionModal.module.css';

export interface ProposeSlot {
  date: string;
  time: string;
}

interface ProposeSessionModalProps {
  /** Slot clicado na agenda. `null` fecha a modal. Cada abertura deve passar um
   *  objeto novo — é a identidade dele que reinicia os campos. */
  slot: ProposeSlot | null;
  onClose: () => void;
  onSubmit: (date: string, time: string) => Promise<void>;
}

export default function ProposeSessionModal({ slot, onClose, onSubmit }: ProposeSessionModalProps) {
  const [lastSlot, setLastSlot] = useState(slot);
  const [date, setDate] = useState(slot?.date ?? '');
  const [time, setTime] = useState(slot?.time ?? '');
  const [submitting, setSubmitting] = useState(false);

  // Reinicia os campos ao abrir num slot novo, ajustando estado durante o render
  // em vez de num effect. Fechar (slot null) não limpa nada, para não piscar
  // campos vazios durante a animação de saída.
  if (slot && slot !== lastSlot) {
    setLastSlot(slot);
    setDate(slot.date);
    setTime(slot.time);
    setSubmitting(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(date, time);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={slot != null} onClose={onClose}>
      <form className={styles.panel} onSubmit={handleSubmit}>
        <h3 className={styles.title}>Propor sessão</h3>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="propose-modal-date">Data</label>
            <Input
              id="propose-modal-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="propose-modal-time">Horário (opcional)</label>
            <Input
              id="propose-modal-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!date || submitting}>
            {submitting ? 'Propondo...' : 'Propor data'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
