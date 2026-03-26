import { useCharacterContext } from '../../../contexts/CharacterContext';
import { SKILLS_CONFIG } from '../../../data/pericias';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import { getTotalLevel, calcTotalSkill, formatMod } from '../../../utils/calculations';
import type { AttributeId } from '../../../types/character';
import styles from './SkillsList.module.css';

const ATTR_OPTIONS: AttributeId[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export default function SkillsList() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const halfLevel = Math.floor(getTotalLevel(character) / 2);

  const toggleTrained = (id: string) => {
    updateCharacter((f) => ({
      ...f,
      skills: {
        ...f.skills,
        [id]: { ...f.skills[id], trained: !f.skills[id]?.trained },
      },
    }));
  };

  const setMisc = (id: string, val: number) => {
    updateCharacter((f) => ({
      ...f,
      skills: {
        ...f.skills,
        [id]: { ...f.skills[id], misc: val },
      },
    }));
  };

  const setAttribute = (id: string, attr: AttributeId) => {
    updateCharacter((f) => ({
      ...f,
      skills: {
        ...f.skills,
        [id]: { ...f.skills[id], attribute: attr },
      },
    }));
  };

  const setLabel = (id: string, label: string) => {
    updateCharacter((f) => ({
      ...f,
      skills: {
        ...f.skills,
        [id]: { ...f.skills[id], label },
      },
    }));
  };

  return (
    <div>
      <div className={styles.headerInfo}>
        ½ Nível: <strong>{halfLevel}</strong> &nbsp;|&nbsp; Bônus de Treinamento: <strong>+2</strong>
      </div>
      <div className={styles.grid}>
        {SKILLS_CONFIG.map((cfg) => {
          const skill = character.skills[cfg.id] || { trained: false, misc: 0 };
          const total = calcTotalSkill(character, cfg.id);
          const usedAttr = (skill.attribute || cfg.attribute) as AttributeId;
          const isCustomAttr = !!skill.attribute && skill.attribute !== cfg.attribute;
          const rowCls = [
            styles.row,
            skill.trained ? styles.trainedActive : '',
            cfg.trained && !skill.trained ? styles.trainedOnly : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={cfg.id} className={rowCls}>
              <input
                type="checkbox"
                className={styles.check}
                checked={skill.trained}
                onChange={() => toggleTrained(cfg.id)}
              />
              {cfg.customLabel ? (
                <input
                  className={styles.labelCustom}
                  value={skill.label || ''}
                  onChange={(e) => setLabel(cfg.id, e.target.value)}
                  placeholder={cfg.name}
                />
              ) : (
                <span className={styles.nome}>{cfg.name}</span>
              )}
              <select
                className={`${styles.attrSelect} ${isCustomAttr ? styles.attrCustom : ''}`}
                value={usedAttr}
                onChange={(e) => setAttribute(cfg.id, e.target.value as AttributeId)}
              >
                {ATTR_OPTIONS.map((a) => (
                  <option key={a} value={a}>{ATTRIBUTE_LABELS[a]}</option>
                ))}
              </select>
              <input
                type="number"
                className={styles.outros}
                value={skill.misc || 0}
                onChange={(e) => setMisc(cfg.id, Number(e.target.value) || 0)}
              />
              <span className={styles.total}>{formatMod(total)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
