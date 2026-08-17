import { useCharacterContext } from '../../../contexts/CharacterContext';
import { toggleBuffState } from '../../../utils/calculations';
import type { Buff } from '../../../types/character';
import Chip from '../../ui/Chip/Chip';

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

function buildLabel(buff: Buff): string {
  const values = (buff.effects || [])
    .map((eff) => formatEffectValue(eff.value))
    .filter((v): v is string => v != null);
  const summary = values.length > 0 ? ` ${values.join('/')}` : '';
  const sourceSuffix = buff.source ? ` (${buff.source})` : '';
  return `${buff.name}${summary}${sourceSuffix}`;
}

function ConditionChip({ buff, index }: ConditionChipProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  const handleToggle = () => updateCharacter((f) => toggleBuffState(f, index));

  return (
    <Chip
      label={buildLabel(buff)}
      title={buff.description}
      active={buff.active}
      variant={inferVariant(buff)}
      onToggle={readOnly ? undefined : handleToggle}
    />
  );
}

ConditionChip.displayName = 'ConditionChip';

export default ConditionChip;
