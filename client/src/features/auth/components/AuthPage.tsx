import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import { useAuth } from '../useAuth';
import VerifyEmailNotice from './VerifyEmailNotice';
import styles from './AuthPage.module.css';

type Mode = 'login' | 'signup';

interface AuthLocationState {
  returnTo?: string;
}

const AUTH_RETURN_KEY = 'arcanaforge_auth_return';

function firebaseMessage(err: unknown): string {
  if (!err || typeof err !== 'object' || !('code' in err)) {
    return 'Não foi possível concluir a autenticação.';
  }
  const code = String((err as { code: string }).code);
  if (code.includes('invalid-credential')) return 'Credenciais inválidas.';
  if (code.includes('email-already-in-use')) return 'Este e-mail já está em uso.';
  if (code.includes('weak-password')) return 'A senha deve ter no mínimo 6 caracteres.';
  if (code.includes('popup-closed-by-user')) return 'Login com Google cancelado.';
  if (code.includes('cancelled-popup-request')) return 'Tentativa anterior cancelada. Tente novamente.';
  if (code.includes('popup-blocked')) return 'Seu navegador bloqueou o popup. Tente novamente.';
  if (code.includes('too-many-requests')) return 'Muitas tentativas. Tente novamente em alguns minutos.';
  return 'Não foi possível concluir a autenticação.';
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, requiresEmailVerification, signInGoogle, signInPassword, signUpPassword } =
    useAuth();

  const state = (location.state ?? {}) as AuthLocationState;
  const returnTo = useMemo(() => {
    if (state.returnTo) return state.returnTo;
    try {
      const stored = sessionStorage.getItem(AUTH_RETURN_KEY);
      if (stored) return stored;
    } catch {
      /* ignore */
    }
    return '/personagens';
  }, [state.returnTo]);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      try {
        sessionStorage.removeItem(AUTH_RETURN_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [isAuthenticated]);

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }} />;
  }

  if (isAuthenticated && !requiresEmailVerification) {
    return <Navigate to={returnTo} replace />;
  }

  if (isAuthenticated && requiresEmailVerification) {
    return <VerifyEmailNotice />;
  }

  async function handleGoogle() {
    try {
      setBusy(true);
      setError('');
      try {
        sessionStorage.setItem(AUTH_RETURN_KEY, returnTo);
      } catch {
        /* ignore */
      }
      await signInGoogle();
    } catch (err) {
      setError(firebaseMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }

    if (mode === 'signup' && password !== passwordConfirm) {
      setError('As senhas não conferem.');
      return;
    }

    try {
      setBusy(true);
      if (mode === 'login') {
        await signInPassword(email.trim(), password);
        navigate(returnTo, { replace: true });
      } else {
        await signUpPassword(email.trim(), password);
      }
    } catch (err) {
      setError(firebaseMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img
          src="/assets/transparent-logo.svg"
          alt="ArcanaForge"
          className={styles.logo}
          loading="eager"
        />
        <h1 className={styles.title}>{mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}</h1>
        <p className={styles.subtitle}>
          {mode === 'login' ? 'Entre para continuar no Arcana Forge' : 'Preencha os dados para começar.'}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          {mode === 'signup' && (
            <Input
              type="password"
              placeholder="Confirmar senha"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          )}
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" variant="primary" disabled={busy}>
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <Button type="button" className={styles.googleBtn} onClick={handleGoogle} disabled={busy}>
          <span className={styles.googleIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.29h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.57-5.15 3.57-8.64Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.86-3c-1.07.72-2.43 1.14-4.08 1.14-3.14 0-5.8-2.12-6.75-4.97H1.25v3.09A12 12 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.25 14.26A7.2 7.2 0 0 1 4.87 12c0-.78.13-1.54.38-2.26V6.65H1.25A12 12 0 0 0 0 12c0 1.94.46 3.78 1.25 5.35l4-3.09Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.77c1.76 0 3.33.6 4.56 1.79l3.42-3.42C17.94 1.13 15.23 0 12 0A12 12 0 0 0 1.25 6.65l4 3.09c.95-2.85 3.61-4.97 6.75-4.97Z"
              />
            </svg>
          </span>
          <span>Continuar com Google</span>
        </Button>

        {mode === 'login' ? (
          <p className={styles.authFooter}>
            Não tem uma conta?{' '}
            <button
              type="button"
              className={styles.linkInline}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              Inscrever-se
            </button>
          </p>
        ) : (
          <>
            <p className={styles.notice}>
              Depois do cadastro, você precisará confirmar seu e-mail para acessar o sistema.
            </p>
            <p className={styles.authFooter}>
              Já tem uma conta?{' '}
              <button
                type="button"
                className={styles.linkInline}
                onClick={() => {
                  setMode('login');
                  setPasswordConfirm('');
                  setError('');
                }}
              >
                Entrar
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
