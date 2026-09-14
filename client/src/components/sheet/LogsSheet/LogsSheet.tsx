import { useCharacterContext } from '../../../contexts/CharacterContext';
import { LOG_ICONS } from '../../../data/constants';
import Sheet from '../../ui/Sheet/Sheet';
import styles from './LogsSheet.module.css';

interface LogsSheetProps {
  open: boolean;
  onClose: () => void;
}

function typeClass(type: string): string {
  if (type === 'attack' || type === 'damage') return styles.typeAttack;
  if (type === 'spell') return styles.typeSpell;
  if (type === 'buff_on' || type === 'rest') return styles.typeBuffOn;
  if (type === 'buff_off') return styles.typeBuffOff;
  return '';
}

function formatDetails(details: unknown): string | null {
  if (!details) return null;
  if (typeof details === 'string') return details;
  if (typeof details === 'object') {
    const d = details as Record<string, unknown>;
    // Dano recebido (TakeDamageSheet): bruto, tipo, RD somada, líquido e o que saiu do temporário.
    if (d.net != null) {
      const parts = [`Dano ${d.amount}${d.damageType ? ` de ${String(d.damageType).toLowerCase()}` : ''}`];
      if (Number(d.rdTotal) > 0) parts.push(`RD ${d.rdTotal}`);
      parts.push(`Líquido ${d.net}`);
      if (Number(d.fromTemp) > 0) parts.push(`${d.fromTemp} do temporário`);
      return parts.join(' · ');
    }
    const parts: string[] = [];
    const rangeType = d.rangeType ?? d.custoTipo;
    const attackRoll = d.attackRoll ?? d.teste;
    const damage = d.damage ?? d.dano;
    const modifiers = d.modifiers;
    if (rangeType) parts.push(String(rangeType));
    if (attackRoll != null) parts.push(`Teste: ${attackRoll}`);
    if (damage) parts.push(`Dano: ${damage}`);
    if (Array.isArray(modifiers) && modifiers.length > 0) {
      parts.push(`Modificadores: ${modifiers.join(', ')}`);
    }
    return parts.join(' · ') || null;
  }
  return String(details);
}

function formatTimestamp(ts: unknown): string {
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'number') return new Date(ts).toLocaleTimeString();
  return '';
}

function LogsSheet({ open, onClose }: LogsSheetProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  const logs = character.logs ?? [];

  const clearLogs = () => updateCharacter((f) => ({ ...f, logs: [] }));

  const footer = !readOnly && logs.length > 0 ? (
    <button type="button" className={styles.btnClear} onClick={clearLogs}>
      Limpar Logs
    </button>
  ) : undefined;

  return (
    <Sheet open={open} onClose={onClose} title="Histórico" footer={footer}>
      {logs.length === 0 ? (
        <p className={styles.empty}>Nenhum registro ainda.</p>
      ) : (
        <div className={styles.list}>
          {[...logs].reverse().map((log, i) => {
            const detailsText = formatDetails(log.details);
            return (
              <div key={i} className={styles.entry}>
                <div className={styles.entryHeader}>
                  <span className={`${styles.icon} ${typeClass(log.type)}`}>
                    {LOG_ICONS[log.type] || '•'}
                  </span>
                  <span className={styles.name}>{log.name}</span>
                  {log.mpSpent > 0 && <span className={styles.pm}>-{log.mpSpent} PM</span>}
                  <span className={styles.time}>{formatTimestamp(log.timestamp)}</span>
                </div>
                {detailsText && <div className={styles.details}>{detailsText}</div>}
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

LogsSheet.displayName = 'LogsSheet';

export default LogsSheet;
