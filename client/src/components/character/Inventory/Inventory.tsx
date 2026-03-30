import { useCharacterContext } from '../../../contexts/CharacterContext';
import { calcCarryCapacity, calcUsedLoad } from '../../../utils/calculations';
import { EQUIP_ICONS } from '../../../data/constants';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import NumericInput from '../../ui/NumericInput/NumericInput';
import styles from './Inventory.module.css';

export default function Inventory() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const carryCapacity = calcCarryCapacity(character);
  const usedLoad = calcUsedLoad(character);
  const maxLoad = carryCapacity * 2;

  const setCoin = (key: 'copper' | 'silver' | 'gold', val: number) => {
    updateCharacter((f) => ({ ...f, coins: { ...f.coins, [key]: val } }));
  };

  const addItem = () => {
    updateCharacter((f) => ({
      ...f,
      inventory: [...f.inventory, { name: '', quantity: 1, weight: 0 }],
    }));
  };

  const removeItem = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      inventory: f.inventory.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx: number, key: string, value: string | number) => {
    updateCharacter((f) => {
      const inventory = [...f.inventory];
      inventory[idx] = { ...inventory[idx], [key]: value };
      return { ...f, inventory };
    });
  };

  const updateEquip = (idx: number, name: string) => {
    updateCharacter((f) => {
      const equipped = [...f.equipped];
      equipped[idx] = { name };
      return { ...f, equipped };
    });
  };

  return (
    <Section id="secInventory" title="Inventário">
      <div className={styles.stats}>
        <span>Limite de Carga: <strong>{carryCapacity}</strong></span>
        <span>Carga Usada: <strong>{usedLoad}</strong></span>
        <span>Carga Máx: <strong>{maxLoad}</strong></span>
        <div className={styles.coins}>
          <label>TC</label>
          <NumericInput
            className={styles.coinInput}
            value={character.coins.copper}
            onChange={(n) => setCoin('copper', n)}
          />
          <label>T$</label>
          <NumericInput
            className={styles.coinInput}
            value={character.coins.silver}
            onChange={(n) => setCoin('silver', n)}
          />
          <label>TO</label>
          <NumericInput
            className={styles.coinInput}
            value={character.coins.gold}
            onChange={(n) => setCoin('gold', n)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.colLeft}>
          <div className={styles.itemHeader}>
            <span>Itens</span>
            <span>Qtd</span>
            <span>Espaço</span>
            <span></span>
          </div>
          {character.inventory.map((item, i) => (
            <div key={i} className={styles.item}>
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(i, 'name', e.target.value)}
                placeholder="Nome do item"
              />
              <NumericInput
                value={item.quantity}
                fallback={1}
                onChange={(n) => updateItem(i, 'quantity', n)}
              />
              <NumericInput
                value={item.weight}
                onChange={(n) => updateItem(i, 'weight', n)}
              />
              <Button variant="remove-sm" onClick={() => removeItem(i)}>✕</Button>
            </div>
          ))}
          <Button variant="add" onClick={addItem}>+ Item</Button>
        </div>

        <div className={styles.colRight}>
          <h3>Equipados <span className={styles.equipLimit}>(máx 4)</span></h3>
          {character.equipped.slice(0, 4).map((eq, i) => (
            <div
              key={i}
              className={`${styles.equipSlot} ${eq.name ? styles.filled : ''}`}
            >
              <span className={styles.equipIcon}>{EQUIP_ICONS[i]}</span>
              <input
                type="text"
                value={eq.name}
                onChange={(e) => updateEquip(i, e.target.value)}
                placeholder="Vazio"
              />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
