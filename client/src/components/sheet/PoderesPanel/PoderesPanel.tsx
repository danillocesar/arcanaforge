import { useState } from 'react';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import AbilityCard from '../AbilityCard/AbilityCard';
import AddButton from '../AddButton/AddButton';
import CastActionSheet from '../CastActionSheet/CastActionSheet';
import type { CastActionSpec } from '../CastActionSheet/CastActionSheet';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import styles from './PoderesPanel.module.css';

function PoderesPanel() {
  const { character, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();
  const [castAction, setCastAction] = useState<CastActionSpec | null>(null);

  if (!character) return null;

  const abilities = character.abilities ?? [];

  const handleEdit = (index: number) =>
    openEdit(abilities[index]?.kind === 'Habilidade' ? 'habilidade' : 'poder', index);

  const handleUse = (index: number) => {
    const ab = abilities[index];
    if (!ab) return;
    setCastAction({
      name: ab.name,
      mpCost: Number(ab.mpCost) || 0,
      buffs: ab.buffs,
      buffTargetScope: ab.buffTargetScope,
    });
  };

  return (
    <section>
      <SectionHeader
        title="Poderes & Habilidades"
        action={!readOnly && <AddButton label="Poder / Hab." onClick={() => openCreate('poder')} />}
      />
      {abilities.length === 0 ? (
        <p className={styles.empty}>Nenhum poder ou habilidade cadastrado.</p>
      ) : (
        <div className={styles.list}>
          {abilities.map((ability, index) => (
            <AbilityCard
              key={index}
              ability={ability}
              index={index}
              onEdit={handleEdit}
              onUse={handleUse}
            />
          ))}
        </div>
      )}

      <CastActionSheet action={castAction} onClose={() => setCastAction(null)} />
    </section>
  );
}

PoderesPanel.displayName = 'PoderesPanel';

export default PoderesPanel;
