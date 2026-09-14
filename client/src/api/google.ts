import { apiFetch, assertOk } from './http';

export interface GoogleLinkState {
  linked: boolean;
  email: string;
  lastError: string | null;
}

export async function apiGetGoogleLink(): Promise<GoogleLinkState> {
  const res = await apiFetch('/api/google/link');
  await assertOk(res);
  return res.json();
}

export async function apiStartGoogleOAuth(returnTo: string): Promise<{ url: string }> {
  const res = await apiFetch(`/api/google/oauth/start?returnTo=${encodeURIComponent(returnTo)}`);
  await assertOk(res);
  return res.json();
}

export async function apiUnlinkGoogle(): Promise<void> {
  const res = await apiFetch('/api/google/link', { method: 'DELETE' });
  await assertOk(res);
}
