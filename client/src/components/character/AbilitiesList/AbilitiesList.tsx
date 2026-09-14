import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import type { Ability } from '../../../types/character';
import NumericInput from '../../ui/NumericInput/NumericInput';
import ConfirmModal from '../../ui/ConfirmModal/ConfirmModal';
import styles from './AbilitiesList.module.css';

export default function AbilitiesList() {
  const { character, updateCharacter } = useCharacterContext();
  const [removeIdx, setRemoveIdx] = useState<number | null>(null);

  if (!character) return null;

  const updateAbility = (idx: number, updates: Partial<Ability>) => {
    updateCharacter((f) => {
      const abilities = [...f.abilities];
      abilities[idx] = { ...abilities[idx], ...updates };
      return { ...f, abilities };
    });
  };

  const addAbility = () => {
    updateCharacter((f) => ({
      ...f,
      abilities: [
        ...f.abilities,
        { name: '', source: '', type: '', mpCost: 0, description: '' },
      ],
    }));
  };

  const removeAbility = (idx: number) => {
    updateCharacter((f) => ({ ...f, abilities: f.abilities.filter((_, i) => i !== idx) }));
  };

  const abilityToRemove = removeIdx != null ? character.abilities[removeIdx] : null;

  return (
    <Section id="secAbilities" title="Habilidades & Poderes">
      {character.abilities.map((ab, idx) => (
        <div key={idx} className={styles.card}>
          <div className={styles.cardActions}>
            <button className={styles.remove} onClick={() => setRemoveIdx(idx)} aria-label="Remover habilidade">
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.header}>
            <input
              className={styles.nameInput}
              value={ab.name}
              onChange={(e) => updateAbility(idx, { name: e.target.value })}
              placeholder="Nome"
            />
            <input
              className={styles.smallInput}
              value={ab.source || ''}
              onChange={(e) => updateAbility(idx, { source: e.target.value })}
              placeholder="Origem"
            />
            <input
              className={styles.smallInput}
              value={ab.type || ''}
              onChange={(e) => updateAbility(idx, { type: e.target.value })}
              placeholder="Tipo"
            />
            <NumericInput
              className={styles.smallInput}
              value={ab.mpCost || 0}
              onChange={(n) => updateAbility(idx, { mpCost: n })}
              placeholder="PM"
            />
          </div>
          <textarea
            className={styles.desc}
            rows={3}
            value={ab.description}
            onChange={(e) => updateAbility(idx, { description: e.target.value })}
            placeholder="Descrição"
          />
        </div>
      ))}
      <Button variant="add" onClick={addAbility}>+ Habilidade</Button>

      <ConfirmModal
        open={removeIdx != null}
        onClose={() => setRemoveIdx(null)}
        onConfirm={() => {
          if (removeIdx != null) removeAbility(removeIdx);
        }}
        title="Remover habilidade?"
        message={`Isso apaga "${abilityToRemove?.name || 'Habilidade'}" da ficha.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </Section>
  );
}
