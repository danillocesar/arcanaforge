import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import VerifyEmailNotice from './VerifyEmailNotice';
import { useAuth } from '../useAuth';

export default function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, loading, requiresEmailVerification } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ returnTo: `${location.pathname}${location.search}` }} />;
  }

  if (requiresEmailVerification) {
    return <VerifyEmailNotice />;
  }

  return children;
}
