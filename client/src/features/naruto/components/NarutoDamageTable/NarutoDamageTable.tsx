import { calcDamageGrade } from '../../utils/narutoCalculations';
import styles from '../NarutoActionModal/NarutoActionModal.module.css';

interface NarutoDamageTableProps {
  dda: number;
  halfAttr: number;
  nv: number;
  outro: number;
  total: number;
  halfAttrLabel?: string;
}

export default function NarutoDamageTable({
  dda,
  halfAttr,
  nv,
  outro,
  total,
  halfAttrLabel = '2/ATR',
}: NarutoDamageTableProps) {
  return (
    <div className={styles.dmgTable}>
      <div className={styles.dmgHead}>
        <span>DDA</span>
        <span>{halfAttrLabel}</span>
        <span>NV</span>
        <span>Outro</span>
        <span>Total</span>
        <span>G1</span>
        <span>G2</span>
        <span>G3</span>
        <span>G4</span>
      </div>
      <div className={styles.dmgRow}>
        <span className={styles.dmgVal}>{dda}</span>
        <span className={styles.dmgVal}>{halfAttr}</span>
        <span className={styles.dmgVal}>{nv}</span>
        <span className={styles.dmgVal}>{outro}</span>
        <span className={styles.dmgTotal}>{total}</span>
        <span className={styles.dmgGrade}>{calcDamageGrade(total, 1)}</span>
        <span className={styles.dmgGrade}>{calcDamageGrade(total, 2)}</span>
        <span className={styles.dmgGrade}>{calcDamageGrade(total, 3)}</span>
        <span className={styles.dmgGrade}>{calcDamageGrade(total, 4)}</span>
      </div>
    </div>
  );
}
