import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import ActionCard from '../ActionCard/ActionCard';
import SpellCard from '../SpellCard/SpellCard';
import AbilityCard from '../AbilityCard/AbilityCard';
import AddButton from '../AddButton/AddButton';
import CastActionSheet from '../CastActionSheet/CastActionSheet';
import type { CastActionSpec } from '../CastActionSheet/CastActionSheet';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import styles from './AcoesPanel.module.css';

/**
 * Combat actions (rollable attacks, spells, castable powers) — lives in the main
 * "Atributos" tab, so a player doesn't need to switch tabs mid-combat.
 */
function AcoesPanel() {
  const { character, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();
  const [castAction, setCastAction] = useState<CastActionSpec | null>(null);

  if (!character) return null;

  const attacks = character.attacks ?? [];
  const spells = character.spells ?? [];
  const castableAbilities = (character.abilities ?? [])
    .map((ability, index) => ({ ability, index }))
    .filter(({ ability }) => ability.castable);

  const castSpell = (index: number) => {
    const sp = spells[index];
    if (!sp) return;
    setCastAction({
      name: sp.name, mpCost: Number(sp.mpCost) || 0, buffs: sp.buffs,
      buffTargetScope: sp.buffTargetScope, enhancements: sp.enhancements,
    });
  };

  const castAbility = (index: number) => {
    const ab = character.abilities[index];
    if (!ab) return;
    setCastAction({ name: ab.name, mpCost: Number(ab.mpCost) || 0, buffs: ab.buffs, buffTargetScope: ab.buffTargetScope });
  };

  return (
    <div className={styles.panel}>
      <SectionHeader
        title="Ataques"
        action={!readOnly && <AddButton label="Ataque" onClick={() => openCreate('ataque')} />}
      />
      {attacks.length > 0 ? (
        <div className={styles.grid}>
          {attacks.map((attack, idx) => (
            <ActionCard key={idx} attack={attack} index={idx} onEdit={(i) => openEdit('ataque', i)} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Nenhum ataque cadastrado.</p>
      )}

      <SectionHeader title="Magias" className={styles.gap} />
      {spells.length > 0 ? (
        <div className={styles.grid}>
          {spells.map((spell, index) => (
            <SpellCard
              key={index}
              spell={spell}
              index={index}
              onCast={castSpell}
              onEdit={(i) => openEdit('magia', i)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Nenhuma magia conhecida.</p>
      )}

      <SectionHeader title="Poderes" className={styles.gap} />
      {castableAbilities.length > 0 ? (
        <div className={styles.grid}>
          {castableAbilities.map(({ ability, index }) => (
            <AbilityCard
              key={index}
              ability={ability}
              index={index}
              onEdit={() => openEdit(ability.kind === 'Habilidade' ? 'habilidade' : 'poder', index)}
              onUse={castAbility}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Nenhum poder conjurável.</p>
      )}

      <CastActionSheet action={castAction} onClose={() => setCastAction(null)} />
    </div>
  );
}

AcoesPanel.displayName = 'AcoesPanel';

export default AcoesPanel;
