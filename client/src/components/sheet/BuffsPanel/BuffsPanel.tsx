import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import ConditionChip from '../ConditionChip/ConditionChip';
import AddButton from '../AddButton/AddButton';
import BuffsDrawer from '../BuffsDrawer/BuffsDrawer';
import ConditionPicker from '../ConditionPicker/ConditionPicker';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import type { FormValues } from '../SheetForm/SheetForm';
import styles from './BuffsPanel.module.css';

function BuffsPanel() {
  const { character, readOnly } = useCharacterContext();
  const { openCreate, openCreateWithValues } = useSheetForm();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  if (!character) return null;

  const hasBuffs = character.buffs.length > 0;

  const handlePick = (values: FormValues | null) => {
    setShowPicker(false);
    setTimeout(() => {
      if (values) openCreateWithValues('buff', values);
      else openCreate('buff');
    }, 320);
  };

  const headerAction = (
    <div className={styles.headerActions}>
      {hasBuffs && (
        <button
          type="button"
          className={styles.btnViewAll}
          onClick={() => setShowDrawer(true)}
        >
          Visualizar todos
        </button>
      )}
      {!readOnly && <AddButton label="Buff" onClick={() => setShowPicker(true)} />}
    </div>
  );

  return (
    <div className={styles.panel}>
      <SectionHeader title="Buffs & Condições" action={headerAction} />
      <div className={styles.chips}>
        {character.buffs.map((buff, idx) => (
          <ConditionChip key={idx} buff={buff} index={idx} />
        ))}
      </div>
      <BuffsDrawer open={showDrawer} onClose={() => setShowDrawer(false)} />
      <ConditionPicker open={showPicker} onClose={() => setShowPicker(false)} onPick={handlePick} />
    </div>
  );
}

BuffsPanel.displayName = 'BuffsPanel';

export default BuffsPanel;
