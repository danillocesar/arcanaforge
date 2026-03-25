import { useFichaContext } from '../../../contexts/FichaContext';
import Section from '../../ui/Section/Section';
import styles from './EfeitosTemporarios.module.css';

export default function EfeitosTemporarios() {
  const { ficha, updateFicha } = useFichaContext();

  if (!ficha) return null;

  return (
    <Section id="secEfeitos" title="Efeitos Temporários">
      <textarea
        className={styles.textarea}
        value={ficha.efeitosTemporarios}
        onChange={(e) => updateFicha((f) => ({ ...f, efeitosTemporarios: e.target.value }))}
        placeholder="Efeitos ativos, condições..."
      />
    </Section>
  );
}
