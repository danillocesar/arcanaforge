import { useState } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import TextField from '../../ui/TextField/TextField';
import { OFFICIAL_CONDITIONS } from '../../../data/conditions';
import { conditionToFormValues } from '../SheetForm/entityForms';
import type { FormValues } from '../SheetForm/SheetForm';
import styles from './ConditionPicker.module.css';

interface ConditionPickerProps {
  open: boolean;
  onClose: () => void;
  /** `null` significa "Personalizado" — o chamador deve abrir o formulário em branco. */
  onPick: (values: FormValues | null) => void;
}

/** Passo intermediário do "+ Buff": escolher uma condição oficial pré-preenchida ou partir do zero. */
function ConditionPicker({ open, onClose, onPick }: ConditionPickerProps) {
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();
  const visible = query
    ? OFFICIAL_CONDITIONS.filter((c) => c.name.toLowerCase().includes(query))
    : OFFICIAL_CONDITIONS;

  const pick = (values: FormValues | null) => {
    setSearch('');
    onPick(values);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Adicionar Buff / Condição">
      <button type="button" className={styles.customBtn} onClick={() => pick(null)}>
        + Personalizado
      </button>

      <TextField
        className={styles.search}
        value={search}
        onChange={setSearch}
        placeholder="Buscar condição oficial…"
      />

      <div className={styles.list}>
        {visible.map((condition) => (
          <button
            key={condition.name}
            type="button"
            className={styles.item}
            onClick={() => pick(conditionToFormValues(condition))}
          >
            <span className={styles.itemName}>{condition.name}</span>
            <span className={styles.itemDesc}>{condition.description}</span>
          </button>
        ))}
        {visible.length === 0 && <p className={styles.empty}>Nenhuma condição encontrada.</p>}
      </div>
    </Sheet>
  );
}

ConditionPicker.displayName = 'ConditionPicker';

export default ConditionPicker;
