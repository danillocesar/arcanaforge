import { useFichaContext } from '../../../contexts/FichaContext';
import { calcLimiteCarga, calcCargaUsada } from '../../../utils/calculations';
import { EQUIP_ICONS } from '../../../data/constants';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import styles from './Inventario.module.css';

export default function Inventario() {
  const { ficha, updateFicha } = useFichaContext();

  if (!ficha) return null;

  const limiteCarga = calcLimiteCarga(ficha);
  const cargaUsada = calcCargaUsada(ficha);
  const cargaMax = limiteCarga * 2;

  const setMoeda = (key: 'tc' | 'tp' | 'to', val: number) => {
    updateFicha((f) => ({ ...f, moedas: { ...f.moedas, [key]: val } }));
  };

  const addItem = () => {
    updateFicha((f) => ({
      ...f,
      inventario: [...f.inventario, { nome: '', quantidade: 1, carga: 0 }],
    }));
  };

  const removeItem = (idx: number) => {
    updateFicha((f) => ({
      ...f,
      inventario: f.inventario.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx: number, key: string, value: string | number) => {
    updateFicha((f) => {
      const inventario = [...f.inventario];
      inventario[idx] = { ...inventario[idx], [key]: value };
      return { ...f, inventario };
    });
  };

  const updateEquip = (idx: number, nome: string) => {
    updateFicha((f) => {
      const equipados = [...f.equipados];
      equipados[idx] = { nome };
      return { ...f, equipados };
    });
  };

  return (
    <Section id="secInventario" title="Inventário">
      <div className={styles.stats}>
        <span>Limite de Carga: <strong>{limiteCarga}</strong></span>
        <span>Carga Usada: <strong>{cargaUsada}</strong></span>
        <span>Carga Máx: <strong>{cargaMax}</strong></span>
        <div className={styles.moedas}>
          <label>TC</label>
          <input
            type="number"
            className={styles.moedaInput}
            value={ficha.moedas.tc}
            onChange={(e) => setMoeda('tc', Number(e.target.value) || 0)}
          />
          <label>T$</label>
          <input
            type="number"
            className={styles.moedaInput}
            value={ficha.moedas.tp}
            onChange={(e) => setMoeda('tp', Number(e.target.value) || 0)}
          />
          <label>TO</label>
          <input
            type="number"
            className={styles.moedaInput}
            value={ficha.moedas.to}
            onChange={(e) => setMoeda('to', Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.colEsq}>
          <div className={styles.itemHeader}>
            <span>Itens</span>
            <span>Qtd</span>
            <span>Espaço</span>
            <span></span>
          </div>
          {ficha.inventario.map((item, i) => (
            <div key={i} className={styles.item}>
              <input
                type="text"
                value={item.nome}
                onChange={(e) => updateItem(i, 'nome', e.target.value)}
                placeholder="Nome do item"
              />
              <input
                type="number"
                value={item.quantidade}
                onChange={(e) => updateItem(i, 'quantidade', Number(e.target.value) || 1)}
              />
              <input
                type="number"
                value={item.carga}
                onChange={(e) => updateItem(i, 'carga', Number(e.target.value) || 0)}
              />
              <Button variant="remove-sm" onClick={() => removeItem(i)}>✕</Button>
            </div>
          ))}
          <Button variant="add" onClick={addItem}>+ Item</Button>
        </div>

        <div className={styles.colDir}>
          <h3>Equipados <span className={styles.equipLimit}>(máx 4)</span></h3>
          {ficha.equipados.slice(0, 4).map((eq, i) => (
            <div
              key={i}
              className={`${styles.equipSlot} ${eq.nome ? styles.preenchido : ''}`}
            >
              <span className={styles.equipIcon}>{EQUIP_ICONS[i]}</span>
              <input
                type="text"
                value={eq.nome}
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
