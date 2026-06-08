import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import AbilityCard from '../AbilityCard/AbilityCard';
import AddButton from '../AddButton/AddButton';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import styles from './PoderesPanel.module.css';

interface PoderesPanelProps {
  editMode?: boolean;
  onRemove?: (index: number) => void;
}

function PoderesPanel({ editMode = false, onRemove }: PoderesPanelProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();

  if (!character) return null;

  const abilities = character.abilities ?? [];

  const handleEdit = (index: number) =>
    openEdit(abilities[index]?.kind === 'Habilidade' ? 'habilidade' : 'poder', index);

  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index);
      return;
    }
    updateCharacter((f) => ({
      ...f,
      abilities: f.abilities.filter((_, i) => i !== index),
    }));
  };

  return (
    <section>
      <SectionHeader
        title="Poderes & Habilidades"
        action={
          !readOnly && (
            <div className={styles.addRow}>
              <AddButton label="Poder" onClick={() => openCreate('poder')} />
              <AddButton label="Habilidade" onClick={() => openCreate('habilidade')} />
            </div>
          )
        }
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
              editMode={editMode}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </section>
  );
}

PoderesPanel.displayName = 'PoderesPanel';

export default PoderesPanel;
