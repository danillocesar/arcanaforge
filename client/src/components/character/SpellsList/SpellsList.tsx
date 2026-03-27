import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import SpellCard from '../SpellCard/SpellCard';
import CastSpellModal from '../CastSpellModal/CastSpellModal';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import { calcSpellResistance } from '../../../utils/calculations';
import type { AttributeId } from '../../../types/character';
import styles from './SpellsList.module.css';

export default function SpellsList() {
  const { character, updateCharacter } = useCharacterContext();
  const [castIdx, setCastIdx] = useState<number | null>(null);
  if (!character) return null;

  const spellRes = calcSpellResistance(character);

  const addSpell = () => {
    updateCharacter(f => ({
      ...f,
      spells: [
        ...f.spells,
        {
          name: '',
          school: '',
          castingTime: '',
          range: '',
          area: '',
          duration: '',
          resistance: '',
          mpCost: 0,
          spellLevel: 0,
          enhancements: [],
          description: '',
        },
      ],
    }));
  };

  return (
    <Section id="secSpells" title="Magias">
      <div className={styles.headerRow}>
        <label>Atributo-chave</label>
        <select
          value={character.spellcastingAttribute}
          onChange={e =>
            updateCharacter(f => ({ ...f, spellcastingAttribute: e.target.value as AttributeId }))
          }
        >
          {(Object.entries(ATTRIBUTE_LABELS) as [AttributeId, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label>Teste de Resistência</label>
        <span className={styles.resistencia}>{spellRes}</span>
      </div>
      {character.spells.map((_, idx) => (
        <SpellCard key={idx} index={idx} onCast={setCastIdx} />
      ))}
      <Button variant="add" onClick={addSpell}>+ Magia</Button>
      <CastSpellModal spellIdx={castIdx} onClose={() => setCastIdx(null)} />
    </Section>
  );
}
