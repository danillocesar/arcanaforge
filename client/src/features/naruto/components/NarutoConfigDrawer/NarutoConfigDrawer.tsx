import { useState } from 'react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { NARUTO_CONFIG_CATEGORIES } from '../../data/narutoConfigToggles';
import { CONFIG_EFFECTS } from '../../data/narutoConfigEffects';
import { syncNarutoHpMp } from '../../utils/narutoCalculations';
import styles from './NarutoConfigDrawer.module.css';

export default function NarutoConfigDrawer() {
  const { character, updateCharacter } = useCharacterContext();
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

  if (!character) return null;

  const config = character.narpiConfig ?? {};

  const toggleConfig = (key: string) => {
    updateCharacter((f) => {
      const updated = {
        ...f,
        narpiConfig: {
          ...f.narpiConfig,
          [key]: !f.narpiConfig?.[key],
        },
      };
      return syncNarutoHpMp(updated);
    });
  };

  const toggleCategory = (catId: string) => {
    setCollapsedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.drawerTitle}>Configuracoes</h3>

      {NARUTO_CONFIG_CATEGORIES.map((cat) => {
        const isCollapsed = collapsedCats[cat.id] ?? false;
        return (
          <div key={cat.id} className={styles.category}>
            <div
              className={styles.catHeader}
              onClick={() => toggleCategory(cat.id)}
            >
              <span className={styles.catTitle}>{cat.title}</span>
              <span className={styles.chevron}>{isCollapsed ? '\u25BC' : '\u25B2'}</span>
            </div>
            {!isCollapsed && (
              <div className={styles.catBody}>
                {cat.toggles.map((t) => {
                  const isActive = !!config[t.key];
                  return (
                    <label key={t.key} className={styles.toggle}>
                      <span className={styles.toggleLabel}>
                        {t.label}
                        {CONFIG_EFFECTS[t.key]?.length > 0 && (
                          <span className={styles.effectDot} title="Possui efeito mecânico" />
                        )}
                      </span>
                      <div
                        className={`${styles.switch} ${isActive ? styles.switchOn : ''}`}
                        onClick={() => toggleConfig(t.key)}
                      >
                        <div className={styles.switchThumb} />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
