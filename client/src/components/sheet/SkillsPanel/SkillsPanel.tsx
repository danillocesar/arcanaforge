import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { SKILLS_CONFIG } from '../../../data/pericias';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import Card from '../../ui/Card/Card';
import TextField from '../../ui/TextField/TextField';
import SkillRow from '../SkillRow/SkillRow';
import styles from './SkillsPanel.module.css';

interface SkillsPanelProps {
  editMode?: boolean;
}

function SkillsPanel({ editMode = false }: SkillsPanelProps) {
  const { character } = useCharacterContext();
  const [search, setSearch] = useState('');

  if (!character) return null;

  const trainedCount = SKILLS_CONFIG.reduce(
    (count, cfg) => count + (character.skills[cfg.id]?.trained ? 1 : 0),
    0,
  );

  const query = search.trim().toLowerCase();
  const visible = query
    ? SKILLS_CONFIG.filter((cfg) => {
        const label = cfg.customLabel ? character.skills[cfg.id]?.label || cfg.name : cfg.name;
        return label.toLowerCase().includes(query);
      })
    : SKILLS_CONFIG;

  return (
    <section>
      <SectionHeader title="Perícias" action={`${trainedCount} treinadas`} />

      <TextField
        className={styles.search}
        value={search}
        onChange={setSearch}
        placeholder="Buscar perícia…"
      />

      <Card padding={false} className={styles.list}>
        {visible.map((cfg) => (
          <SkillRow key={cfg.id} skillId={cfg.id} editMode={editMode} />
        ))}
        {visible.length === 0 && <div className={styles.empty}>Nenhuma perícia encontrada.</div>}
      </Card>
    </section>
  );
}

SkillsPanel.displayName = 'SkillsPanel';

export default SkillsPanel;
