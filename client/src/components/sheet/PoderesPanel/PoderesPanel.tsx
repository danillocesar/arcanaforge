import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import AbilityCard from '../AbilityCard/AbilityCard';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import styles from './PoderesPanel.module.css';

interface PoderesPanelProps {
  editMode?: boolean;
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
}

function PoderesPanel({ editMode = false, onEdit, onRemove }: PoderesPanelProps) {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const abilities = character.abilities ?? [];

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
        action={`${abilities.length} ${abilities.length === 1 ? 'item' : 'itens'}`}
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
              onEdit={onEdit}
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
