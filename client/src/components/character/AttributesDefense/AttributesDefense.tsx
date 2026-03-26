import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getEffectiveAttribute, calcTotalDefense, formatMod } from '../../../utils/calculations';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import type { AttributeId } from '../../../types/character';
import Section from '../../ui/Section/Section';
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
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
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
          <button type="button" className={styles.editPencil} onClick={startEdit}>✎</button>
        </>
      )}
    </div>
  );
}

export default function AttributesDefense() {
  const { character, updateCharacter } = useCharacterContext();

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

  return (
    <Section id="secAtributos" title="Atributos & Defesa">
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
                <input
                  type="number"
                  value={item.value ?? 0}
                  onChange={(e) => updateDefenseItem(i, 'value', Number(e.target.value) || 0)}
                  title="Bônus de Defesa"
                />
                <span className={styles.penaltyLabel}>Pen:</span>
                <input
                  type="number"
                  className={styles.defensePenInput}
                  value={item.penalty ?? 0}
                  onChange={(e) => updateDefenseItem(i, 'penalty', Number(e.target.value) || 0)}
                  title="Penalidade de Armadura"
                />
                <button type="button" className={styles.defenseRemove} onClick={() => removeDefenseItem(i)}>✕</button>
              </div>
            ))}
          </div>

          <button type="button" className={styles.addDefense} onClick={addDefenseItem}>+ Adicionar proteção</button>
        </div>
      </div>
    </Section>
  );
}
