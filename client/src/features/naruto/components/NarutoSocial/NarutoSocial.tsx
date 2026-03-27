import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { NARUTO_SOCIAL_SKILLS } from '../../data/narutoSocialSkills';
import { calcSocialSkillTotal } from '../../utils/narutoCalculations';
import Section from '../../../../components/ui/Section/Section';
import styles from './NarutoSocial.module.css';

export default function NarutoSocial() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const carisma = character.social?.carisma ?? 0;
  const manipulacao = character.social?.manipulacao ?? 0;

  const setSocial = (field: 'carisma' | 'manipulacao', value: number) => {
    updateCharacter((f) => ({
      ...f,
      social: { ...f.social!, [field]: value },
    }));
  };

  return (
    <Section id="secSocial" title="Atributos Sociais">
      <div className={styles.baseRow}>
        <div className={styles.baseCard}>
          <label className={styles.baseLabel}>Carisma</label>
          <input
            className={styles.baseInput}
            type="number"
            value={carisma}
            onChange={(e) => setSocial('carisma', Number(e.target.value) || 0)}
          />
        </div>
        <div className={styles.baseCard}>
          <label className={styles.baseLabel}>Manipulação</label>
          <input
            className={styles.baseInput}
            type="number"
            value={manipulacao}
            onChange={(e) => setSocial('manipulacao', Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className={styles.subSkills}>
        {NARUTO_SOCIAL_SKILLS.map((sk) => {
          const total = calcSocialSkillTotal(
            character,
            sk.base,
            sk.halfSkillId,
            sk.halfAttributeId,
          );
          return (
            <div key={sk.id} className={styles.subRow}>
              <span className={styles.subName}>{sk.name}</span>
              <span className={styles.subBase}>
                {sk.base === 'carisma' ? 'Car' : 'Man'}
              </span>
              <span className={styles.subTotal}>{total}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
