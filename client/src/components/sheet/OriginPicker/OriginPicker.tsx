import { useState } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import TextField from '../../ui/TextField/TextField';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { OFFICIAL_ORIGINS } from '../../../data/origins';
import type { OfficialOrigin, OriginBenefit } from '../../../data/origins';
import { OFFICIAL_POWERS } from '../../../data/powers';
import { SKILLS_CONFIG } from '../../../data/pericias';
import type { Ability } from '../../../types/character';
import { normalizeSearch } from '../../../utils/formatters';
import PowerPicker from '../PowerPicker/PowerPicker';
import type { FormValues } from '../SheetForm/SheetForm';
import styles from './OriginPicker.module.css';

interface OriginPickerProps {
  open: boolean;
  onClose: () => void;
}

function findSkillId(name: string): string | undefined {
  const target = normalizeSearch(name);
  return SKILLS_CONFIG.find((sk) => normalizeSearch(sk.name) === target)?.id;
}

/** Um benefício "poder" é genérico (ex.: "Um poder de combate") quando não é nem um poder
 * exclusivo da origem (com descrição própria) nem o nome exato de um poder do catálogo —
 * nesse caso o jogador precisa escolher um poder de verdade, em vez de ganhar um placeholder. */
function isGenericPowerBenefit(benefit: OriginBenefit): boolean {
  if (benefit.kind !== 'poder' || benefit.description) return false;
  const catalogMatch = OFFICIAL_POWERS.some((p) => p.name.toLowerCase() === benefit.name.toLowerCase());
  return !catalogMatch;
}

/**
 * Escolher uma origem oficial: (1) define `character.origin`; (2) mostra o pool de
 * benefícios candidatos (perícias + poderes) com um botão de adicionar em cada um —
 * o jogador escolhe quantos/quais quiser, não é decidido automaticamente (a regra
 * oficial é "escolha 2", mas isso fica a critério do jogador aplicar).
 */
function OriginPicker({ open, onClose }: OriginPickerProps) {
  const { character, updateCharacter } = useCharacterContext();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OfficialOrigin | null>(null);
  const [powerBenefit, setPowerBenefit] = useState<OriginBenefit | null>(null);

  const query = normalizeSearch(search);
  const visible = OFFICIAL_ORIGINS.filter((origin) => normalizeSearch(origin.name).includes(query));

  const selectOrigin = (origin: OfficialOrigin) => {
    updateCharacter((c) => ({ ...c, origin: origin.name }));
    setSelected(origin);
  };

  const isSkillTrained = (name: string): boolean => {
    const skillId = findSkillId(name);
    return skillId ? Boolean(character?.skills[skillId]?.trained) : false;
  };

  const addSkill = (name: string) => {
    const skillId = findSkillId(name);
    if (!skillId) return;
    updateCharacter((c) => ({
      ...c,
      skills: { ...c.skills, [skillId]: { ...c.skills[skillId], trained: true } },
    }));
  };

  const hasAbility = (name: string): boolean =>
    Boolean(character?.abilities.some((a) => a.name.toLowerCase() === name.toLowerCase()));

  /** Pra um benefício genérico ("Um poder de combate"), o nome nunca aparece como habilidade —
   * em vez disso, checamos se já existe um poder do catálogo (da categoria certa) vindo desta origem. */
  const hasGenericPowerFilled = (benefit: OriginBenefit, originName: string): boolean =>
    Boolean(character?.abilities.some((a) => {
      if (a.source !== `Origem: ${originName}`) return false;
      const power = OFFICIAL_POWERS.find((p) => p.name.toLowerCase() === a.name.toLowerCase());
      if (!power) return false;
      return !benefit.powerCategory || power.category === benefit.powerCategory;
    }));

  const addPower = (benefit: OriginBenefit, originName: string) => {
    if (!selected) return;
    const catalogPower = OFFICIAL_POWERS.find((p) => p.name.toLowerCase() === benefit.name.toLowerCase());
    const newAbility: Ability = {
      name: benefit.name,
      source: `Origem: ${originName}`,
      type: '',
      kind: 'Poder',
      mpCost: 0,
      description: benefit.description ?? catalogPower?.description ?? '',
      castable: false,
    };
    updateCharacter((c) => ({ ...c, abilities: [...c.abilities, newAbility] }));
  };

  const pickGenericPower = (values: FormValues | null) => {
    const originName = selected?.name;
    setPowerBenefit(null);
    if (!values || !originName) return;
    const newAbility: Ability = {
      name: String(values.name ?? ''),
      source: `Origem: ${originName}`,
      type: '',
      kind: 'Poder',
      mpCost: 0,
      description: String(values.description ?? ''),
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
    return (
      <Sheet open={open} onClose={close} title={selected.name}>
        <button type="button" className={styles.backBtn} onClick={() => setSelected(null)}>
          ← Trocar origem
        </button>

        <p className={styles.hint}>Escolha 2 benefícios da lista (regra oficial) — adicione quantos quiser.</p>

        <div className={styles.list}>
          {selected.benefits.map((benefit) => {
            if (benefit.kind === 'pericia') {
              const trained = isSkillTrained(benefit.name);
              return (
                <div key={benefit.name} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{benefit.name}</span>
                    <span className={styles.itemMeta}>Perícia</span>
                  </div>
                  <button
                    type="button"
                    className={styles.addBtn}
                    disabled={trained}
                    onClick={() => addSkill(benefit.name)}
                  >
                    {trained ? 'Já treinada' : '+ Treinar'}
                  </button>
                </div>
              );
            }
            const generic = isGenericPowerBenefit(benefit);
            const added = generic ? hasGenericPowerFilled(benefit, selected.name) : hasAbility(benefit.name);
            return (
              <div key={benefit.name} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{benefit.name}</span>
                  <span className={styles.itemMeta}>
                    {benefit.description ? `Poder exclusivo — ${benefit.description}` : 'Poder geral — escolha da lista oficial'}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.addBtn}
                  disabled={added}
                  onClick={() => (generic ? setPowerBenefit(benefit) : addPower(benefit, selected.name))}
                >
                  {added ? 'Adicionado' : generic ? '+ Escolher' : '+ Adicionar'}
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.startingItems}>
          <span className={styles.itemMeta}>Itens iniciais</span>
          <p>{selected.startingItems}</p>
        </div>

        <PowerPicker
          open={powerBenefit != null}
          onClose={() => setPowerBenefit(null)}
          onPick={pickGenericPower}
          initialCategory={powerBenefit?.powerCategory}
        />
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={close} title="Escolher Origem">
      <TextField
        className={styles.search}
        value={search}
        onChange={setSearch}
        placeholder="Buscar origem oficial…"
      />
      <div className={styles.list}>
        {visible.map((origin) => (
          <button key={origin.name} type="button" className={styles.originItem} onClick={() => selectOrigin(origin)}>
            <span className={styles.itemName}>{origin.name}</span>
          </button>
        ))}
        {visible.length === 0 && <p className={styles.empty}>Nenhuma origem encontrada.</p>}
      </div>
    </Sheet>
  );
}

OriginPicker.displayName = 'OriginPicker';

export default OriginPicker;
