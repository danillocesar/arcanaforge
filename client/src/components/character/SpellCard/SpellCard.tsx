import { useCharacterContext } from '../../../contexts/CharacterContext';
import type { Spell, Enhancement } from '../../../types/character';
import styles from './SpellCard.module.css';

interface SpellCardProps {
  index: number;
  onCast: (idx: number) => void;
}

export default function SpellCard({ index, onCast }: SpellCardProps) {
  const { character, updateCharacter } = useCharacterContext();
  if (!character) return null;

  const spell = character.spells[index];
  if (!spell) return null;

  const updateSpell = (updates: Partial<Spell>) => {
    updateCharacter(f => {
      const spells = [...f.spells];
      spells[index] = { ...spells[index], ...updates };
      return { ...f, spells };
    });
  };

  const removeSpell = () => {
    updateCharacter(f => ({ ...f, spells: f.spells.filter((_, i) => i !== index) }));
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
      <button className={styles.cast} onClick={() => onCast(index)} title="Conjurar">
        ✨
      </button>
      <button className={styles.remove} onClick={removeSpell} title="Remover">✕</button>

      <div className={styles.grid}>
        {fields.map(f => (
          <div key={f.key} className={styles.field}>
            <label>{f.label}</label>
            <input
              value={spell[f.key] || ''}
              onChange={e => updateSpell({ [f.key]: e.target.value })}
            />
          </div>
        ))}
        <div className={`${styles.field} ${styles.pmField}`}>
          <label>Custo PM</label>
          <input
            type="number"
            value={spell.mpCost}
            onChange={e => updateSpell({ mpCost: Number(e.target.value) || 0 })}
          />
        </div>
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label>Efeito</label>
          <textarea
            rows={3}
            value={spell.description}
            onChange={e => updateSpell({ description: e.target.value })}
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
              onChange={e => updateEnhancement(aIdx, { description: e.target.value })}
              placeholder="Descrição"
            />
            <input
              className={styles.enhMp}
              type="number"
              value={enh.mpCost}
              onChange={e => updateEnhancement(aIdx, { mpCost: Number(e.target.value) || 0 })}
              placeholder="PM"
            />
            <button className={styles.removeSm} onClick={() => removeEnhancement(aIdx)}>
              ✕
            </button>
          </div>
        ))}
        <button className={styles.addApr} onClick={addEnhancement}>+ Aprimoramento</button>
      </div>
    </div>
  );
}
