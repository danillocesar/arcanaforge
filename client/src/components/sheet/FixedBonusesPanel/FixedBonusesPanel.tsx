import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import { summarizeEffects, filterFixedBonusEffects } from '../../../utils/buffEffects';
import styles from './FixedBonusesPanel.module.css';

type FixedOwner = 'ability' | 'item';

interface FixedRow {
  key: string;
  owner: FixedOwner;
  index: number;
  name: string;
  summary: string;
  suppressed: boolean;
}

/**
 * Lista os Poderes/Habilidades e Itens marcados como `alwaysActive`. Cada linha
 * liga/desliga o bônus via `suppressed` no próprio poder/item — para o caso de
 * perder um bônus fixo em jogo (agarrado perde defesa) sem precisar editar a
 * entidade. Como o efeito é derivado, religar restaura sem tocar em PM/PV.
 * Some da tela quando não há nenhuma fonte fixa.
 */
function FixedBonusesPanel() {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  const fromAbilities: FixedRow[] = (character.abilities ?? [])
    .map((a, index) => ({ a, index }))
    .filter(({ a }) => a.alwaysActive)
    .map(({ a, index }) => ({
      key: `ability-${index}`,
      owner: 'ability' as const,
      index,
      name: a.name || 'Sem nome',
      summary: summarizeEffects(filterFixedBonusEffects(a.buffs ?? [])),
      suppressed: !!a.suppressed,
    }))
    .filter((row) => row.summary !== '');

  const fromItems: FixedRow[] = (character.inventory ?? [])
    .map((it, index) => ({ it, index }))
    .filter(({ it }) => it.alwaysActive)
    .map(({ it, index }) => ({
      key: `item-${index}`,
      owner: 'item' as const,
      index,
      name: it.name || 'Sem nome',
      summary: summarizeEffects(filterFixedBonusEffects(it.buffs ?? [])),
      suppressed: !!it.suppressed,
    }))
    .filter((row) => row.summary !== '');

  const rows = [...fromAbilities, ...fromItems];

  if (rows.length === 0) return null;

  const toggle = (row: FixedRow) => {
    updateCharacter((prev) =>
      row.owner === 'ability'
        ? {
            ...prev,
            abilities: prev.abilities.map((a, i) =>
              i === row.index ? { ...a, suppressed: !a.suppressed } : a,
            ),
          }
        : {
            ...prev,
            inventory: prev.inventory.map((it, i) =>
              i === row.index ? { ...it, suppressed: !it.suppressed } : it,
            ),
          },
    );
  };

  return (
    <div className={styles.panel}>
      <SectionHeader title="Bônus Fixos" />
      <div className={styles.list}>
        {rows.map((row) => (
          <div key={row.key} className={`${styles.row} ${row.suppressed ? styles.rowOff : ''}`.trim()}>
            <button
              type="button"
              className={`${styles.dot} ${row.suppressed ? '' : styles.dotOn}`.trim()}
              aria-label={row.suppressed ? `Reativar ${row.name}` : `Suspender ${row.name}`}
              onClick={readOnly ? undefined : () => toggle(row)}
              disabled={readOnly}
            />
            <span className={styles.name}>{row.name}</span>
            {row.summary && <span className={styles.tag}>{row.summary}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

FixedBonusesPanel.displayName = 'FixedBonusesPanel';

export default FixedBonusesPanel;
