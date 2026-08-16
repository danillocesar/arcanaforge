import { useState } from 'react';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import SpellCard from '../SpellCard/SpellCard';
import AddButton from '../AddButton/AddButton';
import CastActionSheet from '../CastActionSheet/CastActionSheet';
import type { CastActionSpec } from '../CastActionSheet/CastActionSheet';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import styles from './MagiasPanel.module.css';

function MagiasPanel() {
  const { character, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();
  const [castAction, setCastAction] = useState<CastActionSpec | null>(null);

  if (!character) return null;

  const spells = character.spells ?? [];

  return (
    <section>
      <SectionHeader
        title="Magias"
        action={!readOnly && <AddButton label="Magia" onClick={() => openCreate('magia')} />}
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
    </section>
  );
}

MagiasPanel.displayName = 'MagiasPanel';

export default MagiasPanel;
