import { useState } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import TextField from '../../ui/TextField/TextField';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { OFFICIAL_RACES } from '../../../data/races';
import type { OfficialRace } from '../../../data/races';
import type { Ability } from '../../../types/character';
import styles from './RacePicker.module.css';

interface RacePickerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Escolher uma raça oficial define `character.race` e adiciona todos os poderes
 * raciais dela como Poderes (tag "Racial: <Raça>"), de uma vez, sem formulário
 * intermediário — os poderes continuam editáveis/removíveis normalmente depois.
 * Bônus de atributo fica só como texto de referência (não é auto-aplicado).
 */
function RacePicker({ open, onClose }: RacePickerProps) {
  const { updateCharacter } = useCharacterContext();
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();
  const visible = OFFICIAL_RACES.filter((race) => race.name.toLowerCase().includes(query));

  const pick = (race: OfficialRace) => {
    setSearch('');
    updateCharacter((c) => {
      const newAbilities: Ability[] = race.powers.map((power) => ({
        name: power.name,
        source: `Racial: ${race.name}`,
        type: '',
        kind: 'Poder',
        mpCost: 0,
        description: power.description,
        castable: false,
      }));
      return { ...c, race: race.name, abilities: [...c.abilities, ...newAbilities] };
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Escolher Raça">
      <TextField
        className={styles.search}
        value={search}
        onChange={setSearch}
        placeholder="Buscar raça oficial…"
      />

      <div className={styles.list}>
        {visible.map((race) => (
          <button key={race.name} type="button" className={styles.item} onClick={() => pick(race)}>
            <span className={styles.itemName}>{race.name}</span>
            <span className={styles.itemMods}>{race.attributeModifiers}</span>
            <span className={styles.itemPowers}>
              {race.powers.length} poder{race.powers.length !== 1 ? 'es' : ''} racial{race.powers.length !== 1 ? 'is' : ''}: {race.powers.map((p) => p.name).join(', ')}
            </span>
          </button>
        ))}
        {visible.length === 0 && <p className={styles.empty}>Nenhuma raça encontrada.</p>}
      </div>
    </Sheet>
  );
}

RacePicker.displayName = 'RacePicker';

export default RacePicker;
