import { useCharacterContext } from '../../../contexts/CharacterContext';
import { formatMod } from '../../../utils/calculations';
import type { InventoryItem } from '../../../types/character';
import Card from '../../ui/Card/Card';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import AddButton from '../AddButton/AddButton';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import type { EntityKind } from '../SheetForm/entityForms';
import styles from './EquipamentosPanel.module.css';

/** Legacy inventory items have no category → treated as 'comum'. */
function isComum(item: InventoryItem): boolean {
  return item.category === 'comum' || item.category == null;
}

function EquipamentosPanel() {
  const { character, updateCharacter, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();

  if (!character) return null;

  const armaduras = character.defense?.items ?? [];
  const inventory = character.inventory ?? [];

  const armas = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === 'arma');
  const acessorios = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === 'acessorio');
  const comuns = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isComum(item));
  const consumiveis = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === 'consumivel');

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

  const rowCtrl = (kind: EntityKind, idx: number, onRemove: () => void) =>
    !readOnly ? (
      <>
        <button type="button" className={styles.pen} aria-label="Editar" onClick={() => openEdit(kind, idx)}>✎</button>
        <button type="button" className={styles.rmX} aria-label="Remover" onClick={onRemove}>×</button>
      </>
    ) : null;

  return (
    <div className={styles.panel}>
      {/* ─── 1. EQUIPAMENTOS ─── */}
      <SectionHeader
        title="Equipamentos"
        action={!readOnly && <AddButton label="Item" onClick={() => openCreate('item')} />}
      />

      <div className={styles.subHead}>Armas</div>
      {armas.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {armas.map(({ item, index }) => (
            <div key={index} className={styles.row}>
              <div className={styles.rowName}>
                {item.name || 'Arma'}
                {item.effect && <small className={styles.effect}>{item.effect}</small>}
              </div>
              <div className={styles.rowMeta}>
                {item.slot && <span className={styles.slot}>{item.slot}</span>}
              </div>
              {rowCtrl('arma', index, () => removeInventoryItem(index))}
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
              {rowCtrl('armadura', idx, () => removeArmadura(idx))}
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
              {rowCtrl('acessorio', index, () => removeInventoryItem(index))}
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
              {rowCtrl('comum', index, () => removeInventoryItem(index))}
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
              {rowCtrl('consumivel', index, () => removeInventoryItem(index))}
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
