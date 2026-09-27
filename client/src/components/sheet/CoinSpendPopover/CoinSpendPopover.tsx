import { useState, type RefObject } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import type { Coins } from '../../../types/character';
import { showToast } from '../../../services/toastService';
import Popover from '../../ui/Popover/Popover';
import Button from '../../ui/Button/Button';
import styles from './CoinSpendPopover.module.css';

interface CoinSpendPopoverProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  coin: keyof Coins;
  /** Sigla da moeda (TC, T$, TO). */
  label: string;
}

/**
 * "Gastar": digita a quantia e ela sai do saldo da moeda, com prévia "120 → 105".
 * Não deixa o saldo ficar negativo e registra o gasto no Histórico.
 */
function CoinSpendPopover({ open, anchorRef, onClose, coin, label }: CoinSpendPopoverProps) {
  const { character, updateCharacter } = useCharacterContext();
  // O pai monta com `key` por moeda, então cada abertura começa com o campo vazio.
  const [draft, setDraft] = useState('');

  if (!character) return null;

  const balance = character.coins?.[coin] ?? 0;
  const amount = Number(draft);
  const typed = draft.trim() !== '' && Number.isInteger(amount) && amount > 0;
  const insufficient = typed && amount > balance;
  const valid = typed && !insufficient;

  const confirm = () => {
    if (!valid) return;
    updateCharacter((f) => {
      const current = f.coins?.[coin] ?? 0;
      const next = Math.max(0, current - amount);
      return {
        ...f,
        coins: { ...f.coins, [coin]: next },
        logs: [
          ...f.logs,
          {
            type: 'spend',
            name: `Gastou ${amount} ${label}`,
            mpSpent: 0,
            timestamp: Date.now(),
            details: `${label} ${current} → ${next}`,
          },
        ],
      };
    });
    showToast(`−${amount} ${label}`, 'default');
    onClose();
  };

  const inputId = `coin-spend-${coin}`;

  return (
    <Popover open={open} anchorRef={anchorRef} onClose={onClose} align="start" className={styles.pop}>
      <label className={styles.head} htmlFor={inputId}>Gastar {label}</label>
      <input
        id={inputId}
        className={styles.amount}
        type="text"
        inputMode="numeric"
        value={draft}
        autoFocus
        placeholder="0"
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            confirm();
          }
        }}
      />
      <div className={`${styles.preview} ${insufficient ? styles.warn : ''}`.trim()} aria-live="polite">
        {insufficient ? (
          <>Saldo insuficiente: você tem {balance} {label}.</>
        ) : valid ? (
          <>{balance} → <b>{balance - amount}</b> {label}</>
        ) : (
          <>Saldo: {balance} {label}</>
        )}
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" className={styles.flex} onClick={onClose}>Cancelar</Button>
        <Button variant="primary" className={styles.flex} onClick={confirm} disabled={!valid}>Gastar</Button>
      </div>
    </Popover>
  );
}

CoinSpendPopover.displayName = 'CoinSpendPopover';

export default CoinSpendPopover;
