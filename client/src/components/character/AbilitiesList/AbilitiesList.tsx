import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import type { Ability } from '../../../types/character';
import styles from './AbilitiesList.module.css';

export default function AbilitiesList() {
  const { character, updateCharacter } = useCharacterContext();
  if (!character) return null;

  const updateAbility = (idx: number, updates: Partial<Ability>) => {
    updateCharacter(f => {
      const abilities = [...f.abilities];
      abilities[idx] = { ...abilities[idx], ...updates };
      return { ...f, abilities };
    });
  };

  const addAbility = () => {
    updateCharacter(f => ({
      ...f,
      abilities: [
        ...f.abilities,
        { name: '', source: '', type: '', mpCost: 0, description: '' },
      ],
    }));
  };

  const removeAbility = (idx: number) => {
    updateCharacter(f => ({ ...f, abilities: f.abilities.filter((_, i) => i !== idx) }));
  };

  return (
    <Section id="secHabilidades" title="Habilidades & Poderes">
      {character.abilities.map((ab, idx) => (
        <div key={idx} className={styles.card}>
          <button className={styles.remove} onClick={() => removeAbility(idx)}>✕</button>
          <div className={styles.header}>
            <input
              className={styles.nomeInput}
              value={ab.name}
              onChange={e => updateAbility(idx, { name: e.target.value })}
              placeholder="Nome"
            />
            <input
              className={styles.smallInput}
              value={ab.source || ''}
              onChange={e => updateAbility(idx, { source: e.target.value })}
              placeholder="Origem"
            />
            <input
              className={styles.smallInput}
              value={ab.type || ''}
              onChange={e => updateAbility(idx, { type: e.target.value })}
              placeholder="Tipo"
            />
            <input
              className={styles.smallInput}
              type="number"
              value={ab.mpCost || 0}
              onChange={e => updateAbility(idx, { mpCost: Number(e.target.value) || 0 })}
              placeholder="PM"
            />
          </div>
          <textarea
            className={styles.desc}
            rows={2}
            value={ab.description}
            onChange={e => updateAbility(idx, { description: e.target.value })}
            placeholder="Descrição"
          />
        </div>
      ))}
      <Button variant="add" onClick={addAbility}>+ Habilidade</Button>
    </Section>
  );
}
