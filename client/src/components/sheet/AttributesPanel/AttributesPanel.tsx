import { useCharacterContext } from '../../../contexts/CharacterContext';
import type { AttributeId } from '../../../types/character';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import AttributeBadge from '../AttributeBadge/AttributeBadge';
import styles from './AttributesPanel.module.css';

interface AttributesPanelProps {
  editMode?: boolean;
}

const ATTR_ORDER: AttributeId[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function AttributesPanel({ editMode = false }: AttributesPanelProps) {
  const { character } = useCharacterContext();

  if (!character) return null;

  return (
    <section>
      <SectionHeader title="Atributos" action="Valor já é o modificador" />
      <div className={styles.grid}>
        {ATTR_ORDER.map((attr) => (
          <AttributeBadge key={attr} attr={attr} editMode={editMode} />
        ))}
      </div>
    </section>
  );
}

AttributesPanel.displayName = 'AttributesPanel';

export default AttributesPanel;
