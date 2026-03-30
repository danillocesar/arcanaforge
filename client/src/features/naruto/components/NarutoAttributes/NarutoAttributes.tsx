import { useState } from 'react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import {
  NARUTO_ATTRIBUTE_LABELS,
  NARUTO_ATTRIBUTE_FULL_NAMES,
  NARUTO_ATTRIBUTE_IDS,
} from '../../data/narutoAttributes';
import {
  getAttributePointsRemaining,
  syncNarutoHpMp,
  calcCombatSkillTotal,
  calcIniciativa,
  calcReacaoEsquiva,
  calcDeslocamento,
  calcDurezaTotal,
} from '../../utils/narutoCalculations';
import { getEvolutionRow } from '../../data/narutoConstants';
import type { NarutoAttributeId } from '../../../../types/narutoCharacter';
import type { Character } from '../../../../types/character';
import Section from '../../../../components/ui/Section/Section';
import styles from './NarutoAttributes.module.css';

function AttributeCard({ attrId, character, updateCharacter, minAttr }: {
  attrId: NarutoAttributeId;
  character: Character;
  updateCharacter: (fn: (f: Character) => Character) => void;
  minAttr: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const value = character.narpiAttributes?.[attrId] ?? 0;
  const belowMin = minAttr > 0 && value < minAttr;

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
  };

  const commitEdit = () => {
    const val = Number(draft);
    if (!isNaN(val)) {
      updateCharacter((f) => {
        const updated = { ...f, narpiAttributes: { ...f.narpiAttributes!, [attrId]: val } };
        if (attrId === 'vig' || attrId === 'esp') return syncNarutoHpMp(updated);
        return updated;
      });
    }
    setEditing(false);
  };

  return (
    <div className={`${styles.card} ${belowMin ? styles.cardError : ''}`} title={NARUTO_ATTRIBUTE_FULL_NAMES[attrId]}>
      <span className={styles.label}>{NARUTO_ATTRIBUTE_LABELS[attrId]}</span>
      {editing ? (
        <input
          className={styles.editInput}
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
          autoFocus
        />
      ) : (
        <>
          <span className={styles.value}>{value}</span>
          <button type="button" className={styles.editPencil} onClick={startEdit}>&#x270E;</button>
        </>
      )}
    </div>
  );
}

const COMBAT_SUMMARY: { id: 'cc' | 'cd' | 'esq' | 'lm'; label: string }[] = [
  { id: 'cc',  label: 'CC' },
  { id: 'cd',  label: 'CD' },
  { id: 'esq', label: 'ESQ' },
  { id: 'lm',  label: 'LM' },
];

export default function NarutoAttributes() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const nc = character.campaignLevel ?? 4;
  const row = getEvolutionRow(nc);
  const remaining = getAttributePointsRemaining(character);

  const iniciativa = calcIniciativa(character);
  const reacaoEsq = calcReacaoEsquiva(character);
  const deslocamento = calcDeslocamento(character);
  const dureza = calcDurezaTotal(character);
  const absorcao = character.armor?.absorption ?? 0;

  return (
    <Section id="secAttributes" title="Atributos & Combate">
      <div className={styles.layout}>
        <div className={styles.attrCol}>
          <div className={styles.header}>
            <span className={styles.pointsLabel}>
              Pontos: <strong>{row.atributos}</strong>
            </span>
            <span className={`${styles.remaining} ${remaining < 0 ? styles.over : ''}`}>
              {remaining} restante{remaining !== 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.grid}>
            {NARUTO_ATTRIBUTE_IDS.map((id) => (
              <AttributeCard
                key={id}
                attrId={id}
                character={character}
                updateCharacter={updateCharacter}
                minAttr={row.minAttr}
              />
            ))}
          </div>
        </div>

        <div className={styles.combatCol}>
          <div className={styles.combatGrid}>
            {COMBAT_SUMMARY.map((cs) => (
              <div key={cs.id} className={styles.statBox}>
                <span className={styles.statLabel}>{cs.label}</span>
                <span className={styles.statValue}>{calcCombatSkillTotal(character, cs.id)}</span>
              </div>
            ))}
          </div>

          <div className={styles.derivedList}>
            <div className={styles.derivedItem}>
              <span className={styles.derivedLabel}>Iniciativa</span>
              <span className={styles.derivedValue}>{iniciativa}</span>
            </div>
            <div className={styles.derivedItem}>
              <span className={styles.derivedLabel}>Reação de Esquiva</span>
              <span className={styles.derivedValue}>{reacaoEsq}</span>
            </div>
            <div className={styles.derivedItem}>
              <span className={styles.derivedLabel}>Deslocamento</span>
              <span className={styles.derivedValue}>{deslocamento}m</span>
            </div>
            <div className={styles.derivedItem}>
              <span className={styles.derivedLabel}>Dureza</span>
              <span className={styles.derivedValue}>{dureza}</span>
            </div>
            <div className={styles.derivedItem}>
              <span className={styles.derivedLabel}>Absorção</span>
              <span className={styles.derivedValue}>{absorcao}</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
