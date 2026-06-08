import { useCharacterContext } from '../../../contexts/CharacterContext';
import { formatMod } from '../../../utils/calculations';
import type { InventoryItem } from '../../../types/character';
import Card from '../../ui/Card/Card';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import styles from './EquipamentosPanel.module.css';

interface EquipamentosPanelProps {
  editMode?: boolean;
}

/** Legacy inventory items have no category → treated as 'comum'. */
function isComum(item: InventoryItem): boolean {
  return item.category === 'comum' || item.category == null;
}

/**
 * "C dark" Equipamentos panel. Three sub-sections:
 *   1. Equipamentos — Armas (ActionCard), Armaduras (defense.items), Acessórios (inventory).
 *   2. Comuns — inventory items categorised 'comum' (or legacy/undefined).
 *   3. Consumíveis — inventory items categorised 'consumivel'.
 *
 * No Carga/weight UI and no per-item icons (plan constraint). In editMode each
 * row exposes a × that removes the entry from its source array via updateCharacter.
 */
function EquipamentosPanel({ editMode = false }: EquipamentosPanelProps) {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const attacks = character.attacks ?? [];
  const armaduras = character.defense?.items ?? [];
  const inventory = character.inventory ?? [];

  const acessorios = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === 'acessorio');
  const comuns = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isComum(item));
  const consumiveis = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === 'consumivel');

  const removeArma = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      attacks: f.attacks.filter((_, i) => i !== idx),
    }));
  };

  const removeArmadura = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      defense: { ...f.defense, items: f.defense.items.filter((_, i) => i !== idx) },
    }));
  };

  const removeInventoryItem = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      inventory: f.inventory.filter((_, i) => i !== idx),
    }));
  };

  const proficiencies = character.proficiencies?.trim();

  return (
    <div className={styles.panel}>
      {/* ─── 1. EQUIPAMENTOS ─── */}
      <SectionHeader title="Equipamentos" />

      <div className={styles.subHead}>Armas</div>
      {attacks.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {attacks.map((arma, idx) => (
            <div key={idx} className={styles.row}>
              <div className={styles.rowName}>
                {arma.name || 'Arma'}
                {arma.type && <small className={styles.effect}>{arma.type}</small>}
              </div>
              <div className={styles.rowMeta}>
                {arma.damage && <span className={styles.badge}>{arma.damage}</span>}
                {arma.critical && <span className={styles.slot}>{arma.critical}</span>}
              </div>
              {editMode && (
                <button
                  type="button"
                  className={styles.rmX}
                  onClick={() => removeArma(idx)}
                  title="Remover arma"
                  aria-label="Remover arma"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <p className={styles.empty}>Nenhuma arma cadastrada.</p>
      )}

      <div className={styles.subHead}>Armaduras</div>
      {armaduras.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {armaduras.map((arm, idx) => (
            <div key={idx} className={styles.row}>
              <div className={styles.rowName}>{arm.name || 'Armadura'}</div>
              <div className={styles.rowMeta}>
                <span className={styles.badge}>{formatMod(arm.value)}</span>
                {arm.penalty !== 0 && (
                  <span className={styles.penalty}>Pen {formatMod(arm.penalty)}</span>
                )}
              </div>
              {editMode && (
                <button
                  type="button"
                  className={styles.rmX}
                  onClick={() => removeArmadura(idx)}
                  title="Remover armadura"
                  aria-label="Remover armadura"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <p className={styles.empty}>Nenhuma armadura cadastrada.</p>
      )}

      <div className={styles.subHead}>Acessórios</div>
      {acessorios.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {acessorios.map(({ item, index }) => (
            <div key={index} className={styles.row}>
              <div className={styles.rowName}>
                {item.name || 'Acessório'}
                {item.effect && <small className={styles.effect}>{item.effect}</small>}
              </div>
              <div className={styles.rowMeta}>
                {item.slot && <span className={styles.slot}>{item.slot}</span>}
              </div>
              {editMode && (
                <button
                  type="button"
                  className={styles.rmX}
                  onClick={() => removeInventoryItem(index)}
                  title="Remover acessório"
                  aria-label="Remover acessório"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <p className={styles.empty}>Nenhum acessório cadastrado.</p>
      )}

      {/* ─── 2. COMUNS ─── */}
      <SectionHeader title="Comuns" className={styles.gap} />
      {comuns.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {comuns.map(({ item, index }) => (
            <div key={index} className={styles.row}>
              <div className={styles.rowName}>{item.name || 'Item'}</div>
              <div className={styles.rowMeta}>
                <span className={styles.qty}>×{item.quantity ?? 1}</span>
              </div>
              {editMode && (
                <button
                  type="button"
                  className={styles.rmX}
                  onClick={() => removeInventoryItem(index)}
                  title="Remover item"
                  aria-label="Remover item"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <p className={styles.empty}>Nenhum item comum.</p>
      )}

      {/* ─── 3. CONSUMÍVEIS ─── */}
      <SectionHeader title="Consumíveis" className={styles.gap} />
      {consumiveis.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {consumiveis.map(({ item, index }) => (
            <div key={index} className={styles.row}>
              <div className={styles.rowName}>
                {item.name || 'Consumível'}
                {item.effect && <small className={styles.effect}>{item.effect}</small>}
              </div>
              <div className={styles.rowMeta}>
                <span className={styles.qty}>×{item.quantity ?? 1}</span>
              </div>
              {editMode && (
                <button
                  type="button"
                  className={styles.rmX}
                  onClick={() => removeInventoryItem(index)}
                  title="Remover consumível"
                  aria-label="Remover consumível"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <p className={styles.empty}>Nenhum consumível.</p>
      )}

      {proficiencies && (
        <p className={styles.proficiencies}>
          <span className={styles.proficienciesLabel}>Proficiências:</span> {proficiencies}
        </p>
      )}
    </div>
  );
}

EquipamentosPanel.displayName = 'EquipamentosPanel';

export default EquipamentosPanel;
