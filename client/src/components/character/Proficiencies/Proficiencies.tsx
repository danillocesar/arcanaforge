import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import styles from './Proficiencies.module.css';

export default function Proficiencies() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  return (
    <Section id="secProficiencies" title="Proficiências">
      <textarea
        className={styles.textarea}
        value={character.proficiencies}
        onChange={(e) => updateCharacter((f) => ({ ...f, proficiencies: e.target.value }))}
        placeholder="Armas, armaduras e escudos..."
      />
    </Section>
  );
}
