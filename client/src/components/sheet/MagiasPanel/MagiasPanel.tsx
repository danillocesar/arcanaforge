import { useState } from 'react';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import SpellCard from '../SpellCard/SpellCard';
import AddButton from '../AddButton/AddButton';
import SpellPicker from '../SpellPicker/SpellPicker';
import CastActionSheet from '../CastActionSheet/CastActionSheet';
import type { CastActionSpec } from '../CastActionSheet/CastActionSheet';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import type { FormValues } from '../SheetForm/SheetForm';
import styles from './MagiasPanel.module.css';

function MagiasPanel() {
  const { character, readOnly } = useCharacterContext();
  const { openEdit, openCreate, openCreateWithValues } = useSheetForm();
  const [castAction, setCastAction] = useState<CastActionSpec | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  if (!character) return null;

  const spells = character.spells ?? [];

  const handlePick = (values: FormValues | null) => {
    setShowPicker(false);
    setTimeout(() => {
      if (values) openCreateWithValues('magia', values);
      else openCreate('magia');
    }, 320);
  };

  return (
    <section>
      <SectionHeader
        title="Magias"
        action={!readOnly && <AddButton label="Magia" onClick={() => setShowPicker(true)} />}
      />

      {spells.length === 0 ? (
        <p className={styles.empty}>Nenhuma magia conhecida.</p>
      ) : (
        <div className={styles.list}>
          {spells.map((spell, index) => (
            <SpellCard
              key={index}
              spell={spell}
              index={index}
              onCast={(index) => {
                const sp = spells[index];
                setCastAction({
                  name: sp.name,
                  mpCost: sp.mpCost,
                  buffs: sp.buffs,
                  buffTargetScope: sp.buffTargetScope,
                  enhancements: sp.enhancements,
                });
              }}
              onEdit={(i) => openEdit('magia', i)}
            />
          ))}
        </div>
      )}

      <CastActionSheet action={castAction} onClose={() => setCastAction(null)} />
      <SpellPicker open={showPicker} onClose={() => setShowPicker(false)} onPick={handlePick} />
    </section>
  );
}

MagiasPanel.displayName = 'MagiasPanel';

export default MagiasPanel;
