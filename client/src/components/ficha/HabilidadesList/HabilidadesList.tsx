import { useFichaContext } from '../../../contexts/FichaContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import type { Habilidade } from '../../../types/ficha';
import styles from './HabilidadesList.module.css';

export default function HabilidadesList() {
  const { ficha, updateFicha } = useFichaContext();
  if (!ficha) return null;

  const updateHabilidade = (idx: number, updates: Partial<Habilidade>) => {
    updateFicha(f => {
      const habilidades = [...f.habilidades];
      habilidades[idx] = { ...habilidades[idx], ...updates };
      return { ...f, habilidades };
    });
  };

  const addHabilidade = () => {
    updateFicha(f => ({
      ...f,
      habilidades: [
        ...f.habilidades,
        { nome: '', origem: '', tipo: '', custoPM: 0, descricao: '' },
      ],
    }));
  };

  const removeHabilidade = (idx: number) => {
    updateFicha(f => ({ ...f, habilidades: f.habilidades.filter((_, i) => i !== idx) }));
  };

  return (
    <Section id="secHabilidades" title="Habilidades & Poderes">
      {ficha.habilidades.map((hab, idx) => (
        <div key={idx} className={styles.card}>
          <button className={styles.remove} onClick={() => removeHabilidade(idx)}>✕</button>
          <div className={styles.header}>
            <input
              className={styles.nomeInput}
              value={hab.nome}
              onChange={e => updateHabilidade(idx, { nome: e.target.value })}
              placeholder="Nome"
            />
            <input
              className={styles.smallInput}
              value={hab.origem || ''}
              onChange={e => updateHabilidade(idx, { origem: e.target.value })}
              placeholder="Origem"
            />
            <input
              className={styles.smallInput}
              value={hab.tipo || ''}
              onChange={e => updateHabilidade(idx, { tipo: e.target.value })}
              placeholder="Tipo"
            />
            <input
              className={styles.smallInput}
              type="number"
              value={hab.custoPM || 0}
              onChange={e => updateHabilidade(idx, { custoPM: Number(e.target.value) || 0 })}
              placeholder="PM"
            />
          </div>
          <textarea
            className={styles.desc}
            rows={2}
            value={hab.descricao}
            onChange={e => updateHabilidade(idx, { descricao: e.target.value })}
            placeholder="Descrição"
          />
        </div>
      ))}
      <Button variant="add" onClick={addHabilidade}>+ Habilidade</Button>
    </Section>
  );
}
