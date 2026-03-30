import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { calcCombatSkillTotal, getNarutoAttr } from '../../utils/narutoCalculations';
import { getEffectsOfType } from '../../data/narutoConfigEffects';
import type { NarutoAttributeId } from '../../../../types/narutoCharacter';
import NarutoActionModal from '../NarutoActionModal/NarutoActionModal';
import NarutoDamageTable from '../NarutoDamageTable/NarutoDamageTable';
import styles from '../NarutoActionModal/NarutoActionModal.module.css';

interface AttackWeaponModalProps {
  weaponIdx: number | null;
  hitMod?: number;
  damageMod?: number;
  attackName?: string;
  onClose: () => void;
}

const ATTR_LABELS: Record<string, string> = { for: 'FOR', des: 'DES', esp: 'ESP' };

export default function AttackWeaponModal({ weaponIdx, hitMod = 0, damageMod = 0, attackName, onClose }: AttackWeaponModalProps) {
  const { character } = useCharacterContext();

  const isOpen = weaponIdx !== null;
  const weapon = character && weaponIdx !== null ? (character.weapons ?? [])[weaponIdx] : null;

  if (!character || !weapon) {
    return null;
  }

  const dda = weapon.damage || 0;
  const isAcuidade = getEffectsOfType(character, 'combatAttrOverride')
    .some((o) => o.skill === 'cc' && o.attr === 'des');
  const effectiveAttr = weapon.damageAttr === 'for' && isAcuidade ? 'des' : weapon.damageAttr;
  const halfAttr = effectiveAttr && ['for', 'des', 'esp'].includes(effectiveAttr)
    ? Math.ceil(getNarutoAttr(character, effectiveAttr as NarutoAttributeId) / 2)
    : 0;
  const outro = damageMod;
  const dmgTotal = dda + halfAttr + outro;

  const hitAttr = weapon.hitAttr;
  const hasHit = hitAttr === 'cc' || hitAttr === 'cd';
  const hitLabel = hitAttr === 'cc' ? 'CC' : hitAttr === 'cd' ? 'CD' : '';
  const hitBase = hasHit ? calcCombatSkillTotal(character, hitAttr as 'cc' | 'cd') : 0;
  const hitTotal = hitBase + hitMod;

  const attrLabel = effectiveAttr ? (ATTR_LABELS[effectiveAttr] ?? '') : '';

  const title = attackName ? `${attackName} (${weapon.name || 'Arma'})` : (weapon.name || 'Arma');

  return (
    <NarutoActionModal
      open={isOpen}
      title={title}
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
            <span className={styles.statVal}>
              {hitBase}{hitMod !== 0 ? ` ${hitMod > 0 ? '+' : ''}${hitMod}` : ''} = <strong>{hitTotal}</strong>
            </span>
          </div>
        </div>
      )}

      <div className={styles.sectionLabel}>Calculadora de Dano</div>
      <NarutoDamageTable
        dda={dda}
        halfAttr={halfAttr}
        nv={0}
        outro={outro}
        total={dmgTotal}
        halfAttrLabel={attrLabel ? `2/${attrLabel}` : '2/ATR'}
      />
    </NarutoActionModal>
  );
}
