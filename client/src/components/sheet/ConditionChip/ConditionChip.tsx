import { useCharacterContext } from '../../../contexts/CharacterContext';
import { toggleBuffState } from '../../../utils/calculations';
import type { Buff } from '../../../types/character';
import Chip from '../../ui/Chip/Chip';

interface ConditionChipProps {
  buff: Buff;
  index: number;
  editMode?: boolean;
  onEdit?: (i: number) => void;
}

type ChipVariant = 'buff' | 'warn' | 'danger';

/** Best-effort mapping of a buff to a chip visual variant. */
function inferVariant(buff: Buff): ChipVariant {
  const raw = (buff.value ?? '').toString().trim();
  const numeric = Number(raw);
  const hasTarget = Boolean(buff.attributeId || buff.skillId);
  const isNegative = raw.startsWith('-') || numeric < 0;

  // A damaging / debuff-style effect → danger.
  if (isNegative) return 'danger';
  // No numeric target value and no attribute/skill target → treat as a condition.
  if (!hasTarget && (raw === '' || numeric === 0)) return 'warn';
  return 'buff';
}

/** Builds the chip label, appending the buff value when it reads like a modifier. */
function buildLabel(buff: Buff): string {
  const raw = (buff.value ?? '').toString().trim();
  if (!raw || raw === '0') return buff.name;
  const signed = /^[+-]/.test(raw) ? raw : `+${raw}`;
  return `${buff.name} ${signed}`;
}

function ConditionChip({ buff, index, editMode = false, onEdit }: ConditionChipProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  const handleToggle = () => updateCharacter((f) => toggleBuffState(f, index));

  const handleRemove =
    editMode && !readOnly
      ? () =>
          updateCharacter((f) => ({
            ...f,
            buffs: f.buffs.filter((_, i) => i !== index),
          }))
      : undefined;

  const handleEdit = editMode && !readOnly ? () => onEdit?.(index) : undefined;

  return (
    <Chip
      label={buildLabel(buff)}
      active={buff.active}
      variant={inferVariant(buff)}
      onToggle={readOnly ? undefined : handleToggle}
      onEdit={handleEdit}
      onRemove={handleRemove}
    />
  );
}

ConditionChip.displayName = 'ConditionChip';

export default ConditionChip;
