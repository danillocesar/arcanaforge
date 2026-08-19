import { useState } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import TextField from '../../ui/TextField/TextField';
import { OFFICIAL_SPELLS } from '../../../data/spells';
import { spellToFormValues } from '../SheetForm/entityForms';
import { normalizeSearch } from '../../../utils/formatters';
import { useInfiniteList } from '../../../hooks/useInfiniteList';
import type { FormValues } from '../SheetForm/SheetForm';
import styles from './SpellPicker.module.css';

const LEVELS = [1, 2, 3, 4, 5];

interface SpellPickerProps {
  open: boolean;
  onClose: () => void;
  /** `null` significa "Personalizado" — o chamador deve abrir o formulário em branco. */
  onPick: (values: FormValues | null) => void;
}

/** Passo intermediário do "+ Magia": escolher uma magia oficial pré-preenchida ou partir do zero. */
function SpellPicker({ open, onClose, onPick }: SpellPickerProps) {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<number | null>(null);

  const query = normalizeSearch(search);
  const matches = OFFICIAL_SPELLS.filter((spell) => {
    if (level != null && spell.spellLevel !== level) return false;
    if (!query) return true;
    return normalizeSearch(`${spell.name} ${spell.school}`).includes(query);
  });

  // O catálogo tem 200+ magias: renderizar tudo de uma vez travava a abertura e
  // cada tecla digitada. Mostra uma página e cresce ao rolar.
  const { visible, hasMore, sentinelRef } = useInfiniteList(matches, `${query}|${level}`);

  const pick = (values: FormValues | null) => {
    setSearch('');
    setLevel(null);
    onPick(values);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Adicionar Magia">
      <button type="button" className={styles.customBtn} onClick={() => pick(null)}>
        + Personalizado
      </button>

      <TextField
        className={styles.search}
        value={search}
        onChange={setSearch}
        placeholder="Buscar magia oficial…"
      />

      <div className={styles.levels}>
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            className={`${styles.levelChip} ${level === lvl ? styles.levelChipActive : ''}`}
            onClick={() => setLevel((prev) => (prev === lvl ? null : lvl))}
          >
            {lvl}º
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {visible.map((spell) => (
          <button
            key={`${spell.name}-${spell.spellLevel}`}
            type="button"
            className={styles.item}
            onClick={() => pick(spellToFormValues(spell))}
          >
            <span className={styles.itemName}>{spell.name}</span>
            <span className={styles.itemMeta}>
              {spell.spellLevel}º círculo · {spell.school} · {spell.spellType}
            </span>
          </button>
        ))}
        {visible.length === 0 && (
          // Beco sem saída vira atalho: o catálogo é incompleto, então quem buscou
          // uma magia que não está nele cadastra na hora, já com o nome digitado.
          search.trim() ? (
            <button
              type="button"
              className={styles.emptyAction}
              onClick={() => pick({ name: search.trim() })}
            >
              <span className={styles.emptyActionLead}>Nenhuma magia encontrada.</span>
              <span className={styles.emptyActionCta}>
                + Criar “{search.trim()}” como magia personalizada
              </span>
            </button>
          ) : (
            <p className={styles.empty}>Nenhuma magia encontrada.</p>
          )
        )}
        {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
      </div>
    </Sheet>
  );
}

SpellPicker.displayName = 'SpellPicker';

export default SpellPicker;
