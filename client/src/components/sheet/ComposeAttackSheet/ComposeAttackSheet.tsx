import { useEffect, useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { buildAttackChecklist, composeAttack, multiplyDamageDice } from '../../../utils/attackCompose';
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
  // Contagem por item: 0/ausente = desmarcado; N > 1 = modificador empilhado N
  // vezes (ex.: Smite Divino 1d8/1 PM marcado 3× = 3d8/3 PM).
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [lastAttack, setLastAttack] = useState<Attack | null>(null);

  const activeAttack = attack ?? lastAttack;

  useEffect(() => {
    if (attack && character) {
      setLastAttack(attack);
      const checked = buildAttackChecklist(character, attack)
        .filter((item) => item.defaultChecked)
        .map((item) => [item.key, 1] as const);
      setCounts(new Map(checked));
    }
    // Re-seed only on the open transition (null -> Attack), not on every re-render
    // that happens to hand us a new `attack` object with the same identity's worth
    // of data — weapon-derived attacks are rebuilt fresh on every AcoesPanel render
    // (e.g. each autosave tick), so keying this on object identity would silently
    // wipe the player's in-progress selections mid-composition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(attack)]);

  if (!character || !activeAttack) return null;

  const checklist = buildAttackChecklist(character, activeAttack);
  const result = composeAttack(character, activeAttack, checklist, counts);
  const rangeLabel = activeAttack.rangeType === 'ranged' ? 'À distância' : 'Corpo a corpo';

  const toggleItem = (key: string) => {
    setCounts((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key); else next.set(key, 1);
      return next;
    });
  };

  const bumpItem = (key: string, delta: number) => {
    setCounts((prev) => {
      const next = new Map(prev);
      const value = Math.max(0, (next.get(key) ?? 0) + delta);
      if (value === 0) next.delete(key); else next.set(key, value);
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
        <div className={styles.baseStat}>
          <span className={styles.baseLabel}>Crítico</span>
          <span className={styles.baseVal}>{activeAttack.critical || '—'}</span>
        </div>
      </div>

      {checklist.length > 0 && <div className={styles.listHeader}>Modificadores</div>}

      <div className={styles.list}>
        {checklist.map((item) => {
          const count = counts.get(item.key) ?? 0;
          // Desmarcado mostra o efeito de 1 aplicação; marcado mostra o total ×N.
          const shown = Math.max(count, 1);
          return (
            <label key={item.key} className={styles.item}>
              <input
                type="checkbox"
                checked={count > 0}
                onChange={() => toggleItem(item.key)}
              />
              <span className={styles.itemInfo}>
                <span className={styles.itemName}>{item.label}</span>
                {item.source && <span className={styles.itemSource}>{item.source}</span>}
              </span>
              {count > 0 && (
                <span className={styles.stack}>
                  <button
                    type="button"
                    className={styles.stackBtn}
                    aria-label="Aplicar uma vez a menos"
                    onClick={(e) => { e.preventDefault(); bumpItem(item.key, -1); }}
                  >
                    −
                  </button>
                  <span className={styles.stackCount}>×{count}</span>
                  <button
                    type="button"
                    className={styles.stackBtn}
                    aria-label="Aplicar uma vez a mais"
                    onClick={(e) => { e.preventDefault(); bumpItem(item.key, 1); }}
                  >
                    +
                  </button>
                </span>
              )}
              <span className={styles.itemDelta}>
                {item.attackRoll ? `${formatMod(item.attackRoll * shown)} atq` : ''}
                {item.damageBonus ? ` ${formatMod(item.damageBonus * shown)} dano` : ''}
                {item.damageDice ? ` ${multiplyDamageDice(item.damageDice, shown)}` : ''}
                {item.mpCost ? ` ${item.mpCost * shown} PM` : ''}
              </span>
            </label>
          );
        })}
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
