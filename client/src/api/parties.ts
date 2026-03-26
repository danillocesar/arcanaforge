import type { SistemaRPG } from '../types/ficha';
import type { Party } from '../types/combate';
import { assertOk } from './http';

export async function apiFetchParties(): Promise<Party[]> {
  const res = await fetch('/api/parties');
  await assertOk(res);
  return res.json();
}

export async function apiCreateParty(data: {
  nome: string;
  sistema: SistemaRPG;
  membros: string[];
}): Promise<Party> {
  const res = await fetch('/api/parties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  return res.json();
}

export async function apiUpdateParty(id: string, data: Partial<Party>): Promise<Party> {
  const res = await fetch(`/api/parties/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  return res.json();
}

export async function apiDeleteParty(id: string): Promise<void> {
  const res = await fetch(`/api/parties/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await assertOk(res);
}
