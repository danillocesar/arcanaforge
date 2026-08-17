import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import HealthBar from '../../ui/HealthBar/HealthBar';
import AttacksMini from '../AttacksMini/AttacksMini';
import CastSpellModal from '../CastSpellModal/CastSpellModal';
import NumericInput from '../../ui/NumericInput/NumericInput';
import styles from './HpMp.module.css';

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
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
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

export default function HpMp() {
  const { character, updateCharacter, sendHpUpdate } = useCharacterContext();
  const [castSpellIdx, setCastSpellIdx] = useState<number | null>(null);

  if (!character) return null;

  const changePv = (delta: number) => {
    updateCharacter((f) => ({
      ...f,
      hp: { ...f.hp, current: Math.max(0, f.hp.current + delta) },
    }));
    setTimeout(sendHpUpdate, 50);
  };

  const changePm = (delta: number) => {
    updateCharacter((f) => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current + delta) },
    }));
    setTimeout(sendHpUpdate, 50);
  };

  const resetAll = () => {
    updateCharacter((f) => ({
      ...f,
      hp: { ...f.hp, current: f.hp.max },
      mp: { ...f.mp, current: f.mp.max },
    }));
    setTimeout(sendHpUpdate, 50);
  };

  return (
    <Section id="secHpMp" title="Vida / Mana">
      <div className={styles.row}>
        <div className={`${styles.block} ${styles.pvBlock}`}>
          <div className={styles.header}>
            <span className={styles.title}>PV</span>
            <MaxEditor
              value={character.hp.max}
              onChange={(v) => updateCharacter((f) => ({ ...f, hp: { ...f.hp, max: v } }))}
            />
          </div>
          <HealthBar current={character.hp.current} max={character.hp.max} variant="hp" />
          <div className={styles.controls}>
            <button type="button" className={styles.vmBtn} onClick={() => changePv(-1)}>−</button>
            <span className={styles.current}>{character.hp.current}</span>
            <button type="button" className={styles.vmBtn} onClick={() => changePv(1)}>+</button>
          </div>
          <div className={styles.temp}>
            <span className={styles.tempLabel}>Temp:</span>
            <NumericInput
              className={styles.tempInput}
              value={character.temporaryHp}
              onChange={(n) => updateCharacter((f) => ({ ...f, temporaryHp: n }))}
            />
          </div>
        </div>

        <div className={`${styles.block} ${styles.pmBlock}`}>
          <div className={styles.header}>
            <span className={styles.title}>PM</span>
            <MaxEditor
              value={character.mp.max}
              onChange={(v) => updateCharacter((f) => ({ ...f, mp: { ...f.mp, max: v } }))}
            />
          </div>
          <HealthBar current={character.mp.current} max={character.mp.max} variant="pm" />
          <div className={styles.controls}>
            <button type="button" className={styles.vmBtn} onClick={() => changePm(-1)}>−</button>
            <span className={styles.current}>{character.mp.current}</span>
            <button type="button" className={styles.vmBtn} onClick={() => changePm(1)}>+</button>
          </div>
          <div className={styles.temp}>
            <span className={styles.tempLabel}>Temp:</span>
            <NumericInput
              className={styles.tempInput}
              value={character.temporaryMp}
              onChange={(n) => updateCharacter((f) => ({ ...f, temporaryMp: n }))}
            />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div>
          <span className={styles.rdLabel}>RD:</span>
          <NumericInput
            className={styles.rdInput}
            value={character.damageReduction}
            onChange={(n) => updateCharacter((f) => ({ ...f, damageReduction: n }))}
            min={0}
            placeholder="0"
          />
        </div>
        <button type="button" className={styles.resetBtn} onClick={resetAll}>
          Restaurar PV/PM
        </button>
      </div>

      <AttacksMini type="attacks" />
      <AttacksMini type="spells" onCast={setCastSpellIdx} />
      <CastSpellModal spellIdx={castSpellIdx} onClose={() => setCastSpellIdx(null)} />
    </Section>
  );
}
