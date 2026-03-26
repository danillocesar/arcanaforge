import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import AtaqueCard from '../AttackCard/AttackCard';
import { calcSpellResistance } from '../../../utils/calculations';
import styles from './AttacksList.module.css';

export default function AtaquesList() {
  const { character, updateCharacter } = useCharacterContext();
  if (!character) return null;

  const resMagia = calcSpellResistance(character);

  const addAtaque = () => {
    updateCharacter(f => ({
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
    <Section id="secAtaques" title="Ataques">
      <div className={styles.headerRow}>
        <label>Resistência a Magia</label>
        <span className={styles.resistencia}>{resMagia}</span>
      </div>
      {character.attacks.map((_, idx) => (
        <AtaqueCard key={idx} index={idx} />
      ))}
      <Button variant="add" onClick={addAtaque}>+ Ataque</Button>
    </Section>
  );
}
