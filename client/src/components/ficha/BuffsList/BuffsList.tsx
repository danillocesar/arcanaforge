import { useFichaContext } from '../../../contexts/FichaContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import { BUFF_TIPOS } from '../../../data/constants';
import { PERICIAS_CONFIG } from '../../../data/pericias';
import { ATRIBUTOS_NOME } from '../../../data/atributos';
import type { Buff, BuffTipo, AtributoId } from '../../../types/ficha';
import styles from './BuffsList.module.css';

export default function BuffsList() {
  const { ficha, updateFicha } = useFichaContext();
  if (!ficha) return null;

  const updateBuff = (idx: number, updates: Partial<Buff>) => {
    updateFicha(f => {
      const buffs = [...f.buffs];
      buffs[idx] = { ...buffs[idx], ...updates };
      return { ...f, buffs };
    });
  };

  const addBuff = () => {
    updateFicha(f => ({
      ...f,
      buffs: [
        ...f.buffs,
        { nome: '', tipo: 'teste_ataque' as BuffTipo, valor: '', pm: 0, ativo: false },
      ],
    }));
  };

  const removeBuff = (idx: number) => {
    updateFicha(f => ({ ...f, buffs: f.buffs.filter((_, i) => i !== idx) }));
  };

  const toggleBuff = (idx: number) => {
    updateFicha(f => {
      const buffs = [...f.buffs];
      const b = { ...buffs[idx] };
      const wasActive = b.ativo;
      b.ativo = !wasActive;

      let pmAtual = f.pm.atual;
      let pvTemp = f.pvTemporario;
      let pmTemp = f.pmTemporario;
      const pmCost = Number(b.pm) || 0;
      const val = Number(b.valor) || 0;

      if (!wasActive) {
        if (pmCost > 0) pmAtual = Math.max(0, pmAtual - pmCost);
        if (b.tipo === 'vida') pvTemp += val;
        if (b.tipo === 'mana') pmTemp += val;
      } else {
        if (b.tipo === 'vida') pvTemp = Math.max(0, pvTemp - val);
        if (b.tipo === 'mana') pmTemp = Math.max(0, pmTemp - val);
      }

      buffs[idx] = b;
      return {
        ...f,
        buffs,
        pm: { ...f.pm, atual: pmAtual },
        pvTemporario: pvTemp,
        pmTemporario: pmTemp,
      };
    });
  };

  return (
    <Section id="secBuffs" title="Buffs">
      {ficha.buffs.map((buff, idx) => (
        <div
          key={idx}
          className={[styles.card, buff.ativo && styles.active].filter(Boolean).join(' ')}
        >
          <input
            className={styles.nome}
            value={buff.nome}
            onChange={e => updateBuff(idx, { nome: e.target.value })}
            placeholder="Nome"
          />
          <select
            className={styles.tipoSel}
            value={buff.tipo}
            onChange={e => updateBuff(idx, { tipo: e.target.value as BuffTipo })}
          >
            {Object.entries(BUFF_TIPOS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {buff.tipo === 'pericia' && (
            <select
              className={styles.extraSel}
              value={buff.periciaId || ''}
              onChange={e => updateBuff(idx, { periciaId: e.target.value })}
            >
              <option value="">—</option>
              {PERICIAS_CONFIG.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          )}
          {buff.tipo === 'atributo' && (
            <select
              className={styles.extraSel}
              value={buff.atributoId || ''}
              onChange={e => updateBuff(idx, { atributoId: e.target.value as AtributoId })}
            >
              <option value="">—</option>
              {(Object.entries(ATRIBUTOS_NOME) as [AtributoId, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          )}
          <input
            className={styles.valor}
            value={buff.valor}
            onChange={e => updateBuff(idx, { valor: e.target.value })}
            placeholder="Valor"
          />
          <div className={styles.pmField}>
            <span className={styles.pmLabel}>PM</span>
            <input
              className={styles.pmInput}
              type="number"
              value={buff.pm}
              onChange={e => updateBuff(idx, { pm: Number(e.target.value) || 0 })}
            />
          </div>
          <button
            className={[styles.toggle, buff.ativo && styles.toggleOn].filter(Boolean).join(' ')}
            onClick={() => toggleBuff(idx)}
          >
            ●
          </button>
          <button className={styles.removeSm} onClick={() => removeBuff(idx)}>✕</button>
        </div>
      ))}
      <Button variant="add" onClick={addBuff}>+ Buff</Button>
    </Section>
  );
}
