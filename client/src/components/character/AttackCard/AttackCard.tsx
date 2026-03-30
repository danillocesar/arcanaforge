import { useCharacterContext } from '../../../contexts/CharacterContext';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import {
  formatMod,
  calcAttackRoll,
  buildDamageSummary,
  calcTotalMp,
  calcTotalSkill,
  getEffectiveAttribute,
} from '../../../utils/calculations';
import { playSwordSound, playArrowSound } from '../../../utils/sounds';
import { triggerAttackAnim, type AnimationStyle } from '../../../utils/animations';
import type { AttributeId, ExtraBonus, ExtraDamage } from '../../../types/character';
import NumericInput from '../../ui/NumericInput/NumericInput';
import styles from './AttackCard.module.css';

interface AttackCardProps {
  index: number;
}

export default function AttackCard({ index }: AttackCardProps) {
  const { character, updateCharacter } = useCharacterContext();
  if (!character) return null;

  const atk = character.attacks[index];
  if (!atk) return null;

  const updateAttack = (updates: Partial<typeof atk>) => {
    updateCharacter(f => {
      const attacks = [...f.attacks];
      attacks[index] = { ...attacks[index], ...updates };
      return { ...f, attacks };
    });
  };

  const removeAttack = () => {
    updateCharacter(f => ({ ...f, attacks: f.attacks.filter((_, i) => i !== index) }));
  };

  const duplicateAttack = () => {
    updateCharacter(f => {
      const attacks = [...f.attacks];
      attacks.splice(index + 1, 0, {
        ...attacks[index],
        extraBonuses: attacks[index].extraBonuses.map(b => ({ ...b })),
        extraDamage: attacks[index].extraDamage.map(d => ({ ...d })),
      });
      return { ...f, attacks };
    });
  };

  const useAttack = () => {
    const pm = calcTotalMp(atk);
    updateCharacter(f => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - pm) },
      logs: [...f.logs, {
        type: 'attack',
        name: atk.name || 'Ataque',
        mpSpent: pm,
        timestamp: Date.now(),
        details: {
          attackRoll: attackRollTotal,
          damage: damageSummary,
          rangeType: atk.rangeType === 'ranged' ? 'A Distância' : 'Corpo a Corpo',
        },
      }],
    }));

    if (atk.rangeType === 'ranged') {
      playArrowSound();
    } else {
      playSwordSound();
    }

    const animationStyle = 'toast' as AnimationStyle;
    triggerAttackAnim(animationStyle, {
      type: atk.rangeType === 'ranged' ? 'ranged' : 'melee',
      name: atk.name || 'Ataque',
      mpCost: pm,
    });
  };

  const updateBonusTeste = (bIdx: number, updates: Partial<ExtraBonus>) => {
    const extraBonuses = [...atk.extraBonuses];
    extraBonuses[bIdx] = { ...extraBonuses[bIdx], ...updates };
    updateAttack({ extraBonuses });
  };

  const removeBonusTeste = (bIdx: number) => {
    updateAttack({ extraBonuses: atk.extraBonuses.filter((_, i) => i !== bIdx) });
  };

  const addBonusTeste = () => {
    updateAttack({ extraBonuses: [...atk.extraBonuses, { name: '', value: 0, mp: 0 }] });
  };

  const updateBonusDano = (dIdx: number, updates: Partial<ExtraDamage>) => {
    const extraDamage = [...atk.extraDamage];
    extraDamage[dIdx] = { ...extraDamage[dIdx], ...updates };
    updateAttack({ extraDamage });
  };

  const removeBonusDano = (dIdx: number) => {
    updateAttack({ extraDamage: atk.extraDamage.filter((_, i) => i !== dIdx) });
  };

  const addBonusDano = () => {
    updateAttack({ extraDamage: [...atk.extraDamage, { name: '', value: '', mp: 0 }] });
  };

  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  const skillBase = calcTotalSkill(character, skillId);
  const attackRollTotal = calcAttackRoll(character, atk);
  const damageSummary = buildDamageSummary(character, atk);
  const damageAttrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  const damageAttrVal = getEffectiveAttribute(character, damageAttrKey);
  const pmTotal = calcTotalMp(atk);
  const activeRollBuffs = character.buffs.filter(b =>
    b.active && (
      b.type === 'attack_roll' ||
      (b.type === 'skill' && b.skillId === skillId)
    )
  );
  const activeDamageBuffs = character.buffs.filter(
    b => b.active && (b.type === 'fixed_damage' || b.type === 'extra_damage'),
  );

  return (
    <div className={styles.card}>
      <button className={styles.use} onClick={useAttack} title="Usar">⚔</button>
      <button className={styles.duplicate} onClick={duplicateAttack} title="Duplicar">⧉</button>
      <button className={styles.remove} onClick={removeAttack} title="Remover">✕</button>

      <div className={styles.topRow}>
        <div className={`${styles.infoField} ${styles.nomeField}`}>
          <label>Nome</label>
          <input value={atk.name ?? ''} onChange={e => updateAttack({ name: e.target.value })} />
        </div>
        <div className={styles.infoField}>
          <label>Alcance</label>
          <select
            value={atk.rangeType ?? 'melee'}
            onChange={e => updateAttack({ rangeType: e.target.value })}
          >
            <option value="melee">Corpo a corpo</option>
            <option value="ranged">À distância</option>
          </select>
        </div>
        <div className={styles.infoField}>
          <label>Crítico</label>
          <input value={atk.critical ?? ''} onChange={e => updateAttack({ critical: e.target.value })} />
        </div>
        <div className={styles.infoField}>
          <label>Tipo Dano</label>
          <input value={atk.type ?? ''} onChange={e => updateAttack({ type: e.target.value })} />
        </div>
        <div className={styles.infoField}>
          <label>Custo PM</label>
          <NumericInput
            value={atk.mpCost ?? 0}
            onChange={(n) => updateAttack({ mpCost: n })}
          />
        </div>
        <div className={styles.pmBadgeWrap}>
          <span className={styles.pmBadge}>{pmTotal} PM</span>
        </div>
      </div>

      <div className={styles.sectionsRow}>
        <div className={styles.checkSection}>
          <div className={styles.checkHeader}>
            <label>Teste de Ataque</label>
            <span className={styles.checkTotal}>{formatMod(attackRollTotal)}</span>
          </div>
          <div className={styles.bonusList}>
            <div className={styles.bonusRow}>
              <span className={styles.bonusFixed}>
                {atk.rangeType === 'ranged' ? 'Pontaria' : 'Luta'}
              </span>
              <span className={styles.bonusValorFixed}>{formatMod(skillBase)}</span>
            </div>
            {atk.extraBonuses.map((b, bIdx) => (
              <div key={bIdx} className={styles.bonusRow}>
                <input
                  value={b.name ?? ''}
                  onChange={e => updateBonusTeste(bIdx, { name: e.target.value })}
                  placeholder="Bônus"
                />
                <NumericInput
                  value={b.value ?? 0}
                  onChange={(n) => updateBonusTeste(bIdx, { value: n })}
                />
                <NumericInput
                  value={b.mp ?? 0}
                  onChange={(n) => updateBonusTeste(bIdx, { mp: n })}
                  placeholder="PM"
                />
                <button className={styles.removeSm} onClick={() => removeBonusTeste(bIdx)}>
                  ✕
                </button>
              </div>
            ))}
            {activeRollBuffs.map((b, i) => (
              <div key={`buff-${i}`} className={styles.buffRow}>
                <span className={styles.buffNome}>{b.name}</span>
                <span className={styles.buffValor}>{formatMod(Number(b.value) || 0)}</span>
              </div>
            ))}
          </div>
          <button className={styles.addBonus} onClick={addBonusTeste}>+ Bônus</button>
        </div>

        <div className={`${styles.checkSection} ${styles.damageSection}`}>
          <div className={styles.checkHeader}>
            <label>Dano</label>
            <span className={`${styles.checkTotal} ${styles.damageTotal}`}>{damageSummary}</span>
          </div>
          <div className={styles.bonusList}>
            <div className={styles.bonusRow}>
              <span className={styles.bonusFixed}>Dados</span>
              <input
                className={styles.damageDice}
                value={atk.damage ?? ''}
                onChange={e => updateAttack({ damage: e.target.value })}
                placeholder="2d8"
              />
            </div>
            <div className={styles.bonusRow}>
              <select
                className={styles.damageAttrSel}
                value={atk.attributeDamageBonus || 'str'}
                onChange={e => updateAttack({ attributeDamageBonus: e.target.value })}
              >
                {(Object.entries(ATTRIBUTE_LABELS) as [AttributeId, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <span className={styles.bonusValorFixed}>{formatMod(damageAttrVal)}</span>
            </div>
            {atk.extraDamage.map((d, dIdx) => (
              <div key={dIdx} className={styles.bonusRow}>
                <input
                  value={d.name ?? ''}
                  onChange={e => updateBonusDano(dIdx, { name: e.target.value })}
                  placeholder="Bônus"
                />
                <input
                  value={d.value ?? ''}
                  onChange={e => updateBonusDano(dIdx, { value: e.target.value })}
                  placeholder="Valor"
                />
                <NumericInput
                  value={d.mp ?? 0}
                  onChange={(n) => updateBonusDano(dIdx, { mp: n })}
                  placeholder="PM"
                />
                <button className={styles.removeSm} onClick={() => removeBonusDano(dIdx)}>
                  ✕
                </button>
              </div>
            ))}
            {activeDamageBuffs.map((b, i) => (
              <div key={`buff-${i}`} className={styles.buffRow}>
                <span className={styles.buffNome}>{b.name}</span>
                <span className={styles.buffValor}>{String(b.value)}</span>
              </div>
            ))}
          </div>
          <button className={styles.addBonus} onClick={addBonusDano}>+ Bônus</button>
        </div>
      </div>
    </div>
  );
}
