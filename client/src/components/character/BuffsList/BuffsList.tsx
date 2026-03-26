import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import { BUFF_TYPES } from '../../../data/constants';
import { SKILLS_CONFIG } from '../../../data/pericias';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import type { Buff, BuffType, AttributeId } from '../../../types/character';
import styles from './BuffsList.module.css';

export default function BuffsList() {
  const { character, updateCharacter } = useCharacterContext();
  if (!character) return null;

  const updateBuff = (idx: number, updates: Partial<Buff>) => {
    updateCharacter(f => {
      const buffs = [...f.buffs];
      buffs[idx] = { ...buffs[idx], ...updates };
      return { ...f, buffs };
    });
  };

  const addBuff = () => {
    updateCharacter(f => ({
      ...f,
      buffs: [
        ...f.buffs,
        { name: '', type: 'attack_roll' as BuffType, value: '', mp: 0, active: false },
      ],
    }));
  };

  const removeBuff = (idx: number) => {
    updateCharacter(f => ({ ...f, buffs: f.buffs.filter((_, i) => i !== idx) }));
  };

  const toggleBuff = (idx: number) => {
    updateCharacter(f => {
      const buffs = [...f.buffs];
      const b = { ...buffs[idx] };
      const wasActive = b.active;
      b.active = !wasActive;

      let mpCurrent = f.mp.current;
      let hpTemp = f.temporaryHp;
      let mpTemp = f.temporaryMp;
      const mpCost = Number(b.mp) || 0;
      const val = Number(b.value) || 0;

      if (!wasActive) {
        if (mpCost > 0) mpCurrent = Math.max(0, mpCurrent - mpCost);
        if (b.type === 'hp') hpTemp += val;
        if (b.type === 'mp') mpTemp += val;
      } else {
        if (b.type === 'hp') hpTemp = Math.max(0, hpTemp - val);
        if (b.type === 'mp') mpTemp = Math.max(0, mpTemp - val);
      }

      buffs[idx] = b;
      return {
        ...f,
        buffs,
        mp: { ...f.mp, current: mpCurrent },
        temporaryHp: hpTemp,
        temporaryMp: mpTemp,
      };
    });
  };

  return (
    <Section id="secBuffs" title="Buffs">
      {character.buffs.map((buff, idx) => (
        <div
          key={idx}
          className={[styles.card, buff.active && styles.active].filter(Boolean).join(' ')}
        >
          <input
            className={styles.nome}
            value={buff.name}
            onChange={e => updateBuff(idx, { name: e.target.value })}
            placeholder="Nome"
          />
          <select
            className={styles.tipoSel}
            value={buff.type}
            onChange={e => updateBuff(idx, { type: e.target.value as BuffType })}
          >
            {Object.entries(BUFF_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {buff.type === 'skill' && (
            <select
              className={styles.extraSel}
              value={buff.skillId || ''}
              onChange={e => updateBuff(idx, { skillId: e.target.value })}
            >
              <option value="">—</option>
              {SKILLS_CONFIG.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {buff.type === 'attribute' && (
            <select
              className={styles.extraSel}
              value={buff.attributeId || ''}
              onChange={e => updateBuff(idx, { attributeId: e.target.value as AttributeId })}
            >
              <option value="">—</option>
              {(Object.entries(ATTRIBUTE_LABELS) as [AttributeId, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          )}
          <input
            className={styles.valor}
            value={buff.value}
            onChange={e => updateBuff(idx, { value: e.target.value })}
            placeholder="Valor"
          />
          <div className={styles.pmField}>
            <span className={styles.pmLabel}>PM</span>
            <input
              className={styles.pmInput}
              type="number"
              value={buff.mp}
              onChange={e => updateBuff(idx, { mp: Number(e.target.value) || 0 })}
            />
          </div>
          <button
            className={[styles.toggle, buff.active && styles.toggleOn].filter(Boolean).join(' ')}
            onClick={() => toggleBuff(idx)}
          >
            ●
          </button>
          <button className={styles.removeSm} onClick={() => removeBuff(idx)}>✕</button>
        </div>
      ))}
      <Button variant="add" onClick={addBuff}>+ Buff</Button>
    </Section>
  );
}
