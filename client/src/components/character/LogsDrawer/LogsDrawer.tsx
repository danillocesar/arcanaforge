import { useCharacterContext } from '../../../contexts/CharacterContext';
import { LOG_ICONS } from '../../../data/constants';
import Button from '../../ui/Button/Button';
import styles from './LogsDrawer.module.css';

function typeClass(type: string): string {
  if (type === 'attack') return styles.typeAttack;
  if (type === 'spell') return styles.typeSpell;
  if (type === 'buff_on') return styles.tipoBuffOn;
  if (type === 'buff_off') return styles.tipoBuffOff;
  return '';
}

function formatDetails(details: unknown): string | null {
  if (!details) return null;
  if (typeof details === 'string') return details;
  if (typeof details === 'object') {
    const d = details as Record<string, unknown>;
    const parts: string[] = [];
    if (d.custoTipo) parts.push(String(d.custoTipo));
    if (d.teste != null) parts.push(`Teste: ${d.teste}`);
    if (d.dano) parts.push(`Dano: ${d.dano}`);
    return parts.join(' · ') || null;
  }
  return String(details);
}

function formatTimestamp(ts: unknown): string {
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'number') return new Date(ts).toLocaleTimeString();
  return '';
}

export default function LogsDrawer() {
  const { character, updateCharacter } = useCharacterContext();

  if (!character) return null;

  const clearLogs = () => {
    updateCharacter((f) => ({ ...f, logs: [] }));
  };

  if (character.logs.length === 0) {
    return <div className={styles.empty}>Nenhum registro ainda.</div>;
  }

  return (
    <div>
      <Button variant="add" onClick={clearLogs}>Limpar Logs</Button>
      {[...character.logs].reverse().map((log, i) => {
        const detailsText = formatDetails(log.details);
        return (
          <div key={i} className={styles.entry}>
            <div className={styles.entryHeader}>
              <span className={`${styles.icon} ${typeClass(log.type)}`}>
                {LOG_ICONS[log.type] || '•'}
              </span>
              <span className={styles.nome}>{log.name}</span>
              {log.mpSpent > 0 && (
                <span className={styles.pm}>-{log.mpSpent} PM</span>
              )}
              <span className={styles.time}>
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
            {detailsText && (
              <div className={styles.details}>{detailsText}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
