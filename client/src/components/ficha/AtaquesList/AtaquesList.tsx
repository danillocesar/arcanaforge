import { useFichaContext } from '../../../contexts/FichaContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import AtaqueCard from '../AtaqueCard/AtaqueCard';
import { calcResistenciaMagia } from '../../../utils/calculations';
import styles from './AtaquesList.module.css';

export default function AtaquesList() {
  const { ficha, updateFicha } = useFichaContext();
  if (!ficha) return null;

  const resMagia = calcResistenciaMagia(ficha);

  const addAtaque = () => {
    updateFicha(f => ({
      ...f,
      ataques: [
        ...f.ataques,
        {
          nome: '',
          dano: '',
          critico: '20/x2',
          tipo: '',
          alcanceTipo: 'melee',
          custoPM: 0,
          danoAtributo: 'for',
          bonusExtras: [],
          danoExtras: [],
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
      {ficha.ataques.map((_, idx) => (
        <AtaqueCard key={idx} index={idx} />
      ))}
      <Button variant="add" onClick={addAtaque}>+ Ataque</Button>
    </Section>
  );
}
