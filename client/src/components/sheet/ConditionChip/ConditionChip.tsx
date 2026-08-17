import { useCharacterContext } from '../../../contexts/CharacterContext';
import { toggleBuffState } from '../../../utils/calculations';
import { summarizeEffects } from '../../../utils/buffEffects';
import type { Buff } from '../../../types/character';
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
