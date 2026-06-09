import { useCharacterContext } from '../../../contexts/CharacterContext';
import { SKILLS_CONFIG } from '../../../data/pericias';
import { ATTRIBUTE_FULL_NAMES } from '../../../data/atributos';
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
  const usedAttr = (skill.attribute || cfg.attribute) as AttributeId;
  const name = cfg.customLabel ? skill.label || cfg.name : cfg.name;
  const icon = SKILL_ICONS[skillId] || NEUTRAL_GLYPH;

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

  const rowCls = [styles.skill, skill.trained ? styles.trained : ''].filter(Boolean).join(' ');

  return (
    <div className={rowCls}>
      <div className={styles.ico}>{icon}</div>
      <div className={styles.nm}>
        {name}
        {skill.trained && <span className={styles.tag}>Treinada</span>}
        <small>{ATTRIBUTE_FULL_NAMES[usedAttr]}</small>
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
          <span className={styles.vl}>{formatMod(total)}</span>
        </div>
      ) : (
        <span className={styles.vl}>{formatMod(total)}</span>
      )}
    </div>
  );
}

SkillRow.displayName = 'SkillRow';

export default SkillRow;
