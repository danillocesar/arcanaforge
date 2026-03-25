import { useFichaContext } from '../../../contexts/FichaContext';
import Button from '../../ui/Button/Button';
import styles from './ProgressaoDrawer.module.css';

export default function ProgressaoDrawer() {
  const { ficha, updateFicha } = useFichaContext();

  if (!ficha) return null;

  const addProgressao = () => {
    updateFicha((f) => ({
      ...f,
      progressao: [...f.progressao, ''],
    }));
  };

  const removeProgressao = (idx: number) => {
    updateFicha((f) => ({
      ...f,
      progressao: f.progressao.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx: number, value: string) => {
    updateFicha((f) => {
      const progressao = [...f.progressao];
      progressao[idx] = value;
      return { ...f, progressao };
    });
  };

  return (
    <div>
      {ficha.progressao.map((p, i) => (
        <div key={i} className={styles.item}>
          <span className={styles.nivel}>{i + 1}.</span>
          <input
            className={styles.desc}
            value={p}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder="Poderes, classes, distinções etc."
          />
          <Button variant="remove-sm" onClick={() => removeProgressao(i)}>×</Button>
        </div>
      ))}
      <Button variant="add" onClick={addProgressao}>+ Adicionar nível</Button>
    </div>
  );
}
