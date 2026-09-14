import styles from './AuthLoading.module.css';

export default function AuthLoading({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
