import { useState } from 'react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { DAMAGE_GRADES } from '../../data/narutoConstants';
import { calcDamageTotal, calcDamageGrade } from '../../utils/narutoCalculations';
import type { DamageEntry } from '../../../../types/narutoCharacter';
import Section from '../../../../components/ui/Section/Section';
import styles from './NarutoDamageCalc.module.css';

export default function NarutoDamageCalc() {
  const { character, updateCharacter } = useCharacterContext();
  const [showRef, setShowRef] = useState(false);

  if (!character) return null;

  const entries = character.damageEntries ?? [];

  const updateEntry = (idx: number, field: keyof DamageEntry, value: string | number) => {
    updateCharacter((f) => ({
      ...f,
      damageEntries: f.damageEntries!.map((e, i) =>
        i === idx ? { ...e, [field]: value } : e,
      ),
    }));
  };

  const addEntry = () => {
    updateCharacter((f) => ({
      ...f,
      damageEntries: [
        ...(f.damageEntries ?? []),
        {
          id: crypto.randomUUID(),
          name: '',
          composition: '',
          atribHalf: 0,
          weaponDamage: 0,
          level: 0,
          outro: 0,
        },
      ],
    }));
  };

  const removeEntry = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      damageEntries: f.damageEntries!.filter((_, i) => i !== idx),
    }));
  };

  return (
    <Section id="secDamage" title="Calculadora de Dano">
      <div className={styles.refToggleRow}>
        <button
          type="button"
          className={`${styles.refToggle} ${showRef ? styles.refToggleActive : ''}`}
          onClick={() => setShowRef((v) => !v)}
          title="Tabela de Graus (2d8)"
        >
          ?
        </button>
      </div>

      {showRef && (
        <div className={styles.refTable}>
          <div className={styles.refRow}>
            {DAMAGE_GRADES.map((g) => (
              <div key={g.label} className={styles.refCell}>
                <span className={styles.refRange}>{g.range}</span>
                <span className={styles.refLabel}>{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={styles.entries}>
        <div className={styles.entryHeader}>
          <span className={styles.ehName}>Nome</span>
          <span className={styles.ehVal}>Atr/2</span>
          <span className={styles.ehVal}>DDA</span>
          <span className={styles.ehVal}>Nv</span>
          <span className={styles.ehVal}>Outro</span>
          <span className={styles.ehTotal}>Total</span>
          <span className={styles.ehGrade}>G1</span>
          <span className={styles.ehGrade}>G2</span>
          <span className={styles.ehGrade}>G3</span>
          <span className={styles.ehGrade}>G4</span>
          <span className={styles.ehAction} />
        </div>

        {entries.map((e, i) => {
          const total = calcDamageTotal(e);
          return (
            <div key={e.id} className={styles.entryRow}>
              <input
                className={styles.nameInput}
                value={e.name}
                onChange={(ev) => updateEntry(i, 'name', ev.target.value)}
                placeholder="Nome"
              />
              <input
                className={styles.numInput}
                type="number"
                value={e.atribHalf}
                onChange={(ev) => updateEntry(i, 'atribHalf', Number(ev.target.value) || 0)}
              />
              <input
                className={styles.numInput}
                type="number"
                value={e.weaponDamage}
                onChange={(ev) => updateEntry(i, 'weaponDamage', Number(ev.target.value) || 0)}
              />
              <input
                className={styles.numInput}
                type="number"
                value={e.level}
                onChange={(ev) => updateEntry(i, 'level', Number(ev.target.value) || 0)}
              />
              <input
                className={styles.numInput}
                type="number"
                value={e.outro}
                onChange={(ev) => updateEntry(i, 'outro', Number(ev.target.value) || 0)}
              />
              <span className={styles.totalVal}>{total}</span>
              <span className={styles.gradeVal}>{calcDamageGrade(total, 1)}</span>
              <span className={styles.gradeVal}>{calcDamageGrade(total, 2)}</span>
              <span className={styles.gradeVal}>{calcDamageGrade(total, 3)}</span>
              <span className={styles.gradeVal}>{calcDamageGrade(total, 4)}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeEntry(i)}
              >
                X
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className={styles.addBtn} onClick={addEntry}>
        + Adicionar Linha de Dano
      </button>
    </Section>
  );
}
