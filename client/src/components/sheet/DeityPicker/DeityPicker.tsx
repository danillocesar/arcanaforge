import { useState } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import TextField from '../../ui/TextField/TextField';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { OFFICIAL_DEITIES } from '../../../data/deities';
import type { OfficialDeity } from '../../../data/deities';
import { OFFICIAL_POWERS } from '../../../data/powers';
import type { OfficialPower } from '../../../data/powers';
import type { Ability } from '../../../types/character';
import styles from './DeityPicker.module.css';

interface DeityPickerProps {
  open: boolean;
  onClose: () => void;
}

function matchesDomain(power: OfficialPower, deityDomains: string[]): boolean {
  if (power.category !== 'Concedido' || !power.domain) return false;
  const powerDomains = power.domain.split(',').map((d) => d.trim().toLowerCase());
  return deityDomains.some((dd) => powerDomains.includes(dd.trim().toLowerCase()));
}

/**
 * Escolher uma divindade oficial: (1) define `character.deity`; (2) mostra restrições
 * do devoto e o pool de Poderes Concedidos (do catálogo de poderes) cujo domínio bate
 * com os domínios da divindade, cada um com botão de adicionar — o jogador escolhe
 * quais quer, não é aplicado automaticamente.
 */
function DeityPicker({ open, onClose }: DeityPickerProps) {
  const { character, updateCharacter } = useCharacterContext();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OfficialDeity | null>(null);

  const query = search.trim().toLowerCase();
  const visible = OFFICIAL_DEITIES.filter((deity) => deity.name.toLowerCase().includes(query));

  const selectDeity = (deity: OfficialDeity) => {
    updateCharacter((c) => ({ ...c, deity: deity.name }));
    setSelected(deity);
  };

  const hasAbility = (name: string): boolean =>
    Boolean(character?.abilities.some((a) => a.name.toLowerCase() === name.toLowerCase()));

  const addPower = (power: OfficialPower, deityName: string) => {
    const newAbility: Ability = {
      name: power.name,
      source: `Concedido: ${deityName}`,
      type: '',
      kind: 'Poder',
      mpCost: 0,
      description: power.description,
      castable: false,
    };
    updateCharacter((c) => ({ ...c, abilities: [...c.abilities, newAbility] }));
  };

  const close = () => {
    setSearch('');
    setSelected(null);
    onClose();
  };

  if (selected) {
    const concedidos = OFFICIAL_POWERS.filter((p) => matchesDomain(p, selected.domains));
    return (
      <Sheet open={open} onClose={close} title={selected.name}>
        <button type="button" className={styles.backBtn} onClick={() => setSelected(null)}>
          ← Trocar divindade
        </button>

        {selected.title && <p className={styles.subtitle}>{selected.title}</p>}
        <p className={styles.domains}>Domínios: {selected.domains.join(', ')}</p>

        <div className={styles.restrictions}>
          <span className={styles.sectionLabel}>Restrições do devoto</span>
          <p>{selected.restrictions}</p>
        </div>

        <span className={styles.sectionLabel}>Poderes Concedidos disponíveis</span>
        <div className={styles.list}>
          {concedidos.map((power) => {
            const added = hasAbility(power.name);
            return (
              <div key={power.name} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{power.name}</span>
                  <span className={styles.itemMeta}>{power.description}</span>
                </div>
                <button
                  type="button"
                  className={styles.addBtn}
                  disabled={added}
                  onClick={() => addPower(power, selected.name)}
                >
                  {added ? 'Adicionado' : '+ Adicionar'}
                </button>
              </div>
            );
          })}
          {concedidos.length === 0 && (
            <p className={styles.empty}>Nenhum poder concedido catalogado para esses domínios.</p>
          )}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={close} title="Escolher Divindade">
      <TextField
        className={styles.search}
        value={search}
        onChange={setSearch}
        placeholder="Buscar divindade oficial…"
      />
      <div className={styles.list}>
        {visible.map((deity) => (
          <button key={deity.name} type="button" className={styles.deityItem} onClick={() => selectDeity(deity)}>
            <span className={styles.itemName}>{deity.name}</span>
            <span className={styles.itemMeta}>{deity.domains.join(', ')}</span>
          </button>
        ))}
        {visible.length === 0 && <p className={styles.empty}>Nenhuma divindade encontrada.</p>}
      </div>
    </Sheet>
  );
}

DeityPicker.displayName = 'DeityPicker';

export default DeityPicker;
