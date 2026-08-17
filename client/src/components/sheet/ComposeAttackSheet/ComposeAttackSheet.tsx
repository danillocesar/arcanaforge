import { useEffect, useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { buildAttackChecklist, composeAttack } from '../../../utils/attackCompose';
import { formatMod } from '../../../utils/calculations';
import { playSwordSound, playArrowSound } from '../../../utils/sounds';
import { triggerAttackAnim } from '../../../utils/animations';
import type { Attack } from '../../../types/character';
import Sheet from '../../ui/Sheet/Sheet';
import styles from './ComposeAttackSheet.module.css';

interface ComposeAttackSheetProps {
  attack: Attack | null;
  onClose: () => void;
}

/**
 * Aberto pelo "⚔ Atacar" do ActionCard quando há pelo menos um item pra compor
 * (extraBonuses/extraDamage do próprio ataque, ou AttackModifier de Poder/Magia/
 * Item do personagem). Checklist com total recalculado ao vivo, mesmo padrão do
 * CastActionSheet — mas confirma rolando/logando o ataque, não aplicando buff.
 */
function ComposeAttackSheet({ attack, onClose }: ComposeAttackSheetProps) {
  const { character, updateCharacter } = useCharacterContext();
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());
  const [lastAttack, setLastAttack] = useState<Attack | null>(null);

  const activeAttack = attack ?? lastAttack;

  useEffect(() => {
    if (attack && character) {
      setLastAttack(attack);
      const checked = buildAttackChecklist(character, attack)
        .filter((item) => item.defaultChecked)
        .map((item) => item.key);
      setEnabledKeys(new Set(checked));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attack]);

  if (!character || !activeAttack) return null;

  const checklist = buildAttackChecklist(character, activeAttack);
  const result = composeAttack(character, activeAttack, checklist, enabledKeys);
  const rangeLabel = activeAttack.rangeType === 'ranged' ? 'À distância' : 'Corpo a corpo';

  const toggleItem = (key: string) => {
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const confirm = () => {
    updateCharacter((f) => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - result.mpTotal) },
      logs: [
        ...f.logs,
        {
          type: 'attack',
          name: activeAttack.name || 'Ataque',
          mpSpent: result.mpTotal,
          timestamp: Date.now(),
          details: {
            attackRoll: result.attackRoll,
            damage: result.damage,
            rangeType: rangeLabel,
            modifiers: result.usedLabels,
          },
        },
      ],
    }));

    if (activeAttack.rangeType === 'ranged') {
      playArrowSound();
    } else {
      playSwordSound();
    }

    triggerAttackAnim('toast', {
      type: activeAttack.rangeType === 'ranged' ? 'ranged' : 'melee',
      name: activeAttack.name || 'Ataque',
      mpCost: result.mpTotal,
    });

    onClose();
  };

  const footer = (
    <>
      <button type="button" className={styles.btnCancel} onClick={onClose}>
        Cancelar
      </button>
      <button type="button" className={styles.btnConfirm} onClick={confirm}>
        ⚔ Atacar
      </button>
    </>
  );

  return (
    <Sheet open={Boolean(attack)} onClose={onClose} title={activeAttack.name || 'Ataque'} footer={footer}>
      <div className={styles.baseRow}>
        <div className={styles.baseStat}>
          <span className={styles.baseLabel}>Ataque</span>
          <span className={styles.baseVal}>{formatMod(result.attackRoll)}</span>
        </div>
        <div className={styles.baseStat}>
          <span className={styles.baseLabel}>Dano</span>
          <span className={styles.baseVal}>{result.damage}</span>
        </div>
      </div>

      {checklist.length > 0 && <div className={styles.listHeader}>Modificadores</div>}

      <div className={styles.list}>
        {checklist.map((item) => (
          <label key={item.key} className={styles.item}>
            <input
              type="checkbox"
              checked={enabledKeys.has(item.key)}
              onChange={() => toggleItem(item.key)}
            />
            <span className={styles.itemInfo}>
              <span className={styles.itemName}>{item.label}</span>
              {item.source && <span className={styles.itemSource}>{item.source}</span>}
            </span>
            <span className={styles.itemDelta}>
              {item.attackRoll ? `${formatMod(item.attackRoll)} atq` : ''}
              {item.damageBonus ? ` ${formatMod(item.damageBonus)} dano` : ''}
              {item.damageDice ? ` ${item.damageDice}` : ''}
            </span>
          </label>
        ))}
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Custo Total</span>
        <span className={styles.totalVal}>{result.mpTotal} PM</span>
      </div>
    </Sheet>
  );
}

ComposeAttackSheet.displayName = 'ComposeAttackSheet';

export default ComposeAttackSheet;
