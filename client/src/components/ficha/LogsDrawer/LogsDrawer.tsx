import { useFichaContext } from '../../../contexts/FichaContext';
import { LOG_ICONS } from '../../../data/constants';
import Button from '../../ui/Button/Button';
import styles from './LogsDrawer.module.css';

function tipoClass(tipo: string): string {
  if (tipo === 'ataque') return styles.tipoAtaque;
  if (tipo === 'magia') return styles.tipoMagia;
  if (tipo === 'buff_on') return styles.tipoBuffOn;
  if (tipo === 'buff_off') return styles.tipoBuffOff;
  return '';
}

function formatDetalhes(detalhes: unknown): string | null {
  if (!detalhes) return null;
  if (typeof detalhes === 'string') return detalhes;
  if (typeof detalhes === 'object') {
    const d = detalhes as Record<string, unknown>;
    const parts: string[] = [];
    if (d.custoTipo) parts.push(String(d.custoTipo));
    if (d.teste != null) parts.push(`Teste: ${d.teste}`);
    if (d.dano) parts.push(`Dano: ${d.dano}`);
    return parts.join(' · ') || null;
  }
  return String(detalhes);
}

function formatTimestamp(ts: unknown): string {
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'number') return new Date(ts).toLocaleTimeString();
  return '';
}

export default function LogsDrawer() {
  const { ficha, updateFicha } = useFichaContext();

  if (!ficha) return null;

  const clearLogs = () => {
    updateFicha((f) => ({ ...f, logs: [] }));
  };

  if (ficha.logs.length === 0) {
    return <div className={styles.empty}>Nenhum registro ainda.</div>;
  }

  return (
    <div>
      <Button variant="add" onClick={clearLogs}>Limpar Logs</Button>
      {[...ficha.logs].reverse().map((log, i) => {
        const detalhesText = formatDetalhes(log.detalhes);
        return (
          <div key={i} className={styles.entry}>
            <div className={styles.entryHeader}>
              <span className={`${styles.icon} ${tipoClass(log.tipo)}`}>
                {LOG_ICONS[log.tipo] || '•'}
              </span>
              <span className={styles.nome}>{log.nome}</span>
              {log.pmGasto > 0 && (
                <span className={styles.pm}>-{log.pmGasto} PM</span>
              )}
              <span className={styles.time}>
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
            {detalhesText && (
              <div className={styles.detalhes}>{detalhesText}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
