import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { calcCompartmentsUsed, calcCompartmentsTotal } from '../../utils/narutoCalculations';
import type { NarutoWeapon, NarutoItem } from '../../../../types/narutoCharacter';
import Section from '../../../../components/ui/Section/Section';
import NumericInput from '../../../../components/ui/NumericInput/NumericInput';
import styles from './NarutoInventory.module.css';

export default function NarutoInventory() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const armor = character.armor ?? { name: '', absorption: 0, hardness: 0, penalty: 0, type: '', compartments: 0 };
  const weapons = character.weapons ?? [];
  const items = character.narpiItems ?? [];
  const compartUsed = calcCompartmentsUsed(character);
  const compartTotal = calcCompartmentsTotal(character);

  /* ─── Armor ─── */
  const setArmor = (field: string, value: string | number) => {
    updateCharacter((f) => ({
      ...f,
      armor: { ...f.armor!, [field]: value },
    }));
  };

  /* ─── Weapons ─── */
  const updateWeapon = (idx: number, field: keyof NarutoWeapon, value: string | number) => {
    updateCharacter((f) => ({
      ...f,
      weapons: f.weapons!.map((w, i) => (i === idx ? { ...w, [field]: value } : w)),
    }));
  };

  const addWeapon = () => {
    updateCharacter((f) => ({
      ...f,
      weapons: [
        ...(f.weapons ?? []),
        { id: crypto.randomUUID(), name: '', damage: 0, range: '', critical: '', type: 'C', hitAttr: '', damageAttr: '', quantity: 1, description: '', compartments: 1 },
      ],
    }));
  };

  const removeWeapon = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      weapons: f.weapons!.filter((_, i) => i !== idx),
    }));
  };

  /* ─── Items ─── */
  const updateItem = (idx: number, field: keyof NarutoItem, value: string | number) => {
    updateCharacter((f) => ({
      ...f,
      narpiItems: f.narpiItems!.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    }));
  };

  const addItem = () => {
    updateCharacter((f) => ({
      ...f,
      narpiItems: [
        ...(f.narpiItems ?? []),
        { id: crypto.randomUUID(), name: '', quantity: 1, perSlot: 1, description: '', compartments: 1 },
      ],
    }));
  };

  const removeItem = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      narpiItems: f.narpiItems!.filter((_, i) => i !== idx),
    }));
  };

  return (
    <Section id="secInventory" title="Inventario">
      {/* Ryos & Compartments */}
      <div className={styles.topRow}>
        <div className={styles.ryoField}>
          <label>Ryos</label>
          <NumericInput
            value={character.ryos ?? 0}
            onChange={(n) => updateCharacter((f) => ({ ...f, ryos: n }))}
          />
        </div>
        <div className={styles.ryoField}>
          <label>Ryos Guardados</label>
          <NumericInput
            value={character.ryosStored ?? 0}
            onChange={(n) => updateCharacter((f) => ({ ...f, ryosStored: n }))}
          />
        </div>
        <div className={styles.compartInfo}>
          <span className={styles.compartLabel}>Compartimentos</span>
          <span className={`${styles.compartValue} ${compartUsed > compartTotal ? styles.overCap : ''}`}>
            {compartUsed} / {compartTotal}
          </span>
        </div>
      </div>

      {/* Armor */}
      <div className={styles.subsection}>
        <h3 className={styles.subTitle}>Armadura</h3>
        <div className={styles.armorGrid}>
          <div className={styles.field}>
            <label>Nome</label>
            <input value={armor.name} onChange={(e) => setArmor('name', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Absorcao</label>
            <NumericInput value={armor.absorption} onChange={(n) => setArmor('absorption', n)} />
          </div>
          <div className={styles.field}>
            <label>Dureza</label>
            <NumericInput value={armor.hardness} onChange={(n) => setArmor('hardness', n)} />
          </div>
          <div className={styles.field}>
            <label>Penalidade</label>
            <NumericInput value={armor.penalty} onChange={(n) => setArmor('penalty', n)} />
          </div>
          <div className={styles.field}>
            <label>Tipo</label>
            <select value={armor.type} onChange={(e) => setArmor('type', e.target.value)}>
              <option value="">--</option>
              <option value="leve">Leve</option>
              <option value="pesada">Pesada</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Comp.</label>
            <NumericInput min={0} value={armor.compartments} onChange={(n) => setArmor('compartments', n)} />
          </div>
        </div>
      </div>

      {/* Weapons */}
      <div className={styles.subsection}>
        <h3 className={styles.subTitle}>Armas</h3>
        {weapons.length > 0 && (
          <div className={styles.weaponHeader}>
            <span className={styles.whNum}>Qtd</span>
            <span className={styles.whName}>Nome</span>
            <span className={styles.whNum}>Dano</span>
            <span className={styles.whSmall}>Alcance</span>
            <span className={styles.whSmall}>Critico</span>
            <span className={styles.whTiny}>Tipo</span>
            <span className={styles.whTiny}>Acerto</span>
            <span className={styles.whTiny}>Mod D</span>
            <span className={styles.whNum}>Comp</span>
            <span className={styles.whDel} />
          </div>
        )}
        <div className={styles.itemList}>
          {weapons.map((w, i) => (
            <div key={w.id} className={styles.itemRow}>
              <NumericInput
                className={styles.itemNum}
                min={0}
                value={w.quantity ?? 1}
                onChange={(n) => updateWeapon(i, 'quantity', n)}
                title="Quantidade"
              />
              <input
                className={styles.itemName}
                value={w.name}
                onChange={(e) => updateWeapon(i, 'name', e.target.value)}
                placeholder="Nome"
              />
              <NumericInput
                className={styles.itemNum}
                value={w.damage}
                onChange={(n) => updateWeapon(i, 'damage', n)}
                title="Dano"
              />
              <input
                className={styles.itemSmall}
                value={w.range}
                onChange={(e) => updateWeapon(i, 'range', e.target.value)}
                placeholder="Alcance"
              />
              <input
                className={styles.itemSmall}
                value={w.critical}
                onChange={(e) => updateWeapon(i, 'critical', e.target.value)}
                placeholder="Critico"
              />
              <select
                className={styles.itemSelect}
                value={w.type}
                onChange={(e) => updateWeapon(i, 'type', e.target.value)}
                title="Tipo"
              >
                <option value="C">C</option>
                <option value="P">P</option>
                <option value="E">E</option>
              </select>
              <select
                className={styles.itemSelect}
                value={w.hitAttr ?? ''}
                onChange={(e) => updateWeapon(i, 'hitAttr', e.target.value)}
                title="Acerto"
              >
                <option value="">--</option>
                <option value="cc">CC</option>
                <option value="cd">CD</option>
              </select>
              <select
                className={styles.itemSelect}
                value={w.damageAttr ?? ''}
                onChange={(e) => updateWeapon(i, 'damageAttr', e.target.value)}
                title="Mod. Dano"
              >
                <option value="">--</option>
                <option value="for">FOR</option>
                <option value="des">DES</option>
                <option value="esp">ESP</option>
              </select>
              <NumericInput
                className={styles.itemNum}
                min={0}
                value={w.compartments}
                onChange={(n) => updateWeapon(i, 'compartments', n)}
                title="Compartimentos"
              />
              <button type="button" className={styles.removeBtn} onClick={() => removeWeapon(i)}>X</button>
            </div>
          ))}
        </div>
        <button type="button" className={styles.addBtn} onClick={addWeapon}>+ Arma</button>
      </div>

      {/* Items */}
      <div className={styles.subsection}>
        <h3 className={styles.subTitle}>Itens</h3>
        <div className={styles.itemList}>
          {items.map((it, i) => (
            <div key={it.id} className={styles.itemRow}>
              <NumericInput
                className={styles.itemNum}
                min={0}
                value={it.quantity}
                onChange={(n) => updateItem(i, 'quantity', n)}
                title="Qtd"
              />
              <input
                className={styles.itemName}
                value={it.name}
                onChange={(e) => updateItem(i, 'name', e.target.value)}
                placeholder="Nome"
              />
              <input
                className={styles.itemDesc}
                value={it.description}
                onChange={(e) => updateItem(i, 'description', e.target.value)}
                placeholder="Descricao"
              />
              <NumericInput
                className={styles.itemNum}
                min={0}
                value={it.compartments}
                onChange={(n) => updateItem(i, 'compartments', n)}
                title="Compartimentos"
              />
              <button type="button" className={styles.removeBtn} onClick={() => removeItem(i)}>X</button>
            </div>
          ))}
        </div>
        <button type="button" className={styles.addBtn} onClick={addItem}>+ Item</button>
      </div>
    </Section>
  );
}
