import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import AttackCard from '../AttackCard/AttackCard';
import { calcSpellResistance } from '../../../utils/calculations';
import styles from './AttacksList.module.css';

export default function AttacksList() {
  const { character, updateCharacter } = useCharacterContext();
  if (!character) return null;

  const spellResistance = calcSpellResistance(character);

  const addAttack = () => {
    updateCharacter((f) => ({
      ...f,
      attacks: [
        ...f.attacks,
        {
          name: '',
          damage: '',
          critical: '20/x2',
          type: '',
          rangeType: 'melee',
          mpCost: 0,
          attributeDamageBonus: 'str',
          extraBonuses: [],
          extraDamage: [],
        },
      ],
    }));
  };

  return (
    <Section id="secAttacks" title="Ataques">
      <div className={styles.headerRow}>
        <span className={styles.headerLabel}>Resistência a Magia</span>
        <span className={styles.resistance}>{spellResistance}</span>
      </div>
      {character.attacks.map((_, idx) => (
        <AttackCard key={idx} index={idx} />
      ))}
      <Button variant="add" onClick={addAttack}>+ Ataque</Button>
    </Section>
  );
}
