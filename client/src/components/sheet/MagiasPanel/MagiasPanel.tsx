import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import Card from '../../ui/Card/Card';
import SpellCard from '../SpellCard/SpellCard';
import AddButton from '../AddButton/AddButton';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import { calcSpellResistance, formatMod, getEffectiveAttribute } from '../../../utils/calculations';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import styles from './MagiasPanel.module.css';

interface MagiasPanelProps {
  editMode?: boolean;
  onRemove?: (index: number) => void;
}

function MagiasPanel({ editMode = false, onRemove }: MagiasPanelProps) {
  const { character, updateCharacter, sendSpellCast, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();

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
        action={!readOnly && <AddButton label="Magia" onClick={() => openCreate('magia')} />}
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
              onEdit={(i) => openEdit('magia', i)}
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
