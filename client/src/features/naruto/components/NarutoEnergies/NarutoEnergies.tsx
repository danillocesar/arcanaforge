import { useCharacterContext } from '../../../../contexts/CharacterContext';
import {
  calcVitalidadeTotal,
  calcChakraTotal,
  syncNarutoHpMp,
} from '../../utils/narutoCalculations';
import HealthBar from '../../../../components/ui/HealthBar/HealthBar';
import Section from '../../../../components/ui/Section/Section';
import NarutoJutsusMini from '../NarutoJutsusMini/NarutoJutsusMini';
import styles from './NarutoEnergies.module.css';

export default function NarutoEnergies() {
  const { character, updateCharacter, sendHpUpdate } = useCharacterContext();

  if (!character) return null;

  const vitTotal = calcVitalidadeTotal(character);
  const chkTotal = calcChakraTotal(character);
  const vitPerdido = Math.max(0, vitTotal - character.hp.current);
  const chkPerdido = Math.max(0, chkTotal - character.mp.current);

  const changeVitPerdido = (delta: number) => {
    updateCharacter((f) => {
      const vt = calcVitalidadeTotal(f);
      const oldPerdido = Math.max(0, vt - f.hp.current);
      const newPerdido = Math.max(0, oldPerdido + delta);
      const synced = syncNarutoHpMp({
        ...f,
        hp: { max: vt, current: Math.max(0, vt - newPerdido) },
      });
      return synced;
    });
    setTimeout(sendHpUpdate, 50);
  };

  const changeChkPerdido = (delta: number) => {
    updateCharacter((f) => {
      const ct = calcChakraTotal(f);
      const oldPerdido = Math.max(0, ct - f.mp.current);
      const newPerdido = Math.max(0, oldPerdido + delta);
      const synced = syncNarutoHpMp({
        ...f,
        mp: { max: ct, current: Math.max(0, ct - newPerdido) },
      });
      return synced;
    });
    setTimeout(sendHpUpdate, 50);
  };

  const resetAll = () => {
    updateCharacter((f) => {
      const vt = calcVitalidadeTotal(f);
      const ct = calcChakraTotal(f);
      return {
        ...f,
        hp: { max: vt, current: vt },
        mp: { max: ct, current: ct },
        bleedingGrades: 0,
      };
    });
    setTimeout(sendHpUpdate, 50);
  };

  const recurso = character.recursoExtra;
  const hasRecurso = recurso && recurso.label;

  return (
    <Section id="secEnergies" title="Vitalidade / Chakra">
      <div className={styles.row}>
        {/* Vitalidade */}
        <div className={`${styles.block} ${styles.vitBlock}`}>
          <div className={styles.header}>
            <span className={styles.title}>Vitalidade</span>
            <span className={styles.max}>Total: {vitTotal}</span>
          </div>
          <HealthBar current={character.hp.current} max={vitTotal} variant="hp" />
          <div className={styles.controls}>
            <button type="button" className={styles.vmBtn} onClick={() => changeVitPerdido(1)}>-</button>
            <div className={styles.valueGroup}>
              <span className={styles.current}>{character.hp.current}</span>
              <span className={styles.perdidoLabel}>perdido: {vitPerdido}</span>
            </div>
            <button type="button" className={styles.vmBtn} onClick={() => changeVitPerdido(-1)}>+</button>
          </div>
        </div>

        {/* Chakra */}
        <div className={`${styles.block} ${styles.chkBlock}`}>
          <div className={styles.header}>
            <span className={styles.title}>Chakra</span>
            <span className={styles.max}>Total: {chkTotal}</span>
          </div>
          <HealthBar current={character.mp.current} max={chkTotal} variant="pm" />
          <div className={styles.controls}>
            <button type="button" className={styles.vmBtn} onClick={() => changeChkPerdido(1)}>-</button>
            <div className={styles.valueGroup}>
              <span className={styles.current}>{character.mp.current}</span>
              <span className={styles.perdidoLabel}>perdido: {chkPerdido}</span>
            </div>
            <button type="button" className={styles.vmBtn} onClick={() => changeChkPerdido(-1)}>+</button>
          </div>
        </div>
      </div>

      {/* Recurso Extra */}
      {hasRecurso && (
        <div className={styles.recursoRow}>
          <span className={styles.recursoLabel} style={{ color: recurso.color || '#E74C3C' }}>
            {recurso.label}
          </span>
          <span className={styles.recursoValue}>
            {Math.max(0, recurso.total - recurso.perdido)} / {recurso.total}
          </span>
          <div className={styles.recursoControls}>
            <button
              type="button"
              className={styles.vmBtn}
              onClick={() =>
                updateCharacter((f) => ({
                  ...f,
                  recursoExtra: { ...f.recursoExtra!, perdido: Math.min(f.recursoExtra!.total, f.recursoExtra!.perdido + 1) },
                }))
              }
            >
              -
            </button>
            <button
              type="button"
              className={styles.vmBtn}
              onClick={() =>
                updateCharacter((f) => ({
                  ...f,
                  recursoExtra: { ...f.recursoExtra!, perdido: Math.max(0, f.recursoExtra!.perdido - 1) },
                }))
              }
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Sangramento */}
      <div className={styles.footer}>
        <div className={styles.bleedingRow}>
          <span className={styles.bleedingLabel}>Sangramento (Graus):</span>
          <button
            type="button"
            className={styles.vmBtn}
            onClick={() =>
              updateCharacter((f) => ({
                ...f,
                bleedingGrades: Math.max(0, (f.bleedingGrades ?? 0) - 1),
              }))
            }
          >
            -
          </button>
          <span className={styles.bleedingValue}>{character.bleedingGrades ?? 0}</span>
          <button
            type="button"
            className={styles.vmBtn}
            onClick={() =>
              updateCharacter((f) => ({
                ...f,
                bleedingGrades: (f.bleedingGrades ?? 0) + 1,
              }))
            }
          >
            +
          </button>
        </div>
        <button type="button" className={styles.resetBtn} onClick={resetAll}>
          Restaurar Tudo
        </button>
      </div>

      <NarutoJutsusMini />
    </Section>
  );
}
