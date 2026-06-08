import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import ActionCard from '../ActionCard/ActionCard';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import styles from './AcoesPanel.module.css';

interface AcoesPanelProps {
  editMode?: boolean;
}

/**
 * Combat actions (rollable attacks) — lives in the main "Atributos" tab.
 * Reuses ActionCard (attack roll / damage); the Equipamentos tab lists the
 * same weapons as plain gear rows instead.
 */
function AcoesPanel({ editMode = false }: AcoesPanelProps) {
  const { character } = useCharacterContext();
  const { openEdit } = useSheetForm();

  if (!character) return null;

  const attacks = character.attacks ?? [];

  return (
    <div className={styles.panel}>
      <SectionHeader title="Ataques" />
      {attacks.length > 0 ? (
        <div className={styles.grid}>
          {attacks.map((attack, idx) => (
            <ActionCard
              key={idx}
              attack={attack}
              index={idx}
              editMode={editMode}
              onEdit={(i) => openEdit('arma', i)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Nenhum ataque cadastrado.</p>
      )}
    </div>
  );
}

AcoesPanel.displayName = 'AcoesPanel';

export default AcoesPanel;
