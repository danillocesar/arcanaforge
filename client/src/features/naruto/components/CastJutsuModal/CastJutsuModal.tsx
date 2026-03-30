import { useState, useEffect } from 'react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { calcCombatSkillTotal, getNarutoAttr } from '../../utils/narutoCalculations';
import type { NarutoAttributeId } from '../../../../types/narutoCharacter';
import { triggerAttackAnim } from '../../../../utils/animations';
import NarutoActionModal from '../NarutoActionModal/NarutoActionModal';
import NarutoDamageTable from '../NarutoDamageTable/NarutoDamageTable';
import styles from '../NarutoActionModal/NarutoActionModal.module.css';

interface CastJutsuModalProps {
  powerId: string | null;
  techniqueId: string | null;
  damageMod?: number;
  hitMod?: number;
  initialLevel?: number;
  onClose: () => void;
}

export default function CastJutsuModal({ powerId, techniqueId, damageMod = 0, hitMod = 0, initialLevel, onClose }: CastJutsuModalProps) {
  const { character, updateCharacter, sendHpUpdate, sendSpellCast } = useCharacterContext();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(initialLevel ?? null);

  const isOpen = powerId !== null && techniqueId !== null;
  const power = character ? (character.powers ?? []).find((p) => p.id === powerId) : null;
  const tech = power?.techniques?.find((t) => t.id === techniqueId) ?? null;

  useEffect(() => {
    setSelectedLevel(initialLevel ?? null);
  }, [powerId, techniqueId, initialLevel]);

  if (!character || !power || !tech) {
    return null;
  }

  const maxLv = power.level;
  const effectiveLevel = tech.singleCast ? power.level : selectedLevel;
  const chakraCost = tech.chakraFormula === 'fixed'
    ? (tech.chakraFixedCost ?? 0)
    : (effectiveLevel ?? 0);
  const currentChakra = character.mp.current;

  const isPerLevel = tech.damageFormula === 'perLevel';
  const isFixedBonus = tech.damageFormula === 'fixedBonus';
  const attr = (tech.damageAttr ?? 'esp') as NarutoAttributeId;
  const hasWeaponScale = !isPerLevel && !isFixedBonus && tech.weaponDamageOffset !== undefined && tech.weaponDamageOffset !== null;

  const halfAttr = isPerLevel ? 0 : Math.ceil(getNarutoAttr(character, attr) / 2);
  const nv = (isPerLevel || hasWeaponScale || isFixedBonus) ? 0 : (effectiveLevel ?? 0);
  const dda = isPerLevel
    ? (tech.damagePerLevel ?? 0) * (effectiveLevel ?? 0)
    : isFixedBonus
      ? (tech.damageFixedBonus ?? 0)
      : hasWeaponScale
        ? (effectiveLevel ?? 0) + (tech.weaponDamageOffset ?? 0)
        : 0;
  const outro = damageMod;
  const dmgTotal = dda + halfAttr + nv + outro;

  const confirm = () => {
    if (effectiveLevel === null) return;
    const spellName = `${power.name}: ${tech.name}`;

    updateCharacter((f) => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - chakraCost) },
      logs: [
        ...f.logs,
        {
          type: 'spell',
          name: spellName,
          mpSpent: chakraCost,
          timestamp: Date.now(),
          details: {
            baseMpCost: chakraCost,
            enhancements: [],
            totalCost: chakraCost,
            castLevel: effectiveLevel,
            damage: dmgTotal,
            difficulty: '',
          },
        },
      ],
    }));
    triggerAttackAnim('toast', {
      type: 'magic',
      name: spellName,
      mpCost: chakraCost,
    });
    sendSpellCast(spellName, chakraCost);
    setTimeout(sendHpUpdate, 50);
    onClose();
  };

  return (
    <NarutoActionModal
      open={isOpen}
      title={`${power.name}: ${tech.name}`}
      onClose={onClose}
      actions={(
        <>
          <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button
            className={styles.confirmBtn}
            onClick={confirm}
            disabled={effectiveLevel === null}
          >
            Usar Jutsu ({chakraCost} Chk)
          </button>
        </>
      )}
    >
      <div className={styles.techSummary}>
        {tech.type && <span className={styles.techTag}>{tech.type}</span>}
        {tech.action && <span className={styles.techTag}>{tech.action}</span>}
        {tech.target && <span className={styles.techTag}>{tech.target}</span>}
        {tech.range && <span className={styles.techTag}>{tech.range}</span>}
        {tech.duration && <span className={styles.techTag}>{tech.duration}</span>}
      </div>

      {!tech.singleCast && (
        <>
          <div className={styles.sectionLabel}>Nivel de Uso</div>
          <div className={styles.levelSelector}>
            {Array.from({ length: maxLv }, (_, k) => k + 1).map((lv) => (
              <button
                key={lv}
                type="button"
                className={`${styles.levelBtn} ${selectedLevel === lv ? styles.levelBtnActive : ''}`}
                onClick={() => setSelectedLevel(lv)}
                title={`Nv ${lv} — Chakra: ${lv}`}
              >
                {lv}
              </button>
            ))}
          </div>
        </>
      )}

      {effectiveLevel !== null && (
        <>
          <div className={styles.statsBox}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Chakra</span>
              <span className={styles.statVal}>{chakraCost}</span>
            </div>
            {tech.hitAttr && (tech.hitAttr === 'cc' || tech.hitAttr === 'cd') && (
              (() => {
                const hitLabel = tech.hitAttr === 'cc' ? 'CC' : 'CD';
                const hitBase = calcCombatSkillTotal(character, tech.hitAttr);
                const hitTotal = hitBase + hitMod;
                return (
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                      Teste de Acerto ({hitLabel})
                    </span>
                    <span className={styles.statVal}>
                      {hitBase}{hitMod !== 0 ? ` ${hitMod > 0 ? '+' : ''}${hitMod}` : ''} = <strong>{hitTotal}</strong>
                    </span>
                  </div>
                );
              })()
            )}
          </div>

          {(tech.dealsDamage ?? true) && (
            <>
              <div className={styles.sectionLabel}>Calculadora de Dano</div>
              <NarutoDamageTable
                dda={dda}
                halfAttr={halfAttr}
                nv={nv}
                outro={outro}
                total={dmgTotal}
                halfAttrLabel={`2/${attr.toUpperCase()}`}
              />
            </>
          )}
        </>
      )}

      <div className={styles.infoRow}>
        <span>Chakra atual: <strong>{currentChakra}</strong></span>
        {chakraCost > 0 && chakraCost > currentChakra && (
          <span className={styles.warnInline}>Chakra insuficiente!</span>
        )}
      </div>
    </NarutoActionModal>
  );
}
