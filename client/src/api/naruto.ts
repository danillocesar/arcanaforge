import { apiFetch, assertOk } from './http';

export interface NarutoClanOption {
  id: string;
  name: string;
  icon: string;
  system: string;
  active: boolean;
}

export async function apiFetchNarutoClans(): Promise<NarutoClanOption[]> {
  const res = await apiFetch('/api/naruto/clans');
  await assertOk(res);
  return res.json();
}
