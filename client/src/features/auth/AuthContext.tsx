import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setAuthConfig } from '../../api/http';
import { auth } from './firebase';
import {
  getCurrentUserToken,
  getGoogleRedirectResult,
  refreshUser,
  resendVerification,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from './services/authService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  requiresEmailVerification: boolean;
  signInGoogle: () => Promise<void>;
  signInPassword: (email: string, password: string) => Promise<void>;
  signUpPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  refreshSessionUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function userRequiresEmailVerification(user: User | null): boolean {
  if (!user) return false;
  const hasPasswordProvider = user.providerData.some((p) => p.providerId === 'password');
  return hasPasswordProvider && !user.emailVerified;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    getGoogleRedirectResult().catch(() => undefined);
  }, []);

  useEffect(() => {
    setAuthConfig({
      getToken: getCurrentUserToken,
      onUnauthorized: async () => {
        await signOutUser().catch(() => undefined);
        if (window.location.pathname !== '/auth') {
          window.location.assign('/auth');
        }
      },
    });
  }, []);

  const signInGoogleHandler = useCallback(async () => {
    return signInWithGoogle();
  }, []);

  const signInPasswordHandler = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password);
  }, []);

  const signUpPasswordHandler = useCallback(async (email: string, password: string) => {
    await signUpWithEmail(email, password);
  }, []);

  const signOutHandler = useCallback(async () => {
    await signOutUser();
  }, []);

  const resendEmailVerificationHandler = useCallback(async () => {
    if (!auth.currentUser) return;
    await resendVerification(auth.currentUser);
  }, []);

  const refreshSessionUserHandler = useCallback(async () => {
    if (!auth.currentUser) return;
    const refreshed = await refreshUser(auth.currentUser);
    setUser(refreshed);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const requiresEmailVerification = userRequiresEmailVerification(user);
    return {
      user,
      loading,
      isAuthenticated: !!user,
      requiresEmailVerification,
      signInGoogle: signInGoogleHandler,
      signInPassword: signInPasswordHandler,
      signUpPassword: signUpPasswordHandler,
      signOut: signOutHandler,
      resendEmailVerification: resendEmailVerificationHandler,
      refreshSessionUser: refreshSessionUserHandler,
    };
  }, [
    user,
    loading,
    signInGoogleHandler,
    signInPasswordHandler,
    signUpPasswordHandler,
    signOutHandler,
    resendEmailVerificationHandler,
    refreshSessionUserHandler,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
