import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { isWeaponAttack, weaponToAttack, isItemEquipped } from '../../../utils/calculations';
import type { EntityKind } from '../SheetForm/entityForms';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import EmptyState from '../../ui/EmptyState/EmptyState';
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
  const [magiasOpen, setMagiasOpen] = useState(false);
  const [poderesOpen, setPoderesOpen] = useState(false);

  if (!character) return null;

  // Arma desequipada não vira card de ataque — equipa pelo checkbox em Equipamentos.
  const weaponAttacks = (character.inventory ?? [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isWeaponAttack(item) && isItemEquipped(item));

  const combinedAttacks: Array<{ attack: ReturnType<typeof weaponToAttack>; kind: EntityKind; index: number }> = [
    ...(character.attacks ?? []).map((attack, index) => ({ attack, kind: 'ataque' as const, index })),
    ...weaponAttacks.map(({ item, index }) => ({ attack: weaponToAttack(item), kind: 'arma' as const, index })),
  ];
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
      resistance: sp.resistance,
    });
  };

  const castAbility = (index: number) => {
    const ab = character.abilities[index];
    if (!ab) return;
    setCastAction({ name: ab.name, mpCost: Number(ab.mpCost) || 0, buffs: ab.buffs, buffTargetScope: ab.buffTargetScope });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.banner}>⚔ Ações de Combate</div>

      <SectionHeader
        title="Ataques"
        action={!readOnly && <AddButton label="Ataque" onClick={() => openCreate('ataque')} />}
      />
      {combinedAttacks.length > 0 ? (
        <div className={styles.grid}>
          {combinedAttacks.map(({ attack, kind, index }) => (
            <ActionCard
              key={`${kind}-${index}`}
              attack={attack}
              index={index}
              onEdit={() => openEdit(kind, index)}
            />
          ))}
        </div>
      ) : (
        <EmptyState compact icon="⚔" title="Nenhum ataque cadastrado." />
      )}

      <SectionHeader
        title="Magias"
        className={styles.gap}
        action={
          <button
            type="button"
            className={styles.collapseToggle}
            onClick={() => setMagiasOpen((o) => !o)}
            aria-expanded={magiasOpen}
          >
            {spells.length}
            <ChevronDown size={14} className={magiasOpen ? styles.chevOpen : undefined} />
          </button>
        }
      />
      {magiasOpen && (
        spells.length > 0 ? (
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
          <EmptyState compact icon="🜂" title="Nenhuma magia conhecida." />
        )
      )}

      <SectionHeader
        title="Poderes"
        className={styles.gap}
        action={
          <button
            type="button"
            className={styles.collapseToggle}
            onClick={() => setPoderesOpen((o) => !o)}
            aria-expanded={poderesOpen}
          >
            {castableAbilities.length}
            <ChevronDown size={14} className={poderesOpen ? styles.chevOpen : undefined} />
          </button>
        }
      />
      {poderesOpen && (
        castableAbilities.length > 0 ? (
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
          <EmptyState compact icon="✦" title="Nenhum poder conjurável." />
        )
      )}

      <CastActionSheet action={castAction} onClose={() => setCastAction(null)} />
    </div>
  );
}

AcoesPanel.displayName = 'AcoesPanel';

export default AcoesPanel;
