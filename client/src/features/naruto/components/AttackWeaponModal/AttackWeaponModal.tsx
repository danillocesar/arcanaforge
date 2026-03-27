import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { calcCombatSkillTotal, getNarutoAttr } from '../../utils/narutoCalculations';
import type { NarutoAttributeId } from '../../../../types/narutoCharacter';
import NarutoActionModal from '../NarutoActionModal/NarutoActionModal';
import NarutoDamageTable from '../NarutoDamageTable/NarutoDamageTable';
import styles from '../NarutoActionModal/NarutoActionModal.module.css';

interface AttackWeaponModalProps {
  weaponIdx: number | null;
  onClose: () => void;
}

const ATTR_LABELS: Record<string, string> = { for: 'FOR', des: 'DES', esp: 'ESP' };

export default function AttackWeaponModal({ weaponIdx, onClose }: AttackWeaponModalProps) {
  const { character } = useCharacterContext();

  const isOpen = weaponIdx !== null;
  const weapon = character && weaponIdx !== null ? (character.weapons ?? [])[weaponIdx] : null;

  if (!character || !weapon) {
    return null;
  }

  const dda = weapon.damage || 0;
  const halfAttr = weapon.damageAttr && ['for', 'des', 'esp'].includes(weapon.damageAttr)
    ? Math.ceil(getNarutoAttr(character, weapon.damageAttr as NarutoAttributeId) / 2)
    : 0;
  const nv = Math.ceil((character.campaignLevel ?? 1) / 2);
  const outro = 0;
  const dmgTotal = dda + halfAttr + nv + outro;

  const hitAttr = weapon.hitAttr;
  const hasHit = hitAttr === 'cc' || hitAttr === 'cd';
  const hitLabel = hitAttr === 'cc' ? 'CC' : hitAttr === 'cd' ? 'CD' : '';
  const hitTotal = hasHit ? calcCombatSkillTotal(character, hitAttr as 'cc' | 'cd') : 0;

  const attrLabel = weapon.damageAttr ? (ATTR_LABELS[weapon.damageAttr] ?? '') : '';

  return (
    <NarutoActionModal
      open={isOpen}
      title={weapon.name || 'Arma'}
      onClose={onClose}
      actions={<button className={styles.cancelBtn} onClick={onClose}>Fechar</button>}
    >
      <div className={styles.techSummary}>
        {weapon.type && <span className={styles.techTag}>Tipo: {weapon.type}</span>}
        {weapon.range && <span className={styles.techTag}>Alcance: {weapon.range}</span>}
        {weapon.critical && <span className={styles.techTag}>Critico: {weapon.critical}</span>}
        {weapon.quantity > 1 && <span className={styles.techTag}>Qtd: {weapon.quantity}</span>}
      </div>

      {hasHit && (
        <div className={styles.statsBox}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Teste de Acerto ({hitLabel})</span>
            <span className={styles.statVal}><strong>{hitTotal}</strong></span>
          </div>
        </div>
      )}

      <div className={styles.sectionLabel}>Calculadora de Dano</div>
      <NarutoDamageTable
        dda={dda}
        halfAttr={halfAttr}
        nv={nv}
        outro={outro}
        total={dmgTotal}
        halfAttrLabel={attrLabel ? `2/${attrLabel}` : '2/ATR'}
      />
    </NarutoActionModal>
  );
}
