import type { CombateData } from '../types/combate';
import { apiFetch, assertOk } from './http';

export async function apiLoadCombate(partyId?: string): Promise<CombateData> {
  const url = partyId ? `/api/combate/${encodeURIComponent(partyId)}` : '/api/combate';
  const res = await apiFetch(url);
  await assertOk(res);
  return res.json();
}

export async function apiSaveCombate(data: CombateData, partyId?: string): Promise<void> {
  const url = partyId ? `/api/combate/${encodeURIComponent(partyId)}` : '/api/combate';
  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
}
