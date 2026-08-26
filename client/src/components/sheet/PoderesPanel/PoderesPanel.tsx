import { lazy, Suspense, useState } from 'react';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import EmptyState from '../../ui/EmptyState/EmptyState';
import CollapsibleGroup from '../../ui/CollapsibleGroup/CollapsibleGroup';
import AbilityCard from '../AbilityCard/AbilityCard';
import AddButton from '../AddButton/AddButton';
import CastActionSheet from '../CastActionSheet/CastActionSheet';
import { groupAbilities, FAVORITES_GROUP_KEY } from '../../../utils/abilityGroups';

// O catálogo oficial de poderes (data/powers.ts, ~55KB) só é usado dentro do
// picker — carrega sob demanda, na primeira vez que o usuário abre "+ Poder".
const PowerPicker = lazy(() => import('../PowerPicker/PowerPicker'));
import type { CastActionSpec } from '../CastActionSheet/CastActionSheet';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import type { FormValues } from '../SheetForm/SheetForm';
import styles from './PoderesPanel.module.css';

function PoderesPanel() {
  const { character, updateCharacter, readOnly } = useCharacterContext();
  const { openEdit, openCreate, openCreateWithValues } = useSheetForm();
  const [castAction, setCastAction] = useState<CastActionSpec | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerLoaded, setPickerLoaded] = useState(false);

  // Padrão "adjust state while rendering" do React: computa o derivado direto
  // no render (sem useEffect) — evita o round-trip extra de um efeito só pra
  // ligar um estado que nunca mais desliga.
  if (showPicker && !pickerLoaded) setPickerLoaded(true);

  if (!character) return null;

  const abilities = character.abilities ?? [];
  const groups = groupAbilities(abilities);

  const handleEdit = (index: number) =>
    openEdit(abilities[index]?.kind === 'Habilidade' ? 'habilidade' : 'poder', index);

  const handlePick = (values: FormValues | null) => {
    setShowPicker(false);
    setTimeout(() => {
      if (values) openCreateWithValues('poder', values);
      else openCreate('poder');
    }, 320);
  };

  const handleToggleFavorite = (index: number) => {
    updateCharacter((prev) => ({
      ...prev,
      abilities: prev.abilities.map((a, i) => (i === index ? { ...a, favorite: !a.favorite } : a)),
    }));
  };

  const handleUse = (index: number) => {
    const ab = abilities[index];
    if (!ab || ab.alwaysActive) return;
    setCastAction({
      name: ab.name,
      mpCost: Number(ab.mpCost) || 0,
      buffs: ab.buffs,
      buffTargetScope: ab.buffTargetScope,
      sourceAbilityIndex: index,
    });
  };

  return (
    <section>
      <SectionHeader
        title="Poderes & Habilidades"
        action={!readOnly && <AddButton label="Poder / Hab." onClick={() => setShowPicker(true)} />}
      />
      {abilities.length === 0 ? (
        <EmptyState
          icon="✦"
          title="Nenhum poder ou habilidade cadastrado."
          hint='Toque em "+ Poder / Hab." para escolher da lista oficial ou criar um personalizado.'
        />
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <CollapsibleGroup
              // A chave de colapso é o grupo, não a posição — renomear/reordenar
              // poderes não faz o acordeão trocar de estado.
              key={group.key}
              id={`poderes-${group.key}`}
              title={group.label}
              count={group.items.length}
              accent={group.key === FAVORITES_GROUP_KEY}
            >
              <div className={styles.list}>
                {group.items.map(({ ability, index }) => (
                  <AbilityCard
                    key={`${group.key}-${index}`}
                    ability={ability}
                    index={index}
                    onEdit={handleEdit}
                    onUse={handleUse}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </CollapsibleGroup>
          ))}
        </div>
      )}

      <CastActionSheet action={castAction} onClose={() => setCastAction(null)} />
      {pickerLoaded && (
        <Suspense fallback={null}>
          <PowerPicker open={showPicker} onClose={() => setShowPicker(false)} onPick={handlePick} />
        </Suspense>
      )}
    </section>
  );
}

PoderesPanel.displayName = 'PoderesPanel';

export default PoderesPanel;
