import { useState } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import TextField from '../../ui/TextField/TextField';
import { enhancementsFor } from '../../../utils/itemEnhancements';
import { normalizeSearch } from '../../../utils/formatters';
import type { ItemEnhancementTarget, OfficialItemEnhancement } from '../../../data/itemEnhancements';
import styles from './ItemEnhancementPicker.module.css';

const KIND_LABEL: Record<OfficialItemEnhancement['kind'], string> = {
  melhoria: 'Melhoria',
  encanto: 'Encanto',
};

interface ItemEnhancementPickerProps {
  open: boolean;
  target: ItemEnhancementTarget;
  onClose: () => void;
  onPick: (entry: OfficialItemEnhancement) => void;
  /** Nomes já aplicados no item — ficam marcados e não somam de novo. */
  applied: string[];
}

/** Catálogo de melhorias (item superior) e encantos (item mágico) do T20. */
function ItemEnhancementPicker({ open, target, onClose, onPick, applied }: ItemEnhancementPickerProps) {
  const [search, setSearch] = useState('');

  const query = normalizeSearch(search);
  const visible = enhancementsFor(target).filter((entry) => {
    if (!query) return true;
    return normalizeSearch(`${entry.name} ${entry.description}`).includes(query);
  });

  const isApplied = (entry: OfficialItemEnhancement) => applied.includes(entry.name);

  return (
    <Sheet open={open} onClose={onClose} title="Melhorias & Encantos">
      <TextField
        className={styles.search}
        value={search}
        onChange={setSearch}
        placeholder="Buscar melhoria ou encanto…"
      />

      <div className={styles.list}>
        {visible.map((entry) => (
          <button
            key={`${entry.kind}-${entry.name}`}
            type="button"
            className={`${styles.item} ${isApplied(entry) ? styles.itemApplied : ''}`.trim()}
            onClick={() => onPick(entry)}
            disabled={isApplied(entry)}
          >
            <span className={styles.itemHead}>
              <span className={styles.itemName}>{entry.name}</span>
              <span className={styles.itemKind}>{KIND_LABEL[entry.kind]}</span>
              {isApplied(entry) && <span className={styles.itemCheck}>✓ aplicada</span>}
            </span>
            <span className={styles.itemDesc}>{entry.description}</span>
            {entry.prerequisite && (
              <span className={styles.itemPre}>Pré-requisito: {entry.prerequisite}</span>
            )}
          </button>
        ))}
        {visible.length === 0 && <p className={styles.empty}>Nenhuma melhoria encontrada.</p>}
      </div>
    </Sheet>
  );
}

ItemEnhancementPicker.displayName = 'ItemEnhancementPicker';

export default ItemEnhancementPicker;
