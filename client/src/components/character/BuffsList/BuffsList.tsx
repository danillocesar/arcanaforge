import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import { toggleBuffState } from '../../../utils/calculations';
import { BUFF_TYPES } from '../../../data/constants';
import { SKILLS_CONFIG } from '../../../data/pericias';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import type { Buff, BuffEffect, BuffType, AttributeId } from '../../../types/character';
import NumericInput from '../../ui/NumericInput/NumericInput';
import ConfirmModal from '../../ui/ConfirmModal/ConfirmModal';
import styles from './BuffsList.module.css';

export default function BuffsList() {
  const { character, updateCharacter } = useCharacterContext();
  const [removeIdx, setRemoveIdx] = useState<number | null>(null);

  if (!character) return null;

  const updateBuff = (idx: number, updates: Partial<Buff>) => {
    updateCharacter((f) => {
      const buffs = [...f.buffs];
      buffs[idx] = { ...buffs[idx], ...updates };
      return { ...f, buffs };
    });
  };

  const updateEffect = (idx: number, effIdx: number, updates: Partial<BuffEffect>) => {
    updateCharacter((f) => {
      const buffs = [...f.buffs];
      const effects = [...(buffs[idx].effects || [])];
      effects[effIdx] = { ...effects[effIdx], ...updates };
      buffs[idx] = { ...buffs[idx], effects };
      return { ...f, buffs };
    });
  };

  const addBuff = () => {
    updateCharacter((f) => ({
      ...f,
      buffs: [
        ...f.buffs,
        { name: '', effects: [{ type: 'attack_roll' as BuffType, value: '' }], mp: 0, active: false },
      ],
    }));
  };

  const removeBuff = (idx: number) => {
    updateCharacter((f) => ({ ...f, buffs: f.buffs.filter((_, i) => i !== idx) }));
  };

  const toggleBuff = (idx: number) => {
    updateCharacter((f) => toggleBuffState(f, idx));
  };

  const buffToRemove = removeIdx != null ? character.buffs[removeIdx] : null;

  return (
    <Section id="secBuffs" title="Buffs">
      {character.buffs.map((buff, idx) => (
        <div
          key={idx}
          className={[styles.card, buff.active && styles.active].filter(Boolean).join(' ')}
        >
          <input
            className={styles.name}
            value={buff.name}
            onChange={(e) => updateBuff(idx, { name: e.target.value })}
            placeholder="Nome"
          />
          {(buff.effects || []).map((eff, effIdx) => (
            <div key={effIdx} className={styles.effectRow}>
              <select
                className={styles.tipoSel}
                value={eff.type}
                onChange={(e) => updateEffect(idx, effIdx, { type: e.target.value as BuffType })}
              >
                {Object.entries(BUFF_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {eff.type === 'skill' && (
                <select
                  className={styles.extraSel}
                  value={eff.skillId || ''}
                  onChange={(e) => updateEffect(idx, effIdx, { skillId: e.target.value })}
                >
                  <option value="">-</option>
                  {SKILLS_CONFIG.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              {eff.type === 'attribute' && (
                <select
                  className={styles.extraSel}
                  value={eff.attributeId || ''}
                  onChange={(e) => updateEffect(idx, effIdx, { attributeId: e.target.value as AttributeId })}
                >
                  <option value="">-</option>
                  {(Object.entries(ATTRIBUTE_LABELS) as [AttributeId, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              )}
              <input
                className={styles.valor}
                value={eff.value}
                onChange={(e) => updateEffect(idx, effIdx, { value: e.target.value })}
                placeholder="Valor"
              />
            </div>
          ))}
          <div className={styles.pmField}>
            <span className={styles.pmLabel}>PM</span>
            <NumericInput
              className={styles.pmInput}
              value={buff.mp}
              onChange={(n) => updateBuff(idx, { mp: n })}
            />
          </div>
          <button
            className={[styles.toggle, buff.active && styles.toggleOn].filter(Boolean).join(' ')}
            onClick={() => toggleBuff(idx)}
            aria-label={buff.active ? 'Desativar buff' : 'Ativar buff'}
          >
            <span aria-hidden="true">●</span>
          </button>
          <button className={styles.removeSm} onClick={() => setRemoveIdx(idx)} aria-label="Remover buff">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <Button variant="add" onClick={addBuff}>+ Buff</Button>

      <ConfirmModal
        open={removeIdx != null}
        onClose={() => setRemoveIdx(null)}
        onConfirm={() => {
          if (removeIdx != null) removeBuff(removeIdx);
        }}
        title="Remover buff?"
        message={`Isso apaga "${buffToRemove?.name || 'Buff'}" da ficha.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </Section>
  );
}
