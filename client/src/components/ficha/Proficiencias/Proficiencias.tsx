import { useFichaContext } from '../../../contexts/FichaContext';
import Section from '../../ui/Section/Section';
import styles from './Proficiencias.module.css';

export default function Proficiencias() {
  const { ficha, updateFicha } = useFichaContext();

  if (!ficha) return null;

  return (
    <Section id="secProficiencias" title="Proficiências">
      <textarea
        className={styles.textarea}
        value={ficha.proficiencias}
        onChange={(e) => updateFicha((f) => ({ ...f, proficiencias: e.target.value }))}
        placeholder="Armas, armaduras e escudos..."
      />
    </Section>
  );
}
