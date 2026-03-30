import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { NARUTO_SKILLS_CONFIG } from '../../data/narutoSkills';
import { NARUTO_ATTRIBUTE_LABELS } from '../../data/narutoAttributes';
import {
  calcNarutoSkillTotal,
  getSkillPointsRemaining,
  getNarutoAttr,
} from '../../utils/narutoCalculations';
import { getEvolutionRow } from '../../data/narutoConstants';
import NumericInput from '../../../../components/ui/NumericInput/NumericInput';
import styles from './NarutoSkills.module.css';

export default function NarutoSkills() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const nc = character.campaignLevel ?? 4;
  const row = getEvolutionRow(nc);
  const remaining = getSkillPointsRemaining(character);

  const setSkillField = (skillId: string, field: 'pontos' | 'outro', value: number) => {
    updateCharacter((f) => ({
      ...f,
      narpiSkills: {
        ...f.narpiSkills,
        [skillId]: {
          ...(f.narpiSkills?.[skillId] ?? { pontos: 0, outro: 0, perito: false }),
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.pointsLabel}>
          Pontos de Pericias: <strong>{row.pericias}</strong>
        </span>
        <span className={`${styles.remaining} ${remaining < 0 ? styles.over : ''}`}>
          {remaining} restante{remaining !== 1 ? 's' : ''}
        </span>
      </div>

      <div className={styles.tableHeader}>
        <span className={styles.thName}>Pericia</span>
        <span className={styles.thVal}>Total</span>
        <span className={styles.thSep}>=</span>
        <span className={styles.thVal}>Pts</span>
        <span className={styles.thSep}>+</span>
        <span className={styles.thVal}>1/2 Atr</span>
        <span className={styles.thSep}>+</span>
        <span className={styles.thVal}>Outro</span>
      </div>

      <div className={styles.list}>
        {NARUTO_SKILLS_CONFIG.map((cfg) => {
          const skill = character.narpiSkills?.[cfg.id];
          const pontos = skill?.pontos ?? 0;
          const outro = skill?.outro ?? 0;
          const total = calcNarutoSkillTotal(character, cfg.id);
          const halfAttr = Math.ceil(getNarutoAttr(character, cfg.attribute) / 2);
          const cannotUse = total === -1;

          return (
            <div key={cfg.id} className={`${styles.row} ${cannotUse ? styles.disabled : ''}`}>
              <span className={styles.name}>
                <span className={styles.nameText}>
                  {cfg.name}
                  {cfg.trained && <span className={styles.trained}>*</span>}
                </span>
                <span className={styles.attrTag}>{NARUTO_ATTRIBUTE_LABELS[cfg.attribute]}</span>
              </span>
              <span className={styles.total}>
                {cannotUse ? 'X' : total}
              </span>
              <span className={styles.sep}>=</span>
              <NumericInput
                className={styles.input}
                min={0}
                value={pontos}
                onChange={(n) => setSkillField(cfg.id, 'pontos', n)}
              />
              <span className={styles.sep}>+</span>
              <span className={styles.auto}>{halfAttr}</span>
              <span className={styles.sep}>+</span>
              <NumericInput
                className={styles.input}
                value={outro}
                onChange={(n) => setSkillField(cfg.id, 'outro', n)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
