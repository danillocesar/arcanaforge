import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import ConditionChip from '../ConditionChip/ConditionChip';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import styles from './BuffsPanel.module.css';

interface BuffsPanelProps {
  editMode?: boolean;
}

function BuffsPanel({ editMode = false }: BuffsPanelProps) {
  const { character } = useCharacterContext();
  const { openEdit } = useSheetForm();

  if (!character) return null;

  return (
    <div className={styles.panel}>
      <SectionHeader title="Buffs & Condições" />
      <div className={styles.chips}>
        {character.buffs.map((buff, idx) => (
          <ConditionChip
            key={idx}
            buff={buff}
            index={idx}
            editMode={editMode}
            onEdit={(i) => openEdit('buff', i)}
          />
        ))}
      </div>
    </div>
  );
}

BuffsPanel.displayName = 'BuffsPanel';

export default BuffsPanel;
