import { useFichaContext } from '../../../contexts/FichaContext';
import { PERICIAS_CONFIG } from '../../../data/pericias';
import { ATRIBUTOS_NOME } from '../../../data/atributos';
import { getNivelTotal, calcTotalPericia, formatMod } from '../../../utils/calculations';
import type { AtributoId } from '../../../types/ficha';
import styles from './PericiasList.module.css';

const ATTR_OPTIONS: AtributoId[] = ['for', 'des', 'con', 'int', 'sab', 'car'];

export default function PericiasList() {
  const { ficha, updateFicha } = useFichaContext();

  if (!ficha) return null;

  const metadeNivel = Math.floor(getNivelTotal(ficha) / 2);

  const toggleTreinado = (id: string) => {
    updateFicha((f) => ({
      ...f,
      pericias: {
        ...f.pericias,
        [id]: { ...f.pericias[id], treinado: !f.pericias[id]?.treinado },
      },
    }));
  };

  const setOutros = (id: string, val: number) => {
    updateFicha((f) => ({
      ...f,
      pericias: {
        ...f.pericias,
        [id]: { ...f.pericias[id], outros: val },
      },
    }));
  };

  const setAtributo = (id: string, attr: AtributoId) => {
    updateFicha((f) => ({
      ...f,
      pericias: {
        ...f.pericias,
        [id]: { ...f.pericias[id], atributo: attr },
      },
    }));
  };

  const setLabel = (id: string, label: string) => {
    updateFicha((f) => ({
      ...f,
      pericias: {
        ...f.pericias,
        [id]: { ...f.pericias[id], label },
      },
    }));
  };

  return (
    <div>
      <div className={styles.headerInfo}>
        ½ Nível: <strong>{metadeNivel}</strong> &nbsp;|&nbsp; Bônus de Treinamento: <strong>+2</strong>
      </div>
      <div className={styles.grid}>
        {PERICIAS_CONFIG.map((cfg) => {
          const per = ficha.pericias[cfg.id] || { treinado: false, outros: 0 };
          const total = calcTotalPericia(ficha, cfg.id);
          const attrUsado = (per.atributo || cfg.atributo) as AtributoId;
          const isCustomAttr = !!per.atributo && per.atributo !== cfg.atributo;
          const rowCls = [
            styles.row,
            per.treinado ? styles.treinadoAtivo : '',
            cfg.treinado && !per.treinado ? styles.somenteTreinado : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={cfg.id} className={rowCls}>
              <input
                type="checkbox"
                className={styles.check}
                checked={per.treinado}
                onChange={() => toggleTreinado(cfg.id)}
              />
              {cfg.customLabel ? (
                <input
                  className={styles.labelCustom}
                  value={per.label || ''}
                  onChange={(e) => setLabel(cfg.id, e.target.value)}
                  placeholder={cfg.nome}
                />
              ) : (
                <span className={styles.nome}>{cfg.nome}</span>
              )}
              <select
                className={`${styles.attrSelect} ${isCustomAttr ? styles.attrCustom : ''}`}
                value={attrUsado}
                onChange={(e) => setAtributo(cfg.id, e.target.value as AtributoId)}
              >
                {ATTR_OPTIONS.map((a) => (
                  <option key={a} value={a}>{ATRIBUTOS_NOME[a]}</option>
                ))}
              </select>
              <input
                type="number"
                className={styles.outros}
                value={per.outros || 0}
                onChange={(e) => setOutros(cfg.id, Number(e.target.value) || 0)}
              />
              <span className={styles.total}>{formatMod(total)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
