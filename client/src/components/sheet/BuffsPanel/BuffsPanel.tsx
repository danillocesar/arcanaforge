import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import ConditionChip from '../ConditionChip/ConditionChip';
import styles from './BuffsPanel.module.css';

interface BuffsPanelProps {
  editMode?: boolean;
  onEdit?: (i: number) => void;
}

function BuffsPanel({ editMode = false, onEdit }: BuffsPanelProps) {
  const { character } = useCharacterContext();

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
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

BuffsPanel.displayName = 'BuffsPanel';

export default BuffsPanel;
