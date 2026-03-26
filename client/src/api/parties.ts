import type { RPGSystem } from '../types/character';
import type { Party } from '../types/party';
import type { CombatData } from '../types/combat';
import { apiFetch, assertOk } from './http';

export async function apiFetchParties(): Promise<Party[]> {
  const res = await apiFetch('/api/parties');
  await assertOk(res);
  return res.json();
}

export async function apiCreateParty(data: {
  name: string;
  system: RPGSystem;
  members: string[];
}): Promise<Party> {
  const res = await apiFetch('/api/parties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  return res.json();
}

export async function apiUpdateParty(id: string, data: Partial<Party>): Promise<Party> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  return res.json();
}

export async function apiDeleteParty(id: string): Promise<void> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await assertOk(res);
}

export async function apiLoadCombat(partyId: string): Promise<CombatData> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/combat`);
  await assertOk(res);
  return res.json();
}

export async function apiSaveCombat(partyId: string, data: CombatData): Promise<void> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/combat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
}
