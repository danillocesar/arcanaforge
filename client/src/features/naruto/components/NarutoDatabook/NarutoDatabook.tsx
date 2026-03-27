import { useCharacterContext } from '../../../../contexts/CharacterContext';
import styles from './NarutoDatabook.module.css';

export default function NarutoDatabook() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const setField = (field: string, value: string) => {
    updateCharacter((f) => ({ ...f, [field]: value }));
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.drawerTitle}>Databook</h3>

      {character.avatar && (
        <div className={styles.avatarSection}>
          <img className={styles.avatar} src={character.avatar} alt="Avatar" />
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Lema / Nindo</label>
        <input
          className={styles.input}
          value={character.motto ?? ''}
          onChange={(e) => setField('motto', e.target.value)}
          placeholder="O caminho ninja do personagem..."
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Biografia</label>
        <textarea
          className={styles.textarea}
          value={character.biography ?? ''}
          onChange={(e) => setField('biography', e.target.value)}
          rows={10}
          placeholder="Historia do personagem..."
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Curiosidades</label>
        <textarea
          className={styles.textarea}
          value={character.curiosities ?? ''}
          onChange={(e) => setField('curiosities', e.target.value)}
          rows={5}
          placeholder="Fatos interessantes, manias, preferencias..."
        />
      </div>
    </div>
  );
}
