import styles from './Chip.module.css';

type ChipVariant = 'buff' | 'warn' | 'danger';

interface ChipProps {
  label: string;
  title?: string;
  active?: boolean;
  variant?: ChipVariant;
  onToggle?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  className?: string;
}

const variantMap: Record<ChipVariant, string> = {
  buff: '',
  warn: styles.surge,
  danger: styles.bleed,
};

function Chip({
  label,
  title,
  active = false,
  variant = 'buff',
  onToggle,
  onEdit,
  onRemove,
  className,
}: ChipProps) {
  const cls = [styles.chip, variantMap[variant], active ? styles.on : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} title={title} aria-pressed={active} onClick={onToggle}>
      {label}
      {onEdit && (
        <span
          role="button"
          tabIndex={0}
          className={styles.aff}
          aria-label="Editar"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              onEdit();
            }
          }}
        >
          ✎
        </span>
      )}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          className={styles.aff}
          aria-label="Remover"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              onRemove();
            }
          }}
        >
          ✕
        </span>
      )}
    </button>
  );
}

Chip.displayName = 'Chip';

export default Chip;
