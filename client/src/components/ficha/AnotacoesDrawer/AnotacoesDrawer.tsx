import { useFichaContext } from '../../../contexts/FichaContext';
import styles from './AnotacoesDrawer.module.css';

export default function AnotacoesDrawer() {
  const { ficha, updateFicha } = useFichaContext();

  if (!ficha) return null;

  return (
    <textarea
      className={styles.textarea}
      value={ficha.anotacoes}
      onChange={(e) => updateFicha((f) => ({ ...f, anotacoes: e.target.value }))}
      placeholder="Suas anotações..."
    />
  );
}
