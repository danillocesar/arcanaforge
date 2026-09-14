import { useCharacterContext } from '../../../contexts/CharacterContext';
import { formatMod, calcCarryCapacity, calcUsedLoad, isWeaponAttack, isItemEquipped } from '../../../utils/calculations';
import type { Coins, InventoryItem } from '../../../types/character';
import Card from '../../ui/Card/Card';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import Stepper from '../../ui/Stepper/Stepper';
import EmptyState from '../../ui/EmptyState/EmptyState';
import AddButton from '../AddButton/AddButton';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import type { EntityKind } from '../SheetForm/entityForms';
import styles from './EquipamentosPanel.module.css';

const COIN_ROWS: Array<{ key: keyof Coins; label: string }> = [
  { key: 'copper', label: 'TC' },
  { key: 'silver', label: 'T$' },
  { key: 'gold', label: 'TO' },
];

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
  const coins = character.coins ?? { copper: 0, silver: 0, gold: 0 };

  const setCoin = (key: keyof Coins, value: number) => {
    updateCharacter((f) => ({ ...f, coins: { ...f.coins, [key]: value } }));
  };

  const armas = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === 'arma');
  const acessorios = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === 'acessorio');
  const esotericos = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === 'esoterico');
  const comuns = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isComum(item));
  const consumiveis = inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === 'consumivel');

  const proficiencies = character.proficiencies?.trim();
  const usedLoad = calcUsedLoad(character);
  const carryCapacity = calcCarryCapacity(character);
  const loadPct = carryCapacity > 0 ? Math.min(100, (usedLoad / carryCapacity) * 100) : 0;
  const overloaded = usedLoad > carryCapacity;

  const rowProps = (kind: EntityKind, idx: number) =>
    !readOnly
      ? {
          className: `${styles.row} ${styles.tappable}`,
          role: 'button' as const,
          tabIndex: 0,
          onClick: () => openEdit(kind, idx),
        }
      : { className: styles.row };

  const toggleWeaponEquipped = (index: number) =>
    updateCharacter((f) => ({
      ...f,
      inventory: f.inventory.map((it, idx) =>
        idx === index ? { ...it, equipped: !isItemEquipped(it) } : it,
      ),
    }));

  const toggleArmorEquipped = (index: number) =>
    updateCharacter((f) => ({
      ...f,
      defense: {
        ...f.defense,
        items: f.defense.items.map((it, idx) =>
          idx === index ? { ...it, equipped: !isItemEquipped(it) } : it,
        ),
      },
    }));

  /** Checkbox "equipado" — clique não abre o form de edição da linha. */
  const equipCheckbox = (checked: boolean, onToggle: () => void) => (
    <input
      type="checkbox"
      className={styles.equipCheck}
      title={checked ? 'Equipado — efeitos aplicando' : 'Desequipado — efeitos suspensos'}
      checked={checked}
      disabled={readOnly}
      onClick={(e) => e.stopPropagation()}
      onChange={onToggle}
    />
  );

  return (
    <div className={styles.panel}>
      {/* ─── 0. DINHEIRO ─── */}
      <SectionHeader title="Dinheiro" />
      <Card className={styles.coins}>
        {COIN_ROWS.map(({ key, label }) => (
          <div key={key} className={styles.coinItem}>
            <span className={styles.coinLabel}>{label}</span>
            {!readOnly ? (
              <Stepper
                value={coins[key]}
                onChange={(n) => setCoin(key, n)}
                min={0}
                className={styles.coinStepper}
              />
            ) : (
              <b>{coins[key]}</b>
            )}
          </div>
        ))}
      </Card>

      {/* ─── CARGA ─── */}
      <SectionHeader title="Carga" className={styles.gap} />
      <Card className={styles.loadCard}>
        <div className={styles.loadRow}>
          <span>Peso carregado</span>
          <b className={overloaded ? styles.loadOver : undefined}>
            {usedLoad} / {carryCapacity} kg
          </b>
        </div>
        <div className={styles.loadTrack}>
          <i
            className={overloaded ? styles.loadOver : undefined}
            style={{ width: `${loadPct}%` }}
          />
        </div>
        {overloaded && <p className={styles.loadWarn}>Acima da capacidade de carga.</p>}
      </Card>

      {/* ─── PROFICIÊNCIAS (info de personagem, não item de inventário) ─── */}
      <SectionHeader title="Proficiências" className={styles.gap} />
      {!readOnly ? (
        <textarea
          className={styles.proficienciesInput}
          value={character.proficiencies ?? ''}
          onChange={(e) => updateCharacter((f) => ({ ...f, proficiencies: e.target.value }))}
          placeholder="Ex.: armas simples, armas marciais leves, armaduras leves, escudos…"
        />
      ) : proficiencies ? (
        <p className={styles.proficiencies}>{proficiencies}</p>
      ) : (
        <p className={styles.empty}>Nenhuma proficiência cadastrada.</p>
      )}

      {/* ─── 1. EQUIPAMENTOS ─── */}
      <SectionHeader
        title="Equipamentos"
        className={styles.gap}
        action={!readOnly && <AddButton label="Item" onClick={() => openCreate('item')} />}
      />

      <div className={styles.subHead}>Armas</div>
      {armas.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {armas.map(({ item, index }) => (
            <div key={index} {...rowProps('arma', index)}>
              {equipCheckbox(isItemEquipped(item), () => toggleWeaponEquipped(index))}
              <div className={styles.rowName}>
                {item.name || 'Arma'}
                {item.effect && <small className={styles.effect}>{item.effect}</small>}
              </div>
              <div className={styles.rowMeta}>
                {isWeaponAttack(item) && isItemEquipped(item) && (
                  <span className={styles.linkedBadge} title="Aparece em Ações → Ataques">⚔</span>
                )}
                {item.slot && <span className={styles.slot}>{item.slot}</span>}
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState compact icon="⚔" title="Nenhuma arma cadastrada." />
      )}

      <div className={styles.subHead}>Armaduras</div>
      {armaduras.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {armaduras.map((arm, idx) => (
            <div key={idx} {...rowProps('armadura', idx)}>
              {equipCheckbox(isItemEquipped(arm), () => toggleArmorEquipped(idx))}
              <div className={styles.rowName}>{arm.name || 'Armadura'}</div>
              <div className={styles.rowMeta}>
                <span className={styles.badge}>{formatMod(arm.value)}</span>
                {arm.penalty !== 0 && (
                  <span className={styles.penalty}>Pen {formatMod(arm.penalty)}</span>
                )}
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState compact icon="🛡" title="Nenhuma armadura cadastrada." />
      )}

      <div className={styles.subHead}>Acessórios</div>
      {acessorios.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {acessorios.map(({ item, index }) => (
            <div key={index} {...rowProps('acessorio', index)}>
              <div className={styles.rowName}>
                {item.name || 'Acessório'}
                {item.effect && <small className={styles.effect}>{item.effect}</small>}
              </div>
              <div className={styles.rowMeta}>
                {item.slot && <span className={styles.slot}>{item.slot}</span>}
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState compact icon="💍" title="Nenhum acessório cadastrado." />
      )}

      <div className={styles.subHead}>Esotéricos</div>
      {esotericos.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {esotericos.map(({ item, index }) => (
            <div key={index} {...rowProps('esoterico', index)}>
              <div className={styles.rowName}>
                {item.name || 'Item esotérico'}
                {item.effect && <small className={styles.effect}>{item.effect}</small>}
              </div>
              <div className={styles.rowMeta}>
                {item.alwaysActive && (
                  <span className={styles.linkedBadge} title="Efeito sempre ativo">✦</span>
                )}
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState compact icon="🜛" title="Nenhum item esotérico." />
      )}

      {/* ─── 2. COMUNS ─── */}
      <SectionHeader title="Comuns" className={styles.gap} />
      {comuns.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {comuns.map(({ item, index }) => (
            <div key={index} {...rowProps('comum', index)}>
              <div className={styles.rowName}>{item.name || 'Item'}</div>
              <div className={styles.rowMeta}>
                <span className={styles.qty}>×{item.quantity ?? 1}</span>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState compact icon="🎒" title="Nenhum item comum." />
      )}

      {/* ─── 3. CONSUMÍVEIS ─── */}
      <SectionHeader title="Consumíveis" className={styles.gap} />
      {consumiveis.length > 0 ? (
        <Card padding={false} className={styles.list}>
          {consumiveis.map(({ item, index }) => (
            <div key={index} {...rowProps('consumivel', index)}>
              <div className={styles.rowName}>
                {item.name || 'Consumível'}
                {item.effect && <small className={styles.effect}>{item.effect}</small>}
              </div>
              <div className={styles.rowMeta}>
                <span className={styles.qty}>×{item.quantity ?? 1}</span>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState compact icon="🧪" title="Nenhum consumível." />
      )}
    </div>
  );
}

EquipamentosPanel.displayName = 'EquipamentosPanel';

export default EquipamentosPanel;
