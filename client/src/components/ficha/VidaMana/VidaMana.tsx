import { useState } from 'react';
import { useFichaContext } from '../../../contexts/FichaContext';
import { pvPercent } from '../../../utils/calculations';
import Section from '../../ui/Section/Section';
import AtaquesMini from '../AtaquesMini/AtaquesMini';
import ModalConjurar from '../ModalConjurar/ModalConjurar';
import styles from './VidaMana.module.css';

function MaxEditor({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
  };

  const commit = () => {
    const v = Number(draft);
    if (!isNaN(v) && v >= 0) onChange(v);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        className={styles.maxInput}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        autoFocus
      />
    );
  }

  return (
    <span className={styles.max}>
      Máx: {value}
      <button type="button" className={styles.maxEditBtn} onClick={startEdit}>✎</button>
    </span>
  );
}

export default function VidaMana() {
  const { ficha, updateFicha, sendHpUpdate } = useFichaContext();
  const [conjurarIdx, setConjurarIdx] = useState<number | null>(null);

  if (!ficha) return null;

  const pvPct = pvPercent(ficha.pv.atual, ficha.pv.maximo);
  const pmPct = pvPercent(ficha.pm.atual, ficha.pm.maximo);

  const changePv = (delta: number) => {
    updateFicha((f) => ({
      ...f,
      pv: { ...f.pv, atual: Math.max(0, f.pv.atual + delta) },
    }));
    setTimeout(sendHpUpdate, 50);
  };

  const changePm = (delta: number) => {
    updateFicha((f) => ({
      ...f,
      pm: { ...f.pm, atual: Math.max(0, f.pm.atual + delta) },
    }));
    setTimeout(sendHpUpdate, 50);
  };

  const resetAll = () => {
    updateFicha((f) => ({
      ...f,
      pv: { ...f.pv, atual: f.pv.maximo },
      pm: { ...f.pm, atual: f.pm.maximo },
    }));
    setTimeout(sendHpUpdate, 50);
  };

  return (
    <Section id="secVidaMana" title="Vida / Mana">
      <div className={styles.row}>
        <div className={`${styles.block} ${styles.pvBlock}`}>
          <div className={styles.header}>
            <span className={styles.title}>PV</span>
            <MaxEditor
              value={ficha.pv.maximo}
              onChange={(v) => updateFicha((f) => ({ ...f, pv: { ...f.pv, maximo: v } }))}
            />
          </div>
          <div className={styles.barContainer}>
            <div className={`${styles.bar} ${styles.pvBar}`} style={{ width: `${pvPct}%` }} />
          </div>
          <div className={styles.controls}>
            <button type="button" className={styles.vmBtn} onClick={() => changePv(-1)}>−</button>
            <span className={styles.current}>{ficha.pv.atual}</span>
            <button type="button" className={styles.vmBtn} onClick={() => changePv(1)}>+</button>
          </div>
          <div className={styles.temp}>
            <span className={styles.tempLabel}>Temp:</span>
            <input
              className={styles.tempInput}
              type="number"
              value={ficha.pvTemporario}
              onChange={(e) => updateFicha((f) => ({ ...f, pvTemporario: Number(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className={`${styles.block} ${styles.pmBlock}`}>
          <div className={styles.header}>
            <span className={styles.title}>PM</span>
            <MaxEditor
              value={ficha.pm.maximo}
              onChange={(v) => updateFicha((f) => ({ ...f, pm: { ...f.pm, maximo: v } }))}
            />
          </div>
          <div className={styles.barContainer}>
            <div className={`${styles.bar} ${styles.pmBar}`} style={{ width: `${pmPct}%` }} />
          </div>
          <div className={styles.controls}>
            <button type="button" className={styles.vmBtn} onClick={() => changePm(-1)}>−</button>
            <span className={styles.current}>{ficha.pm.atual}</span>
            <button type="button" className={styles.vmBtn} onClick={() => changePm(1)}>+</button>
          </div>
          <div className={styles.temp}>
            <span className={styles.tempLabel}>Temp:</span>
            <input
              className={styles.tempInput}
              type="number"
              value={ficha.pmTemporario}
              onChange={(e) => updateFicha((f) => ({ ...f, pmTemporario: Number(e.target.value) || 0 }))}
            />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div>
          <span className={styles.rdLabel}>RD:</span>
          <input
            className={styles.rdInput}
            value={ficha.reducaoDeDano}
            onChange={(e) => updateFicha((f) => ({ ...f, reducaoDeDano: e.target.value }))}
            placeholder="0"
          />
        </div>
        <button type="button" className={styles.resetBtn} onClick={resetAll}>
          Restaurar PV/PM
        </button>
      </div>

      <AtaquesMini type="ataques" />
      <AtaquesMini type="magias" onConjurar={setConjurarIdx} />
      <ModalConjurar magiaIdx={conjurarIdx} onClose={() => setConjurarIdx(null)} />
    </Section>
  );
}
