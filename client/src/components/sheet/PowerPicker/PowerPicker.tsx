import { useState, useEffect } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import TextField from '../../ui/TextField/TextField';
import { OFFICIAL_POWERS } from '../../../data/powers';
import type { PowerCategory } from '../../../data/powers';
import { powerToFormValues } from '../SheetForm/entityForms';
import type { FormValues } from '../SheetForm/SheetForm';
import styles from './PowerPicker.module.css';

const CATEGORIES: PowerCategory[] = ['Combate', 'Destino', 'Magia', 'Concedido', 'Tormenta'];

interface PowerPickerProps {
  open: boolean;
  onClose: () => void;
  /** `null` significa "Personalizado" — o chamador deve abrir o formulário em branco. */
  onPick: (values: FormValues | null) => void;
  /** Pré-seleciona a categoria ao abrir (ex.: OriginPicker restringindo a um poder de combate). */
  initialCategory?: PowerCategory;
}

/** Passo intermediário do "+ Poder / Hab.": escolher um poder geral oficial pré-preenchido ou partir do zero. */
function PowerPicker({ open, onClose, onPick, initialCategory }: PowerPickerProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PowerCategory | null>(initialCategory ?? null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setCategory(initialCategory ?? null);
    }
  }, [open, initialCategory]);

  const query = search.trim().toLowerCase();
  const visible = OFFICIAL_POWERS.filter((power) => {
    if (category != null && power.category !== category) return false;
    if (query && !power.name.toLowerCase().includes(query)) return false;
    return true;
  });

  const pick = (values: FormValues | null) => {
    setSearch('');
    setCategory(null);
    onPick(values);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Adicionar Poder">
      <button type="button" className={styles.customBtn} onClick={() => pick(null)}>
        + Personalizado
      </button>

      <TextField
        className={styles.search}
        value={search}
        onChange={setSearch}
        placeholder="Buscar poder oficial…"
      />

      <div className={styles.categories}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`${styles.categoryChip} ${category === cat ? styles.categoryChipActive : ''}`}
            onClick={() => setCategory((prev) => (prev === cat ? null : cat))}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {visible.map((power) => (
          <button
            key={`${power.category}-${power.name}`}
            type="button"
            className={styles.item}
            onClick={() => pick(powerToFormValues(power))}
          >
            <span className={styles.itemName}>{power.name}</span>
            <span className={styles.itemMeta}>
              {power.category}
              {power.domain ? ` (${power.domain})` : ''}
              {power.prerequisite ? ` · Pré-req.: ${power.prerequisite}` : ''}
            </span>
          </button>
        ))}
        {visible.length === 0 && <p className={styles.empty}>Nenhum poder encontrado.</p>}
      </div>
    </Sheet>
  );
}

PowerPicker.displayName = 'PowerPicker';

export default PowerPicker;
