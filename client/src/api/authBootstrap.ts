import { setAuthConfig } from './http';
import { getCurrentUserToken, signOutUser } from '../features/auth/services/authService';

let configured = false;

export function configureApiAuth(): void {
  if (configured) return;
  configured = true;

  setAuthConfig({
    getToken: getCurrentUserToken,
    onUnauthorized: async () => {
      await signOutUser().catch(() => undefined);
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.assign('/auth');
      }
    },
  });
}

configureApiAuth();
