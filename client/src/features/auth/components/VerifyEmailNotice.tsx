import Button from '../../../components/ui/Button/Button';
import { useAuth } from '../useAuth';
import styles from './VerifyEmailNotice.module.css';

export default function VerifyEmailNotice() {
  const { user, resendEmailVerification, refreshSessionUser, signOut } = useAuth();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Confirme seu e-mail</h1>
        <p className={styles.text}>
          Enviamos um link de confirmação para <strong>{user?.email}</strong>.
          {' '}Após confirmar, clique em atualizar para liberar o acesso.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => refreshSessionUser()}>
            Já confirmei, atualizar
          </Button>
          <Button variant="ghost" onClick={() => resendEmailVerification()}>
            Reenviar e-mail
          </Button>
          <Button variant="ghost" onClick={() => signOut()}>
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
