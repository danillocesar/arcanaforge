import { useCharacterContext } from '../../../../contexts/CharacterContext';
import {
  calcCombatSkillTotal,
  getCombatSkillAttr,
  getNarutoAttr,
} from '../../utils/narutoCalculations';
import { NARUTO_ATTRIBUTE_LABELS } from '../../data/narutoAttributes';
import Section from '../../../../components/ui/Section/Section';
import NumericInput from '../../../../components/ui/NumericInput/NumericInput';
import styles from './NarutoCombatStats.module.css';

const COMBAT_SKILLS_DEF: {
  id: 'cc' | 'cd' | 'esq' | 'lm';
  label: string;
}[] = [
  { id: 'cc',  label: 'CC (Corpo a Corpo)' },
  { id: 'cd',  label: 'CD (Combate a Dist.)' },
  { id: 'esq', label: 'ESQ (Esquiva)' },
  { id: 'lm',  label: 'LM (Ler Movimento)' },
];

export default function NarutoCombatStats() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const setCombat = (skillId: 'cc' | 'cd' | 'esq' | 'lm', field: 'base' | 'outro', value: number) => {
    updateCharacter((f) => ({
      ...f,
      combatSkills: {
        ...f.combatSkills!,
        [skillId]: { ...f.combatSkills![skillId], [field]: value },
      },
    }));
  };

  return (
    <Section id="secCombat" title="Habilidades de Combate">
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span className={styles.colName}>Habilidade</span>
          <span className={styles.colTotal}>Total</span>
          <span className={styles.colSep}>=</span>
          <span className={styles.colVal}>Base</span>
          <span className={styles.colSep}>+</span>
          <span className={styles.colVal}>Atrib.</span>
          <span className={styles.colSep}>+</span>
          <span className={styles.colVal}>Outro</span>
        </div>
        {COMBAT_SKILLS_DEF.map((cs) => {
          const entry = character.combatSkills?.[cs.id];
          const base = entry?.base ?? 0;
          const outro = entry?.outro ?? 0;
          const effectiveAttr = getCombatSkillAttr(character, cs.id);
          const attrVal = getNarutoAttr(character, effectiveAttr);
          const attrLabel = NARUTO_ATTRIBUTE_LABELS[effectiveAttr];
          const total = calcCombatSkillTotal(character, cs.id);
          return (
            <div key={cs.id} className={styles.tableRow}>
              <span className={styles.colName}>{cs.label}</span>
              <span className={styles.colTotal}>{total}</span>
              <span className={styles.colSep}>=</span>
              <NumericInput
                className={styles.colInput}
                value={base}
                onChange={(n) => setCombat(cs.id, 'base', n)}
              />
              <span className={styles.colSep}>+</span>
              <span className={styles.colAuto} title={attrLabel}>{attrVal}</span>
              <span className={styles.colSep}>+</span>
              <NumericInput
                className={styles.colInput}
                value={outro}
                onChange={(n) => setCombat(cs.id, 'outro', n)}
              />
            </div>
          );
        })}
      </div>
    </Section>
  );
}
