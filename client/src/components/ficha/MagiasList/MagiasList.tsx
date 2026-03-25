import { useState } from 'react';
import { useFichaContext } from '../../../contexts/FichaContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import MagiaCard from '../MagiaCard/MagiaCard';
import ModalConjurar from '../ModalConjurar/ModalConjurar';
import { ATRIBUTOS_NOME } from '../../../data/atributos';
import { calcResistenciaMagia } from '../../../utils/calculations';
import type { AtributoId } from '../../../types/ficha';
import styles from './MagiasList.module.css';

export default function MagiasList() {
  const { ficha, updateFicha } = useFichaContext();
  const [conjurarIdx, setConjurarIdx] = useState<number | null>(null);
  if (!ficha) return null;

  const resMagia = calcResistenciaMagia(ficha);

  const addMagia = () => {
    updateFicha(f => ({
      ...f,
      magias: [
        ...f.magias,
        {
          nome: '',
          escola: '',
          execucao: '',
          alcance: '',
          area: '',
          duracao: '',
          resistencia: '',
          custoPM: 0,
          nivelMagia: 0,
          aprimoramentos: [],
          descricao: '',
        },
      ],
    }));
  };

  return (
    <Section id="secMagias" title="Magias">
      <div className={styles.headerRow}>
        <label>Atributo-chave</label>
        <select
          value={ficha.atributoChaveMagia}
          onChange={e =>
            updateFicha(f => ({ ...f, atributoChaveMagia: e.target.value as AtributoId }))
          }
        >
          {(Object.entries(ATRIBUTOS_NOME) as [AtributoId, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label>Teste de Resistência</label>
        <span className={styles.resistencia}>{resMagia}</span>
      </div>
      {ficha.magias.map((_, idx) => (
        <MagiaCard key={idx} index={idx} onConjurar={setConjurarIdx} />
      ))}
      <Button variant="add" onClick={addMagia}>+ Magia</Button>
      <ModalConjurar magiaIdx={conjurarIdx} onClose={() => setConjurarIdx(null)} />
    </Section>
  );
}
