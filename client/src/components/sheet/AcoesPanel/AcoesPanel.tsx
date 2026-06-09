import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import ActionCard from '../ActionCard/ActionCard';
import AddButton from '../AddButton/AddButton';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import styles from './AcoesPanel.module.css';

/**
 * Combat actions (rollable attacks) — lives in the main "Atributos" tab.
 * Reuses ActionCard (attack roll / damage); the Equipamentos tab lists the
 * same weapons as plain gear rows instead.
 */
function AcoesPanel() {
  const { character, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();

  if (!character) return null;

  const attacks = character.attacks ?? [];

  return (
    <div className={styles.panel}>
      <SectionHeader
        title="Ataques"
        action={!readOnly && <AddButton label="Ataque" onClick={() => openCreate('ataque')} />}
      />
      {attacks.length > 0 ? (
        <div className={styles.grid}>
          {attacks.map((attack, idx) => (
            <ActionCard
              key={idx}
              attack={attack}
              index={idx}
              onEdit={(i) => openEdit('ataque', i)}
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
