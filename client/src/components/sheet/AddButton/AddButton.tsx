import styles from './AddButton.module.css';

interface AddButtonProps {
  label: string;
  onClick: () => void;
}

/** Compact "+ label" action used in section headers to open a create form. */
function AddButton({ label, onClick }: AddButtonProps) {
  return (
    <button type="button" className={styles.add} onClick={onClick}>
      <span className={styles.plus} aria-hidden="true">+</span>
      {label}
    </button>
  );
}

AddButton.displayName = 'AddButton';

export default AddButton;
