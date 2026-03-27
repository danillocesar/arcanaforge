import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import styles from './TemporaryEffects.module.css';

export default function TemporaryEffects() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  return (
    <Section id="secEffects" title="Efeitos Temporários">
      <textarea
        className={styles.textarea}
        value={character.temporaryEffects}
        onChange={(e) => updateCharacter((f) => ({ ...f, temporaryEffects: e.target.value }))}
        placeholder="Efeitos ativos, condições..."
      />
    </Section>
  );
}
