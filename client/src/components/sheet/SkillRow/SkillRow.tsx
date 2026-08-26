import { useCharacterContext } from '../../../contexts/CharacterContext';
import { SKILLS_CONFIG } from '../../../data/pericias';
import { ATTRIBUTE_FULL_NAMES, ATTRIBUTE_LABELS } from '../../../data/atributos';
import { calcTotalSkill, formatMod } from '../../../utils/calculations';
import type { AttributeId } from '../../../types/character';
import Switch from '../../ui/Switch/Switch';
import NumberField from '../../ui/NumberField/NumberField';
import styles from './SkillRow.module.css';

interface SkillRowProps {
  skillId: string;
}

/**
 * Per-skill glyphs. The data tables (data/pericias.ts) carry no icon field, so
 * we map them here by skill id; ids without an entry fall back to a neutral
 * glyph. Emoji chosen to mirror the design mockup (e.g. ⚡ Iniciativa, 👁
 * Percepção, 🧠 Vontade, 🔮 Misticismo, ⚔ Luta, 🏃 Atletismo, 🌑 Furtividade).
 */
const SKILL_ICONS: Record<string, string> = {
  acrobacia: '🤸',
  adestramento: '🐾',
  atletismo: '🏃',
  atuacao: '🎭',
  cavalgar: '🐎',
  conhecimento: '📚',
  cura: '✚',
  diplomacia: '💬',
  enganacao: '🎲',
  fortitude: '🛡',
  furtividade: '🌑',
  guerra: '🗺',
  iniciativa: '⚡',
  intimidacao: '😠',
  intuicao: '🧭',
  investigacao: '🔍',
  jogatina: '🃏',
  ladinagem: '🗝',
  luta: '⚔',
  misticismo: '🔮',
  nobreza: '👑',
  oficio1: '🔨',
  oficio2: '🔨',
  percepacao: '👁',
  pilotagem: '🚢',
  pontaria: '🎯',
  reflexos: '🤺',
  religiao: '✨',
  sobrevivencia: '🏕',
  vontade: '🧠',
};

const NEUTRAL_GLYPH = '◆';

function SkillRow({ skillId }: SkillRowProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  const cfg = SKILLS_CONFIG.find((p) => p.id === skillId);
  if (!cfg) return null;

  const skill = character.skills[skillId] || { trained: false, misc: 0 };
  const total = calcTotalSkill(character, skillId);
  const locked = !!cfg.trained && !skill.trained;
  const usedAttr = (skill.attribute || cfg.attribute) as AttributeId;
  const name = cfg.customLabel ? skill.label || cfg.name : cfg.name;
  const icon = SKILL_ICONS[skillId] || NEUTRAL_GLYPH;
  const displayTotal = locked ? '—' : formatMod(total);

  const setTrained = (trained: boolean) => {
    updateCharacter((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillId]: { ...prev.skills[skillId], trained },
      },
    }));
  };

  const setMisc = (misc: number) => {
    updateCharacter((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillId]: { ...prev.skills[skillId], misc },
      },
    }));
  };

  /** "+ atributo" direto na perícia: segundo atributo somado ao total (vazio = nenhum). */
  const setBonusAttribute = (value: string) => {
    updateCharacter((prev) => {
      const current = prev.skills[skillId] ?? { trained: false, misc: 0 };
      const { bonusAttribute: _drop, ...rest } = current;
      void _drop;
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [skillId]: value ? { ...rest, bonusAttribute: value as AttributeId } : rest,
        },
      };
    });
  };
  const bonusAttr = skill.bonusAttribute;
  const attrLine = bonusAttr
    ? `${ATTRIBUTE_FULL_NAMES[usedAttr]} + ${ATTRIBUTE_LABELS[bonusAttr]}`
    : ATTRIBUTE_FULL_NAMES[usedAttr];

  const rowCls = [styles.skill, skill.trained ? styles.trained : ''].filter(Boolean).join(' ');

  return (
    <div className={rowCls}>
      <div className={styles.ico}>{icon}</div>
      <div className={styles.nm}>
        {name}
        {skill.trained && <span className={styles.tag}>Treinada</span>}
        <small>{attrLine}</small>
      </div>

      {!readOnly ? (
        <div className={styles.controls}>
          <Switch checked={!!skill.trained} onChange={setTrained} aria-label="Treinada" />
          <NumberField
            className={styles.miscField}
            value={skill.misc || 0}
            onChange={setMisc}
            step={1}
            aria-label="Bônus diverso"
          />
          <select
            className={styles.bonusAttr}
            value={bonusAttr ?? ''}
            onChange={(e) => setBonusAttribute(e.target.value)}
            aria-label="Somar atributo"
            title="+ atributo: soma um segundo atributo ao total"
          >
            <option value="">+ —</option>
            {(Object.keys(ATTRIBUTE_LABELS) as AttributeId[]).map((id) => (
              <option key={id} value={id}>+ {ATTRIBUTE_LABELS[id]}</option>
            ))}
          </select>
          <span className={styles.vl}>{displayTotal}</span>
        </div>
      ) : (
        <span className={styles.vl}>{displayTotal}</span>
      )}
    </div>
  );
}

SkillRow.displayName = 'SkillRow';

export default SkillRow;
