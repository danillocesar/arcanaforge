import { useState, useEffect } from 'react';
import { useFichaContext } from '../../../contexts/FichaContext';
import Modal from '../../ui/Modal/Modal';
import { getNivelTotal } from '../../../utils/calculations';
import { playMagicSound } from '../../../utils/sounds';
import { triggerAttackAnim, type AnimacaoEstilo } from '../../../utils/animations';
import styles from './ModalConjurar.module.css';

interface ModalConjurarProps {
  magiaIdx: number | null;
  onClose: () => void;
}

export default function ModalConjurar({ magiaIdx, onClose }: ModalConjurarProps) {
  const { ficha, updateFicha } = useFichaContext();
  const [selecionados, setSelecionados] = useState<boolean[]>([]);

  const magia = ficha && magiaIdx !== null ? ficha.magias[magiaIdx] : null;
  const aprimoramentos = magia && Array.isArray(magia.aprimoramentos)
    ? magia.aprimoramentos
    : [];

  useEffect(() => {
    if (magia) {
      setSelecionados(new Array(aprimoramentos.length).fill(false));
    }
  }, [magiaIdx]);

  if (!ficha || !magia) return null;

  const custoBase = Number(magia.custoPM) || 0;
  const custoApri = aprimoramentos.reduce(
    (sum, apr, i) => selecionados[i] ? sum + (Number(apr.custoPM) || 0) : sum,
    0,
  );
  const custoTotal = custoBase + custoApri;
  const nivel = getNivelTotal(ficha);

  const confirmar = () => {
    const aprSelecionados = aprimoramentos
      .filter((_, i) => selecionados[i])
      .map(apr => ({ desc: apr.descricao || 'Aprimoramento', pm: Number(apr.custoPM) || 0 }));

    updateFicha(f => ({
      ...f,
      pm: { ...f.pm, atual: Math.max(0, f.pm.atual - custoTotal) },
      logs: [
        ...f.logs,
        {
          tipo: 'magia',
          nome: magia.nome || 'Magia',
          pmGasto: custoTotal,
          timestamp: Date.now(),
          detalhes: { custoPMBase: custoBase, aprimoramentos: aprSelecionados, custoTotal },
        },
      ],
    }));
    playMagicSound();
    const estilo = (ficha?.animacaoAtaque || 'personagem') as AnimacaoEstilo;
    triggerAttackAnim(estilo, {
      tipo: 'magic',
      nome: magia.nome || 'Magia',
      pmCusto: custoTotal,
    });
    onClose();
  };

  const toggleAprimoramento = (i: number) => {
    const next = [...selecionados];
    next[i] = !next[i];
    setSelecionados(next);
  };

  return (
    <Modal open onClose={onClose}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>✨ {magia.nome || 'Magia'}</h3>
          <button className={styles.closeBtn} onClick={onClose} title="Fechar">✕</button>
        </div>
        <div className={styles.body}>
          <div className={styles.baseCost}>
            <span className={styles.baseLabel}>Custo Base</span>
            <span className={styles.baseVal}>{custoBase} PM</span>
          </div>

          {aprimoramentos.length > 0 && (
            <div className={styles.aprListHeader}>Aprimoramentos</div>
          )}

          <div className={styles.aprList}>
            {aprimoramentos.length > 0 ? (
              aprimoramentos.map((apr, i) => (
                <label key={i} className={styles.aprItem}>
                  <input
                    type="checkbox"
                    checked={selecionados[i] || false}
                    onChange={() => toggleAprimoramento(i)}
                  />
                  <span className={styles.aprDesc}>
                    {apr.descricao || `Aprimoramento ${i + 1}`}
                  </span>
                  <span className={styles.aprPmBadge}>+{Number(apr.custoPM) || 0} PM</span>
                </label>
              ))
            ) : (
              <p className={styles.aprEmpty}>Nenhum aprimoramento cadastrado.</p>
            )}
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Custo Total</span>
            <span className={styles.totalVal}>{custoTotal} PM</span>
          </div>

          {custoTotal > nivel && (
            <div className={styles.warn}>
              Custo excede o nível do personagem ({nivel})
            </div>
          )}

          <div className={styles.info}>
            <span>PM atual: <strong>{ficha.pm.atual}</strong></span>
            <span>Nível: <strong>{nivel}</strong></span>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button className={styles.confirmBtn} onClick={confirmar}>✨ Conjurar</button>
        </div>
      </div>
    </Modal>
  );
}
