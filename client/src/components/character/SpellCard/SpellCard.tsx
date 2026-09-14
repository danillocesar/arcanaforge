import { useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import type { Spell, Enhancement } from '../../../types/character';
import NumericInput from '../../ui/NumericInput/NumericInput';
import ConfirmModal from '../../ui/ConfirmModal/ConfirmModal';
import styles from './SpellCard.module.css';

interface SpellCardProps {
  index: number;
  onCast: (idx: number) => void;
}

export default function SpellCard({ index, onCast }: SpellCardProps) {
  const { character, updateCharacter } = useCharacterContext();
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!character) return null;

  const spell = character.spells[index];
  if (!spell) return null;

  const updateSpell = (updates: Partial<Spell>) => {
    updateCharacter((f) => {
      const spells = [...f.spells];
      spells[index] = { ...spells[index], ...updates };
      return { ...f, spells };
    });
  };

  const removeSpell = () => {
    updateCharacter((f) => ({ ...f, spells: f.spells.filter((_, i) => i !== index) }));
  };

  const enhancements = Array.isArray(spell.enhancements) ? spell.enhancements : [];

  const addEnhancement = () => {
    updateSpell({
      enhancements: [...enhancements, { description: '', mpCost: 0 }],
    });
  };

  const updateEnhancement = (aIdx: number, updates: Partial<Enhancement>) => {
    const next = [...enhancements];
    next[aIdx] = { ...next[aIdx], ...updates };
    updateSpell({ enhancements: next });
  };

  const removeEnhancement = (aIdx: number) => {
    updateSpell({ enhancements: enhancements.filter((_, i) => i !== aIdx) });
  };

  const fields = [
    { key: 'name' as const, label: 'Nome' },
    { key: 'school' as const, label: 'Escola' },
    { key: 'castingTime' as const, label: 'Execução' },
    { key: 'range' as const, label: 'Alcance' },
    { key: 'area' as const, label: 'Área' },
    { key: 'duration' as const, label: 'Duração' },
    { key: 'resistance' as const, label: 'Resistência' },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.cardActions}>
        <button className={styles.cast} onClick={() => onCast(index)} title="Conjurar" aria-label="Conjurar magia">
          <Sparkles size={18} aria-hidden="true" />
        </button>
        <button className={styles.remove} onClick={() => setConfirmRemove(true)} title="Remover" aria-label="Remover magia">
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.grid}>
        {fields.map((f) => (
          <div key={f.key} className={styles.field}>
            <label>{f.label}</label>
            <input
              value={spell[f.key] || ''}
              onChange={(e) => updateSpell({ [f.key]: e.target.value })}
            />
          </div>
        ))}
        <div className={`${styles.field} ${styles.pmField}`}>
          <label>Custo PM</label>
          <NumericInput
            value={spell.mpCost}
            onChange={(n) => updateSpell({ mpCost: n })}
          />
        </div>
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label>Efeito</label>
          <textarea
            rows={3}
            value={spell.description}
            onChange={(e) => updateSpell({ description: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.enhancements}>
        <div className={styles.aprHeader}>
          <span className={styles.aprTitle}>Aprimoramentos</span>
        </div>
        {enhancements.map((enh, aIdx) => (
          <div key={aIdx} className={styles.enhRow}>
            <input
              className={styles.enhDesc}
              value={enh.description}
              onChange={(e) => updateEnhancement(aIdx, { description: e.target.value })}
              placeholder="Descrição"
            />
            <NumericInput
              className={styles.enhMp}
              value={enh.mpCost}
              onChange={(n) => updateEnhancement(aIdx, { mpCost: n })}
              placeholder="PM"
            />
            <button className={styles.removeSm} onClick={() => removeEnhancement(aIdx)} aria-label="Remover aprimoramento">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        <button className={styles.addApr} onClick={addEnhancement}>+ Aprimoramento</button>
      </div>

      <ConfirmModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={removeSpell}
        title="Remover magia?"
        message={`Isso apaga "${spell.name || 'Magia'}" da ficha.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}
