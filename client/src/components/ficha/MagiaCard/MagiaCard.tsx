import { useFichaContext } from '../../../contexts/FichaContext';
import type { Magia, Aprimoramento } from '../../../types/ficha';
import styles from './MagiaCard.module.css';

interface MagiaCardProps {
  index: number;
  onConjurar: (idx: number) => void;
}

export default function MagiaCard({ index, onConjurar }: MagiaCardProps) {
  const { ficha, updateFicha } = useFichaContext();
  if (!ficha) return null;

  const magia = ficha.magias[index];
  if (!magia) return null;

  const updateMagia = (updates: Partial<Magia>) => {
    updateFicha(f => {
      const magias = [...f.magias];
      magias[index] = { ...magias[index], ...updates };
      return { ...f, magias };
    });
  };

  const removeMagia = () => {
    updateFicha(f => ({ ...f, magias: f.magias.filter((_, i) => i !== index) }));
  };

  const aprimoramentos = Array.isArray(magia.aprimoramentos) ? magia.aprimoramentos : [];

  const addAprimoramento = () => {
    updateMagia({
      aprimoramentos: [...aprimoramentos, { descricao: '', custoPM: 0 }],
    });
  };

  const updateAprimoramento = (aIdx: number, updates: Partial<Aprimoramento>) => {
    const next = [...aprimoramentos];
    next[aIdx] = { ...next[aIdx], ...updates };
    updateMagia({ aprimoramentos: next });
  };

  const removeAprimoramento = (aIdx: number) => {
    updateMagia({ aprimoramentos: aprimoramentos.filter((_, i) => i !== aIdx) });
  };

  const campos = [
    { key: 'nome' as const, label: 'Nome' },
    { key: 'escola' as const, label: 'Escola' },
    { key: 'execucao' as const, label: 'Execução' },
    { key: 'alcance' as const, label: 'Alcance' },
    { key: 'area' as const, label: 'Área' },
    { key: 'duracao' as const, label: 'Duração' },
    { key: 'resistencia' as const, label: 'Resistência' },
  ];

  return (
    <div className={styles.card}>
      <button className={styles.conjurar} onClick={() => onConjurar(index)} title="Conjurar">
        ✨
      </button>
      <button className={styles.remove} onClick={removeMagia} title="Remover">✕</button>

      <div className={styles.grid}>
        {campos.map(c => (
          <div key={c.key} className={styles.campo}>
            <label>{c.label}</label>
            <input
              value={magia[c.key] || ''}
              onChange={e => updateMagia({ [c.key]: e.target.value })}
            />
          </div>
        ))}
        <div className={`${styles.campo} ${styles.pmField}`}>
          <label>Custo PM</label>
          <input
            type="number"
            value={magia.custoPM}
            onChange={e => updateMagia({ custoPM: Number(e.target.value) || 0 })}
          />
        </div>
        <div className={`${styles.campo} ${styles.fullWidth}`}>
          <label>Efeito</label>
          <textarea
            rows={3}
            value={magia.descricao}
            onChange={e => updateMagia({ descricao: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.aprimoramentos}>
        <div className={styles.aprHeader}>
          <span className={styles.aprTitle}>Aprimoramentos</span>
        </div>
        {aprimoramentos.map((apr, aIdx) => (
          <div key={aIdx} className={styles.aprRow}>
            <input
              className={styles.aprDesc}
              value={apr.descricao}
              onChange={e => updateAprimoramento(aIdx, { descricao: e.target.value })}
              placeholder="Descrição"
            />
            <input
              className={styles.aprPm}
              type="number"
              value={apr.custoPM}
              onChange={e => updateAprimoramento(aIdx, { custoPM: Number(e.target.value) || 0 })}
              placeholder="PM"
            />
            <button className={styles.removeSm} onClick={() => removeAprimoramento(aIdx)}>
              ✕
            </button>
          </div>
        ))}
        <button className={styles.addApr} onClick={addAprimoramento}>+ Aprimoramento</button>
      </div>
    </div>
  );
}
