import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { SKILLS_CONFIG } from '../../../data/pericias';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import Card from '../../ui/Card/Card';
import TextField from '../../ui/TextField/TextField';
import EmptyState from '../../ui/EmptyState/EmptyState';
import Chip from '../../ui/Chip/Chip';
import SkillRow from '../SkillRow/SkillRow';
import { normalizeSearch } from '../../../utils/formatters';
import styles from './SkillsPanel.module.css';

function SkillsPanel() {
  const { character } = useCharacterContext();
  const [search, setSearch] = useState('');
  const [onlyTrained, setOnlyTrained] = useState(false);

  if (!character) return null;

  const trainedCount = SKILLS_CONFIG.reduce(
    (count, cfg) => count + (character.skills[cfg.id]?.trained ? 1 : 0),
    0,
  );

  const query = normalizeSearch(search);
  const visible = SKILLS_CONFIG.filter((cfg) => {
    if (onlyTrained && !character.skills[cfg.id]?.trained) return false;
    if (!query) return true;
    const label = cfg.customLabel ? character.skills[cfg.id]?.label || cfg.name : cfg.name;
    return normalizeSearch(label).includes(query);
  });

  return (
    <section>
      <SectionHeader title="Perícias" action={`${trainedCount} treinadas`} />

      <div className={styles.filters}>
        <TextField
          className={styles.search}
          value={search}
          onChange={setSearch}
          placeholder="Buscar perícia…"
        />
        <Chip label="Só treinadas" active={onlyTrained} onToggle={() => setOnlyTrained((v) => !v)} />
      </div>

      <Card padding={false} className={styles.list}>
        {visible.map((cfg) => (
          <SkillRow key={cfg.id} skillId={cfg.id} />
        ))}
        {visible.length === 0 && <EmptyState compact icon="🔍" title="Nenhuma perícia encontrada." />}
      </Card>
    </section>
  );
}

SkillsPanel.displayName = 'SkillsPanel';

export default SkillsPanel;
