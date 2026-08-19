import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getEffectiveMaxHp, getEffectiveMaxMp } from '../../../utils/calculations';
import Section from '../../ui/Section/Section';
import HealthBar from '../../ui/HealthBar/HealthBar';
import AttacksMini from '../AttacksMini/AttacksMini';
import CastSpellModal from '../CastSpellModal/CastSpellModal';
import NumericInput from '../../ui/NumericInput/NumericInput';
import styles from './HpMp.module.css';

/** `value` é o base editável; `effective` inclui bônus fixos (`max_hp`/`max_mp`) de poderes/itens ativos. */
function MaxEditor({ value, effective, onChange }: { value: number; effective: number; onChange: (v: number) => void }) {
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

  const bonus = effective - value;

  return (
    <span className={styles.max}>
      Máx: {effective}{bonus > 0 && ` (base ${value} +${bonus})`}
      <button type="button" className={styles.maxEditBtn} onClick={startEdit}>✎</button>
    </span>
  );
}

export default function HpMp() {
  const { character, updateCharacter, sendHpUpdate } = useCharacterContext();
  const [castSpellIdx, setCastSpellIdx] = useState<number | null>(null);

  if (!character) return null;

  const effectiveMaxHp = getEffectiveMaxHp(character);
  const effectiveMaxMp = getEffectiveMaxMp(character);

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
      hp: { ...f.hp, current: getEffectiveMaxHp(f) },
      mp: { ...f.mp, current: getEffectiveMaxMp(f) },
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
              effective={effectiveMaxHp}
              onChange={(v) => updateCharacter((f) => ({ ...f, hp: { ...f.hp, max: v } }))}
            />
          </div>
          <HealthBar current={character.hp.current} max={effectiveMaxHp} variant="hp" />
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
              effective={effectiveMaxMp}
              onChange={(v) => updateCharacter((f) => ({ ...f, mp: { ...f.mp, max: v } }))}
            />
          </div>
          <HealthBar current={character.mp.current} max={effectiveMaxMp} variant="pm" />
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
          {/* A RD agora é lista por tipo (`damageReductions`), editada no
              DefenseBreakdown da ficha nova. Aqui fica só o resumo, pra este
              painel legado não escrever num campo que a migração descarta. */}
          <span className={styles.rdInput}>
            {(character.damageReductions ?? []).map((rd) => `${rd.name} ${rd.value}`).join(' · ') || '—'}
          </span>
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
