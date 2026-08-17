import { useCharacterContext } from '../../../contexts/CharacterContext';
import { toggleBuffState } from '../../../utils/calculations';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import { SKILLS_CONFIG } from '../../../data/pericias';
import type { Buff, BuffEffect } from '../../../types/character';
import styles from './ConditionChip.module.css';

interface ConditionChipProps {
  buff: Buff;
  index: number;
}

type ChipVariant = 'buff' | 'warn' | 'danger';

function inferVariant(buff: Buff): ChipVariant {
  const effects = buff.effects || [];
  if (effects.length === 0) return 'warn';
  const isNegative = effects.some((eff) => {
    const raw = (eff.value ?? '').toString().trim();
    return raw.startsWith('-') || Number(raw) < 0;
  });
  if (isNegative) return 'danger';
  return 'buff';
}

function formatEffectValue(raw: string): string | null {
  const trimmed = (raw ?? '').toString().trim();
  if (!trimmed || trimmed === '0') return null;
  return /^[+-]/.test(trimmed) ? trimmed : `+${trimmed}`;
}

/** Etiqueta curta do que o efeito afeta — "For", "Vontade", "Atq", "Dano", "PV", "PM", "Def". */
function effectTag(eff: BuffEffect): string {
  switch (eff.type) {
    case 'attribute':
      return eff.attributeId ? ATTRIBUTE_LABELS[eff.attributeId] : 'Atributo';
    case 'skill': {
      const skill = SKILLS_CONFIG.find((sk) => sk.id === eff.skillId);
      return skill ? skill.name : 'Perícia';
    }
    case 'attack_roll':
      return 'Atq';
    case 'fixed_damage':
    case 'extra_damage':
      return 'Dano';
    case 'hp':
      return 'PV';
    case 'mp':
      return 'PM';
    case 'defense':
      return 'Def';
    default:
      return '';
  }
}

/**
 * Resumo compacto dos efeitos de um buff pra caber numa linha:
 * um efeito → "Tag +valor"; vários com o mesmo valor (comum em buffs que somam o
 * mesmo bônus em várias perícias/atributos) → "Nx +valor"; valores diferentes →
 * junta cada valor com "/", igual ao comportamento antigo.
 */
function summarizeEffects(effects: BuffEffect[]): string {
  const withValues = effects
    .map((eff) => ({ eff, val: formatEffectValue(eff.value) }))
    .filter((e): e is { eff: BuffEffect; val: string } => e.val != null);

  if (withValues.length === 0) return '';
  if (withValues.length === 1) {
    const { eff, val } = withValues[0];
    const tag = effectTag(eff);
    return tag ? `${tag} ${val}` : val;
  }

  const allSameValue = withValues.every((e) => e.val === withValues[0].val);
  if (allSameValue) return `${withValues.length}x ${withValues[0].val}`;

  return withValues.map((e) => e.val).join('/');
}

/** Tooltip completo — nome (útil quando a linha corta com "...") + fonte + custo + descrição. */
function buildTooltip(buff: Buff): string {
  const parts = [buff.name || 'Sem nome'];
  if (buff.source) parts.push(buff.source);
  if (buff.mp > 0) parts.push(`${buff.mp} PM`);
  if (buff.description) parts.push(buff.description);
  return parts.join(' · ');
}

function ConditionChip({ buff, index }: ConditionChipProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  const handleToggle = () => updateCharacter((f) => toggleBuffState(f, index));
  const variant = inferVariant(buff);
  const summary = summarizeEffects(buff.effects || []);

  return (
    <button
      type="button"
      className={`${styles.row} ${styles[variant]} ${buff.active ? styles.on : ''}`}
      title={buildTooltip(buff)}
      aria-pressed={buff.active}
      onClick={readOnly ? undefined : handleToggle}
    >
      <span className={styles.name}>{buff.name || 'Sem nome'}</span>
      {summary && <span className={styles.tag}>{summary}</span>}
    </button>
  );
}

ConditionChip.displayName = 'ConditionChip';

export default ConditionChip;
