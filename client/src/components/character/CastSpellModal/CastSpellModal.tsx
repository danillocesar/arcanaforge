import { useState, useEffect } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Modal from '../../ui/Modal/Modal';
import { getTotalLevel } from '../../../utils/calculations';
import { playMagicSound } from '../../../utils/sounds';
import { triggerAttackAnim, type AnimationStyle } from '../../../utils/animations';
import styles from './CastSpellModal.module.css';

interface CastSpellModalProps {
  spellIdx: number | null;
  onClose: () => void;
}

export default function CastSpellModal({ spellIdx, onClose }: CastSpellModalProps) {
  const { character, updateCharacter } = useCharacterContext();
  const [selected, setSelected] = useState<boolean[]>([]);

  const spell = character && spellIdx !== null ? character.spells[spellIdx] : null;
  const enhancements = spell && Array.isArray(spell.enhancements)
    ? spell.enhancements
    : [];

  useEffect(() => {
    if (spell) {
      setSelected(new Array(enhancements.length).fill(false));
    }
  }, [spellIdx]);

  if (!character || !spell) return null;

  const baseCost = Number(spell.mpCost) || 0;
  const enhCost = enhancements.reduce(
    (sum, enh, i) => selected[i] ? sum + (Number(enh.mpCost) || 0) : sum,
    0,
  );
  const totalCost = baseCost + enhCost;
  const level = getTotalLevel(character);

  const confirm = () => {
    const selectedEnhancements = enhancements
      .filter((_, i) => selected[i])
      .map(enh => ({ desc: enh.description || 'Aprimoramento', pm: Number(enh.mpCost) || 0 }));

    updateCharacter(f => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - totalCost) },
      logs: [
        ...f.logs,
        {
          type: 'spell',
          name: spell.name || 'Magia',
          mpSpent: totalCost,
          timestamp: Date.now(),
          details: { baseMpCost: baseCost, enhancements: selectedEnhancements, totalCost: totalCost },
        },
      ],
    }));
    playMagicSound();
    const animationStyle = 'toast' as AnimationStyle;
    triggerAttackAnim(animationStyle, {
      type: 'magic',
      name: spell.name || 'Magia',
      mpCost: totalCost,
    });
    onClose();
  };

  const toggleEnhancement = (i: number) => {
    const next = [...selected];
    next[i] = !next[i];
    setSelected(next);
  };

  return (
    <Modal open onClose={onClose}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>✨ {spell.name || 'Magia'}</h3>
          <button className={styles.closeBtn} onClick={onClose} title="Fechar">✕</button>
        </div>
        <div className={styles.body}>
          <div className={styles.baseCost}>
            <span className={styles.baseLabel}>Custo Base</span>
            <span className={styles.baseVal}>{baseCost} PM</span>
          </div>

          {enhancements.length > 0 && (
            <div className={styles.enhListHeader}>Aprimoramentos</div>
          )}

          <div className={styles.enhList}>
            {enhancements.length > 0 ? (
              enhancements.map((enh, i) => (
                <label key={i} className={styles.enhItem}>
                  <input
                    type="checkbox"
                    checked={selected[i] || false}
                    onChange={() => toggleEnhancement(i)}
                  />
                  <span className={styles.enhDesc}>
                    {enh.description || `Aprimoramento ${i + 1}`}
                  </span>
                  <span className={styles.enhPmBadge}>+{Number(enh.mpCost) || 0} PM</span>
                </label>
              ))
            ) : (
              <p className={styles.enhEmpty}>Nenhum aprimoramento cadastrado.</p>
            )}
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Custo Total</span>
            <span className={styles.totalVal}>{totalCost} PM</span>
          </div>

          {totalCost > level && (
            <div className={styles.warn}>
              Custo excede o nível do personagem ({level})
            </div>
          )}

          <div className={styles.info}>
            <span>PM atual: <strong>{character.mp.current}</strong></span>
            <span>Nível: <strong>{level}</strong></span>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button className={styles.confirmBtn} onClick={confirm}>✨ Conjurar</button>
        </div>
      </div>
    </Modal>
  );
}
