import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getEffectiveAttribute, calcTotalDefense, formatMod } from '../../../utils/calculations';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import type { AttributeId } from '../../../types/character';
import Section from '../../ui/Section/Section';
import NumericInput from '../../ui/NumericInput/NumericInput';
import ConfirmModal from '../../ui/ConfirmModal/ConfirmModal';
import styles from './AttributesDefense.module.css';

const ATTR_ORDER: AttributeId[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function AttributeCard({ attr }: { attr: AttributeId }) {
  const { character, updateCharacter } = useCharacterContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!character) return null;

  const base = character.attributes[attr] || 0;
  const effective = getEffectiveAttribute(character, attr);
  const isBuffed = effective !== base;

  const startEdit = () => {
    setDraft(String(base));
    setEditing(true);
  };

  const commitEdit = () => {
    const val = Number(draft);
    if (!isNaN(val)) {
      updateCharacter((f) => ({
        ...f,
        attributes: { ...f.attributes, [attr]: val },
      }));
    }
    setEditing(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.label}>{ATTRIBUTE_LABELS[attr]}</div>
      {editing ? (
        <input
          className={styles.editInput}
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
          autoFocus
        />
      ) : (
        <>
          <div className={`${styles.value} ${isBuffed ? styles.buffed : ''}`}>
            {formatMod(effective)}
          </div>
          {isBuffed && <div className={styles.baseVal}>({formatMod(base)})</div>}
          <button type="button" className={styles.editPencil} onClick={startEdit} aria-label="Editar atributo">
            <Pencil size={16} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

export default function AttributesDefense() {
  const { character, updateCharacter } = useCharacterContext();
  const [removeDefenseIdx, setRemoveDefenseIdx] = useState<number | null>(null);

  if (!character) return null;

  const totalDefense = calcTotalDefense(character);

  const updateDefenseItem = (idx: number, field: string, value: string | number) => {
    updateCharacter((f) => {
      const items = [...f.defense.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, defense: { ...f.defense, items } };
    });
  };

  const addDefenseItem = () => {
    updateCharacter((f) => ({
      ...f,
      defense: {
        ...f.defense,
        items: [...f.defense.items, { name: '', value: 0, penalty: 0 }],
      },
    }));
  };

  const removeDefenseItem = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      defense: { ...f.defense, items: f.defense.items.filter((_, i) => i !== idx) },
    }));
  };

  const defenseToRemove = removeDefenseIdx != null ? character.defense.items[removeDefenseIdx] : null;

  return (
    <Section id="secAttributes" title="Atributos & Defesa">
      <div className={styles.attrDefesaLayout}>
        <div className={styles.attributesGrid}>
          {ATTR_ORDER.map((attr) => (
            <AttributeCard key={attr} attr={attr} />
          ))}
        </div>

        <div className={styles.defenseInline}>
          <div className={styles.defenseTotal}>
            <span className={styles.defenseTotalLabel}>CA Total</span>
            <span className={styles.defenseTotalValue}>{totalDefense}</span>
          </div>

          <div className={styles.defenseBase}>
            <span className={styles.defenseBaseName}>Base</span>
            <span className={styles.defenseBaseValue}>10</span>
          </div>

          <div className={styles.defenseItems}>
            {character.defense.items.map((item, i) => (
              <div key={i} className={styles.defenseRow}>
                <input
                  type="text"
                  value={item.name ?? ''}
                  onChange={(e) => updateDefenseItem(i, 'name', e.target.value)}
                  placeholder="Nome"
                />
                <NumericInput
                  value={item.value ?? 0}
                  onChange={(n) => updateDefenseItem(i, 'value', n)}
                  title="Bônus de Defesa"
                />
                <span className={styles.penaltyLabel}>Pen:</span>
                <NumericInput
                  className={styles.defensePenInput}
                  value={item.penalty ?? 0}
                  onChange={(n) => updateDefenseItem(i, 'penalty', n)}
                  title="Penalidade de Armadura"
                />
                <button type="button" className={styles.defenseRemove} onClick={() => setRemoveDefenseIdx(i)} aria-label="Remover proteção">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" className={styles.addDefense} onClick={addDefenseItem}>+ Adicionar proteção</button>
        </div>
      </div>

      <ConfirmModal
        open={removeDefenseIdx != null}
        onClose={() => setRemoveDefenseIdx(null)}
        onConfirm={() => {
          if (removeDefenseIdx != null) removeDefenseItem(removeDefenseIdx);
        }}
        title="Remover proteção?"
        message={`Isso apaga "${defenseToRemove?.name || 'Proteção'}" da defesa.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </Section>
  );
}
