import { useState } from 'react';
import { Sparkles, Sword } from 'lucide-react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { calcCombatSkillTotal, getNarutoAttr } from '../../utils/narutoCalculations';
import { getEffectsOfType } from '../../data/narutoConfigEffects';
import type { Jutsu, NarutoPower, NarutoTechnique, NarutoAttributeId } from '../../../../types/narutoCharacter';
import CastJutsuModal from '../CastJutsuModal/CastJutsuModal';
import AttackWeaponModal from '../AttackWeaponModal/AttackWeaponModal';
import styles from './NarutoJutsusMini.module.css';

interface AttackModalState {
  weaponIdx: number;
  hitMod: number;
  damageMod: number;
  attackName: string;
}

interface ResolvedJutsu {
  jutsu: Jutsu;
  power: NarutoPower;
  tech: NarutoTechnique;
}

export default function NarutoJutsusMini() {
  const { character } = useCharacterContext();
  const [castState, setCastState] = useState<{
    powerId: string;
    techniqueId: string;
    damageMod: number;
    hitMod: number;
    initialLevel: number;
  } | null>(null);
  const [attackWeaponIdx, setAttackWeaponIdx] = useState<number | null>(null);
  const [customAttackModal, setCustomAttackModal] = useState<AttackModalState | null>(null);

  if (!character) return null;

  const jutsus = character.jutsus ?? [];
  const powers = character.powers ?? [];
  const weapons = character.weapons ?? [];
  const weaponAttacks = character.weaponAttacks ?? [];

  const resolved: ResolvedJutsu[] = jutsus
    .map((j) => {
      const power = powers.find((p) => p.id === j.powerId);
      const tech = power?.techniques?.find((t) => t.id === j.techniqueId);
      if (!power || !tech) return null;
      return { jutsu: j, power, tech };
    })
    .filter((r): r is ResolvedJutsu => r !== null);

  const hasJutsus = resolved.length > 0;
  const hasWeapons = weapons.length > 0;
  const hasAttacks = weaponAttacks.length > 0;

  if (!hasJutsus && !hasWeapons && !hasAttacks) return null;

  const calcDmgTotal = (tech: NarutoTechnique, lv: number, damageMod: number): number => {
    if (tech.damageFormula === 'perLevel') {
      return (tech.damagePerLevel ?? 0) * lv + damageMod;
    }
    if (tech.damageFormula === 'fixedBonus') {
      const attr = (tech.damageAttr ?? 'esp') as NarutoAttributeId;
      const halfA = Math.ceil(getNarutoAttr(character, attr) / 2);
      return halfA + (tech.damageFixedBonus ?? 0) + damageMod;
    }
    const attr = (tech.damageAttr ?? 'esp') as NarutoAttributeId;
    const halfA = Math.ceil(getNarutoAttr(character, attr) / 2);
    const hasWeaponScale = tech.weaponDamageOffset !== undefined && tech.weaponDamageOffset !== null;
    const dda = hasWeaponScale ? lv + (tech.weaponDamageOffset ?? 0) : 0;
    const nv = hasWeaponScale ? 0 : lv;
    return dda + halfA + nv + damageMod;
  };

  const isAcuidade = getEffectsOfType(character, 'combatAttrOverride')
    .some((o) => o.skill === 'cc' && o.attr === 'des');

  const openCast = (j: Jutsu, level: number) => {
    setCastState({
      powerId: j.powerId,
      techniqueId: j.techniqueId,
      damageMod: j.damageMod ?? 0,
      hitMod: j.hitMod ?? 0,
      initialLevel: level,
    });
  };

  return (
    <div>
      {/* ─── Jutsus ─── */}
      {hasJutsus && (
        <>
          <div className={styles.sectionTitle}>Jutsus</div>
          {resolved.map(({ jutsu, power, tech }, ri) => {
            const maxLv = power.level || 1;
            const hitBase = tech.hitAttr && (tech.hitAttr === 'cc' || tech.hitAttr === 'cd')
              ? calcCombatSkillTotal(character, tech.hitAttr)
              : null;
            const hitTotal = hitBase !== null ? hitBase + (jutsu.hitMod ?? 0) : null;
            const hitLabel = tech.hitAttr === 'cc' ? 'CC' : tech.hitAttr === 'cd' ? 'CD' : '';

            return (
              <div key={jutsu.id} className={styles.jutsuGroup}>
                <div className={styles.jutsuHeader}>
                  <div className={styles.nameWithHit}>
                    <span className={styles.jutsuName}>
                      {power.name}: {jutsu.name || tech.name}
                    </span>
                    {hitTotal !== null && (
                      <span className={styles.badge} title={`Teste de Acerto (${hitLabel})`}>
                        +{hitTotal}
                      </span>
                    )}
                  </div>
                  {tech.type && <span className={styles.tagType}>{tech.type}</span>}
                  {tech.name && <span className={styles.tagTech}>{tech.name}</span>}
                </div>

                {tech.singleCast ? (() => {
                  const lv = maxLv;
                  const dmg = (tech.dealsDamage ?? true)
                    ? calcDmgTotal(tech, lv, jutsu.damageMod ?? 0)
                    : null;
                  const chakra = tech.chakraFormula === 'fixed'
                    ? (tech.chakraFixedCost ?? 0)
                    : lv;
                  return (
                    <div key={lv} className={styles.row}>
                      {dmg !== null && (
                        <span className={`${styles.badge} ${styles.badgeDmg}`} title="Dano Total">
                          {dmg}
                        </span>
                      )}
                      <span className={`${styles.badge} ${styles.badgeChk}`} title="Custo de Chakra">
                        {chakra} Chk
                      </span>
                      <button
                        type="button"
                        className={styles.castBtnJutsu}
                        onClick={() => openCast(jutsu, lv)}
                        title="Usar"
                      >
                        <Sparkles size={14} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })() : Array.from({ length: maxLv }, (_, k) => k + 1).map((lv) => {
                  const dmg = (tech.dealsDamage ?? true)
                    ? calcDmgTotal(tech, lv, jutsu.damageMod ?? 0)
                    : null;
                  const chakra = tech.chakraFormula === 'fixed'
                    ? (tech.chakraFixedCost ?? 0)
                    : lv;

                  return (
                    <div key={lv} className={styles.row}>
                      <span className={`${styles.badge} ${styles.badgeNeutral}`}>Nv {lv}</span>
                      {dmg !== null && (
                        <span className={`${styles.badge} ${styles.badgeDmg}`} title="Dano Total">
                          {dmg}
                        </span>
                      )}
                      <span className={`${styles.badge} ${styles.badgeChk}`} title="Custo de Chakra">
                        {chakra} Chk
                      </span>
                      <button
                        type="button"
                        className={styles.castBtnJutsu}
                        onClick={() => openCast(jutsu, lv)}
                        title={`Usar no Nv ${lv}`}
                      >
                        <Sparkles size={14} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}

                {ri < resolved.length - 1 && <div className={styles.divider} />}
              </div>
            );
          })}
        </>
      )}

      {/* ─── Armas ─── */}
      {hasWeapons && (
        <>
          <div className={styles.sectionTitle}>Armas</div>
          {weapons.map((w, wi) => {
            const hasHit = w.hitAttr === 'cc' || w.hitAttr === 'cd';
            const hitLabel = w.hitAttr === 'cc' ? 'CC' : w.hitAttr === 'cd' ? 'CD' : '';
            const hitVal = hasHit ? calcCombatSkillTotal(character, w.hitAttr as 'cc' | 'cd') : null;

            const effectiveAttr = w.damageAttr === 'for' && isAcuidade ? 'des' : w.damageAttr;
            const halfAttr = effectiveAttr && ['for', 'des', 'esp'].includes(effectiveAttr)
              ? Math.ceil(getNarutoAttr(character, effectiveAttr as NarutoAttributeId) / 2)
              : 0;
            const dmgTotal = (w.damage || 0) + halfAttr;

            return (
              <div key={w.id} className={styles.weaponRow}>
                <div className={styles.weaponInfo}>
                  <div className={styles.nameWithHit}>
                    <span className={styles.jutsuName}>{w.name || '(Arma)'}</span>
                    {hitVal !== null && (
                      <span className={styles.badge} title={`Acerto (${hitLabel})`}>
                        +{hitVal}
                      </span>
                    )}
                  </div>
                  <div className={styles.weaponTags}>
                    <span className={`${styles.badge} ${styles.badgeDmg}`} title="Dano Total">
                      {dmgTotal}
                    </span>
                    {w.type && <span className={styles.tagType}>{w.type}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.castBtn}
                  onClick={() => setAttackWeaponIdx(wi)}
                  title="Atacar"
                >
                  <Sword size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* ─── Ataques ─── */}
      {hasAttacks && (
        <>
          <div className={styles.sectionTitle}>Ataques</div>
          {weaponAttacks.map((atk) => {
            const weapon = weapons.find((w) => w.id === atk.weaponId);
            if (!weapon) return null;

            const weaponIdx = weapons.indexOf(weapon);
            const hasHit = weapon.hitAttr === 'cc' || weapon.hitAttr === 'cd';
            const hitLabel = weapon.hitAttr === 'cc' ? 'CC' : weapon.hitAttr === 'cd' ? 'CD' : '';
            const hitBase = hasHit ? calcCombatSkillTotal(character, weapon.hitAttr as 'cc' | 'cd') : null;
            const hitTotal = hitBase !== null ? hitBase + atk.hitMod : null;

            const effectiveAttr = weapon.damageAttr === 'for' && isAcuidade ? 'des' : weapon.damageAttr;
            const halfAttr = effectiveAttr && ['for', 'des', 'esp'].includes(effectiveAttr)
              ? Math.ceil(getNarutoAttr(character, effectiveAttr as NarutoAttributeId) / 2)
              : 0;
            const dmgTotal = (weapon.damage || 0) + halfAttr + atk.damageMod;

            return (
              <div key={atk.id} className={styles.weaponRow}>
                <div className={styles.weaponInfo}>
                  <div className={styles.nameWithHit}>
                    <span className={styles.jutsuName}>{atk.name || '(Ataque)'}</span>
                    {hitTotal !== null && (
                      <span className={styles.badge} title={`Acerto (${hitLabel})`}>
                        +{hitTotal}
                      </span>
                    )}
                  </div>
                  <div className={styles.weaponTags}>
                    <span className={`${styles.badge} ${styles.badgeDmg}`} title="Dano Total">
                      {dmgTotal}
                    </span>
                    {weapon.name && <span className={styles.tagType}>{weapon.name}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.castBtn}
                  onClick={() => setCustomAttackModal({
                    weaponIdx,
                    hitMod: atk.hitMod,
                    damageMod: atk.damageMod,
                    attackName: atk.name,
                  })}
                  title="Atacar"
                >
                  <Sword size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </>
      )}

      {castState && (
        <CastJutsuModal
          powerId={castState.powerId}
          techniqueId={castState.techniqueId}
          damageMod={castState.damageMod}
          hitMod={castState.hitMod}
          initialLevel={castState.initialLevel}
          onClose={() => setCastState(null)}
        />
      )}

      <AttackWeaponModal
        weaponIdx={attackWeaponIdx}
        onClose={() => setAttackWeaponIdx(null)}
      />

      {customAttackModal && (
        <AttackWeaponModal
          weaponIdx={customAttackModal.weaponIdx}
          hitMod={customAttackModal.hitMod}
          damageMod={customAttackModal.damageMod}
          attackName={customAttackModal.attackName}
          onClose={() => setCustomAttackModal(null)}
        />
      )}
    </div>
  );
}
