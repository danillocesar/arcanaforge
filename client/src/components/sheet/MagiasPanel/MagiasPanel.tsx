import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import Card from '../../ui/Card/Card';
import SpellCard from '../SpellCard/SpellCard';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { calcSpellResistance, formatMod, getEffectiveAttribute } from '../../../utils/calculations';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import styles from './MagiasPanel.module.css';

interface MagiasPanelProps {
  editMode?: boolean;
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
}

function MagiasPanel({ editMode = false, onEdit, onRemove }: MagiasPanelProps) {
  const { character, updateCharacter, sendSpellCast } = useCharacterContext();

  if (!character) return null;

  const spells = character.spells ?? [];
  const attrKey = character.spellcastingAttribute || 'int';
  const attrLabel = ATTRIBUTE_LABELS[attrKey];
  const attrMod = getEffectiveAttribute(character, attrKey);
  const resistance = calcSpellResistance(character);

  // Replicates CastSpellModal's core cast (base cost only, no enhancement picker here).
  const castSpell = (index: number) => {
    const spell = character.spells[index];
    if (!spell) return;
    const mpCost = Number(spell.mpCost) || 0;
    const name = spell.name || 'Magia';

    updateCharacter((f) => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - mpCost) },
      logs: [
        ...f.logs,
        {
          type: 'spell',
          name,
          mpSpent: mpCost,
          timestamp: Date.now(),
          details: { baseMpCost: mpCost, enhancements: [], totalCost: mpCost },
        },
      ],
    }));
    sendSpellCast(name, mpCost);
  };

  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index);
      return;
    }
    updateCharacter((f) => ({
      ...f,
      spells: f.spells.filter((_, i) => i !== index),
    }));
  };

  return (
    <section>
      <SectionHeader title="Magias" action="Conjuração" />

      <Card className={styles.conj}>
        <div className={styles.ic}>🌙</div>
        <div className={styles.info}>
          <div className={styles.t}>Atributo-chave · {attrLabel}</div>
          <div className={styles.stats}>
            <div>
              <b>{formatMod(attrMod)}</b>
              <span>Chave</span>
            </div>
            <div>
              <b>{resistance}</b>
              <span>CD de resistência</span>
            </div>
            <div>
              <b>{character.mp.max}</b>
              <span>PM máx.</span>
            </div>
          </div>
        </div>
      </Card>

      <SectionHeader
        title="Conhecidas"
        className={styles.gapHead}
        action={`${spells.length} ${spells.length === 1 ? 'magia' : 'magias'}`}
      />

      {spells.length === 0 ? (
        <p className={styles.empty}>Nenhuma magia conhecida.</p>
      ) : (
        <div className={styles.list}>
          {spells.map((spell, index) => (
            <SpellCard
              key={index}
              spell={spell}
              index={index}
              editMode={editMode}
              onCast={castSpell}
              onEdit={onEdit}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </section>
  );
}

MagiasPanel.displayName = 'MagiasPanel';

export default MagiasPanel;
