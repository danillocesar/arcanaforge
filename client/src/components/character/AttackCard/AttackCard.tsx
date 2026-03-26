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
import styles from './AttackCard.module.css';

interface AtaqueCardProps {
  index: number;
}

export default function AtaqueCard({ index }: AtaqueCardProps) {
  const { character, updateCharacter } = useCharacterContext();
  if (!character) return null;

  const atk = character.attacks[index];
  if (!atk) return null;

  const updateAtaque = (updates: Partial<typeof atk>) => {
    updateCharacter(f => {
      const attacks = [...f.attacks];
      attacks[index] = { ...attacks[index], ...updates };
      return { ...f, attacks };
    });
  };

  const removeAtaque = () => {
    updateCharacter(f => ({ ...f, attacks: f.attacks.filter((_, i) => i !== index) }));
  };

  const duplicateAtaque = () => {
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

  const usarAtaque = () => {
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
          teste: testeTotal,
          dano: danoResumo,
          custoTipo: atk.rangeType === 'ranged' ? 'A Distância' : 'Corpo a Corpo',
        },
      }],
    }));

    if (atk.rangeType === 'ranged') {
      playArrowSound();
    } else {
      playSwordSound();
    }

    const estilo = 'toast' as AnimationStyle;
    triggerAttackAnim(estilo, {
      type: atk.rangeType === 'ranged' ? 'ranged' : 'melee',
      name: atk.name || 'Ataque',
      mpCost: pm,
    });
  };

  const updateBonusTeste = (bIdx: number, updates: Partial<ExtraBonus>) => {
    const extraBonuses = [...atk.extraBonuses];
    extraBonuses[bIdx] = { ...extraBonuses[bIdx], ...updates };
    updateAtaque({ extraBonuses });
  };

  const removeBonusTeste = (bIdx: number) => {
    updateAtaque({ extraBonuses: atk.extraBonuses.filter((_, i) => i !== bIdx) });
  };

  const addBonusTeste = () => {
    updateAtaque({ extraBonuses: [...atk.extraBonuses, { name: '', value: 0, mp: 0 }] });
  };

  const updateBonusDano = (dIdx: number, updates: Partial<ExtraDamage>) => {
    const extraDamage = [...atk.extraDamage];
    extraDamage[dIdx] = { ...extraDamage[dIdx], ...updates };
    updateAtaque({ extraDamage });
  };

  const removeBonusDano = (dIdx: number) => {
    updateAtaque({ extraDamage: atk.extraDamage.filter((_, i) => i !== dIdx) });
  };

  const addBonusDano = () => {
    updateAtaque({ extraDamage: [...atk.extraDamage, { name: '', value: '', mp: 0 }] });
  };

  const periciaId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  const periciaBase = calcTotalSkill(character, periciaId);
  const testeTotal = calcAttackRoll(character, atk);
  const danoResumo = buildDamageSummary(character, atk);
  const danoAttrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  const danoAttrVal = getEffectiveAttribute(character, danoAttrKey);
  const pmTotal = calcTotalMp(atk);
  const activeTesteBuffs = character.buffs.filter(b =>
    b.active && (
      b.type === 'attack_roll' ||
      (b.type === 'skill' && b.skillId === periciaId)
    )
  );
  const activeDanoBuffs = character.buffs.filter(
    b => b.active && (b.type === 'fixed_damage' || b.type === 'extra_damage'),
  );

  return (
    <div className={styles.card}>
      <button className={styles.usar} onClick={usarAtaque} title="Usar">⚔</button>
      <button className={styles.duplicate} onClick={duplicateAtaque} title="Duplicar">⧉</button>
      <button className={styles.remove} onClick={removeAtaque} title="Remover">✕</button>

      <div className={styles.topRow}>
        <div className={`${styles.campoInfo} ${styles.nomeField}`}>
          <label>Nome</label>
          <input value={atk.name ?? ''} onChange={e => updateAtaque({ name: e.target.value })} />
        </div>
        <div className={styles.campoInfo}>
          <label>Alcance</label>
          <select
            value={atk.rangeType ?? 'melee'}
            onChange={e => updateAtaque({ rangeType: e.target.value })}
          >
            <option value="melee">Corpo a corpo</option>
            <option value="ranged">À distância</option>
          </select>
        </div>
        <div className={styles.campoInfo}>
          <label>Crítico</label>
          <input value={atk.critical ?? ''} onChange={e => updateAtaque({ critical: e.target.value })} />
        </div>
        <div className={styles.campoInfo}>
          <label>Tipo Dano</label>
          <input value={atk.type ?? ''} onChange={e => updateAtaque({ type: e.target.value })} />
        </div>
        <div className={styles.campoInfo}>
          <label>Custo PM</label>
          <input
            type="number"
            value={atk.mpCost ?? 0}
            onChange={e => updateAtaque({ mpCost: Number(e.target.value) || 0 })}
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
            <span className={styles.checkTotal}>{formatMod(testeTotal)}</span>
          </div>
          <div className={styles.bonusList}>
            <div className={styles.bonusRow}>
              <span className={styles.bonusFixed}>
                {atk.rangeType === 'ranged' ? 'Pontaria' : 'Luta'}
              </span>
              <span className={styles.bonusValorFixed}>{formatMod(periciaBase)}</span>
            </div>
            {atk.extraBonuses.map((b, bIdx) => (
              <div key={bIdx} className={styles.bonusRow}>
                <input
                  value={b.name ?? ''}
                  onChange={e => updateBonusTeste(bIdx, { name: e.target.value })}
                  placeholder="Bônus"
                />
                <input
                  type="number"
                  value={b.value ?? 0}
                  onChange={e => updateBonusTeste(bIdx, { value: Number(e.target.value) || 0 })}
                />
                <input
                  type="number"
                  value={b.mp ?? 0}
                  onChange={e => updateBonusTeste(bIdx, { mp: Number(e.target.value) || 0 })}
                  placeholder="PM"
                />
                <button className={styles.removeSm} onClick={() => removeBonusTeste(bIdx)}>
                  ✕
                </button>
              </div>
            ))}
            {activeTesteBuffs.map((b, i) => (
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
            <span className={`${styles.checkTotal} ${styles.damageTotal}`}>{danoResumo}</span>
          </div>
          <div className={styles.bonusList}>
            <div className={styles.bonusRow}>
              <span className={styles.bonusFixed}>Dados</span>
              <input
                className={styles.damageDice}
                value={atk.damage ?? ''}
                onChange={e => updateAtaque({ damage: e.target.value })}
                placeholder="2d8"
              />
            </div>
            <div className={styles.bonusRow}>
              <select
                className={styles.damageAttrSel}
                value={atk.attributeDamageBonus || 'str'}
                onChange={e => updateAtaque({ attributeDamageBonus: e.target.value })}
              >
                {(Object.entries(ATTRIBUTE_LABELS) as [AttributeId, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <span className={styles.bonusValorFixed}>{formatMod(danoAttrVal)}</span>
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
                <input
                  type="number"
                  value={d.mp ?? 0}
                  onChange={e => updateBonusDano(dIdx, { mp: Number(e.target.value) || 0 })}
                  placeholder="PM"
                />
                <button className={styles.removeSm} onClick={() => removeBonusDano(dIdx)}>
                  ✕
                </button>
              </div>
            ))}
            {activeDanoBuffs.map((b, i) => (
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
