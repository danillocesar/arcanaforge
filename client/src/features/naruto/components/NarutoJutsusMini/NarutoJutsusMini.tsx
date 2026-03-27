import { useState } from 'react';
import { Sparkles, Sword } from 'lucide-react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { calcCombatSkillTotal, getNarutoAttr } from '../../utils/narutoCalculations';
import type { Jutsu, NarutoPower, NarutoTechnique, TechLevelEntry, NarutoAttributeId } from '../../../../types/narutoCharacter';
import CastJutsuModal from '../CastJutsuModal/CastJutsuModal';
import AttackWeaponModal from '../AttackWeaponModal/AttackWeaponModal';
import styles from './NarutoJutsusMini.module.css';

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

  if (!character) return null;

  const jutsus = character.jutsus ?? [];
  const powers = character.powers ?? [];
  const weapons = character.weapons ?? [];

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

  if (!hasJutsus && !hasWeapons) return null;

  const nv = Math.ceil((character.campaignLevel ?? 1) / 2);

  const calcDmgTotal = (entry: TechLevelEntry, damageMod: number) => {
    const dda = Number(entry.damage) || 0;
    const outro = (entry.outro ?? 0) + damageMod;
    return dda + nv + outro;
  };

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
            const entries = tech.levelEntries ?? [];
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
                        {hitLabel} {hitTotal}
                      </span>
                    )}
                  </div>
                  {tech.type && <span className={styles.tagType}>{tech.type}</span>}
                  {tech.name && <span className={styles.tagTech}>{tech.name}</span>}
                </div>

                {Array.from({ length: maxLv }, (_, k) => k + 1).map((lv) => {
                  const entry = entries.find((e) => e.level === lv);
                  const chakra = entry?.chakraCost ?? 0;
                  const dmg = entry && (tech.dealsDamage ?? true) ? calcDmgTotal(entry, jutsu.damageMod ?? 0) : null;

                  return (
                    <div key={lv} className={styles.row}>
                      <span className={`${styles.badge} ${styles.badgeNeutral}`}>Nv {lv}</span>
                      {dmg !== null && (
                        <span className={`${styles.badge} ${styles.badgeDmg}`} title="Dano Total">
                          Dano {dmg}
                        </span>
                      )}
                      <span className={`${styles.badge} ${styles.badgeChk}`} title="Custo de Chakra">
                        {chakra} Chk
                      </span>
                      <button
                        type="button"
                        className={styles.castBtn}
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

            const halfAttr = w.damageAttr && ['for', 'des', 'esp'].includes(w.damageAttr)
              ? Math.ceil(getNarutoAttr(character, w.damageAttr as NarutoAttributeId) / 2)
              : 0;
            const dmgTotal = (w.damage || 0) + halfAttr + nv;

            return (
              <div key={w.id} className={styles.weaponRow}>
                <div className={styles.weaponInfo}>
                  <div className={styles.nameWithHit}>
                    <span className={styles.jutsuName}>{w.name || '(Arma)'}</span>
                    {hitVal !== null && (
                      <span className={styles.badge} title={`Acerto (${hitLabel})`}>
                        {hitLabel} {hitVal}
                      </span>
                    )}
                  </div>
                  <div className={styles.weaponTags}>
                    <span className={`${styles.badge} ${styles.badgeDmg}`} title="Dano Total">
                      Dano {dmgTotal}
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
    </div>
  );
}
