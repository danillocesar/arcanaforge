import { useState } from 'react';
import { useFichaContext } from '../../../contexts/FichaContext';
import { getAtributoEfetivo, calcDefesaTotal, formatMod } from '../../../utils/calculations';
import { ATRIBUTOS_NOME } from '../../../data/atributos';
import type { AtributoId } from '../../../types/ficha';
import Section from '../../ui/Section/Section';
import styles from './AtributosDefesa.module.css';

const ATTR_ORDER: AtributoId[] = ['for', 'des', 'con', 'int', 'sab', 'car'];

function AtributoCard({ attr }: { attr: AtributoId }) {
  const { ficha, updateFicha } = useFichaContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!ficha) return null;

  const base = ficha.atributos[attr] || 0;
  const effective = getAtributoEfetivo(ficha, attr);
  const isBuffed = effective !== base;

  const startEdit = () => {
    setDraft(String(base));
    setEditing(true);
  };

  const commitEdit = () => {
    const val = Number(draft);
    if (!isNaN(val)) {
      updateFicha((f) => ({
        ...f,
        atributos: { ...f.atributos, [attr]: val },
      }));
    }
    setEditing(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.label}>{ATRIBUTOS_NOME[attr]}</div>
      {editing ? (
        <input
          className={styles.editInput}
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
          autoFocus
        />
      ) : (
        <>
          <div className={`${styles.value} ${isBuffed ? styles.buffed : ''}`}>
            {formatMod(effective)}
          </div>
          {isBuffed && <div className={styles.baseVal}>({formatMod(base)})</div>}
          <button type="button" className={styles.editPencil} onClick={startEdit}>✎</button>
        </>
      )}
    </div>
  );
}

export default function AtributosDefesa() {
  const { ficha, updateFicha } = useFichaContext();

  if (!ficha) return null;

  const caTotal = calcDefesaTotal(ficha);

  const updateDefesaItem = (idx: number, field: string, value: string | number) => {
    updateFicha((f) => {
      const itens = [...f.defesa.itens];
      itens[idx] = { ...itens[idx], [field]: value };
      return { ...f, defesa: { ...f.defesa, itens } };
    });
  };

  const addDefesaItem = () => {
    updateFicha((f) => ({
      ...f,
      defesa: {
        ...f.defesa,
        itens: [...f.defesa.itens, { nome: '', valor: 0, penalidade: 0 }],
      },
    }));
  };

  const removeDefesaItem = (idx: number) => {
    updateFicha((f) => ({
      ...f,
      defesa: { ...f.defesa, itens: f.defesa.itens.filter((_, i) => i !== idx) },
    }));
  };

  return (
    <Section id="secAtributos" title="Atributos & Defesa">
      <div className={styles.attrDefesaLayout}>
        <div className={styles.atributosGrid}>
          {ATTR_ORDER.map((attr) => (
            <AtributoCard key={attr} attr={attr} />
          ))}
        </div>

        <div className={styles.defesaInline}>
          <div className={styles.defesaTotal}>
            <span className={styles.defesaTotalLabel}>CA Total</span>
            <span className={styles.defesaTotalValue}>{caTotal}</span>
          </div>

          <div className={styles.defesaBase}>
            <span className={styles.defesaBaseNome}>Base</span>
            <span className={styles.defesaBaseValue}>10</span>
          </div>

          <div className={styles.defesaItems}>
            {ficha.defesa.itens.map((item, i) => (
              <div key={i} className={styles.defesaRow}>
                <input
                  type="text"
                  value={item.nome ?? ''}
                  onChange={(e) => updateDefesaItem(i, 'nome', e.target.value)}
                  placeholder="Nome"
                />
                <input
                  type="number"
                  value={item.valor ?? 0}
                  onChange={(e) => updateDefesaItem(i, 'valor', Number(e.target.value) || 0)}
                  title="Bônus de Defesa"
                />
                <span className={styles.penLabel}>Pen:</span>
                <input
                  type="number"
                  className={styles.defesaPenInput}
                  value={item.penalidade ?? 0}
                  onChange={(e) => updateDefesaItem(i, 'penalidade', Number(e.target.value) || 0)}
                  title="Penalidade de Armadura"
                />
                <button type="button" className={styles.defesaRemove} onClick={() => removeDefesaItem(i)}>✕</button>
              </div>
            ))}
          </div>

          <button type="button" className={styles.addDefesa} onClick={addDefesaItem}>+ Adicionar proteção</button>
        </div>
      </div>
    </Section>
  );
}
