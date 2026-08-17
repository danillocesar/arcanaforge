import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import { summarizeEffects } from '../../../utils/buffEffects';
import styles from './FixedBonusesPanel.module.css';

interface FixedRow {
  key: string;
  name: string;
  summary: string;
}

/**
 * Lista os Poderes/Habilidades e Itens marcados como `alwaysActive` — só leitura,
 * nunca desliga, por isso fica numa seção separada da lista de Buffs & Condições
 * (que é toggleável). Some da tela quando não há nenhuma fonte fixa.
 */
function FixedBonusesPanel() {
  const { character } = useCharacterContext();

  if (!character) return null;

  const fromAbilities: FixedRow[] = (character.abilities ?? [])
    .filter((a) => a.alwaysActive && (a.buffs?.length ?? 0) > 0)
    .map((a, i) => ({
      key: `ability-${i}`,
      name: a.name || 'Sem nome',
      summary: summarizeEffects(a.buffs ?? []),
    }));

  const fromItems: FixedRow[] = (character.inventory ?? [])
    .filter((it) => it.alwaysActive && (it.buffs?.length ?? 0) > 0)
    .map((it, i) => ({
      key: `item-${i}`,
      name: it.name || 'Sem nome',
      summary: summarizeEffects(it.buffs ?? []),
    }));

  const rows = [...fromAbilities, ...fromItems];

  if (rows.length === 0) return null;

  return (
    <div className={styles.panel}>
      <SectionHeader title="Bônus Fixos" />
      <div className={styles.list}>
        {rows.map((row) => (
          <div key={row.key} className={styles.row}>
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
