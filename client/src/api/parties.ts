import type { RPGSystem } from '../types/character';
import type { Party } from '../types/party';
import type { CombatData } from '../types/combat';
import type { CharacterSummary } from '../types/character';
import { apiFetch, assertOk } from './http';

export async function apiFetchParties(): Promise<Party[]> {
  const res = await apiFetch('/api/parties');
  await assertOk(res);
  return res.json();
}

export async function apiCreateParty(data: {
  name: string;
  system: RPGSystem;
}): Promise<Party> {
  const res = await apiFetch('/api/parties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  return res.json();
}

export async function apiUpdateParty(id: string, data: Partial<Pick<Party, 'name' | 'system'>>): Promise<Party> {
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

export async function apiJoinParty(code: string): Promise<Party> {
  const res = await apiFetch('/api/parties/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  await assertOk(res);
  return res.json();
}

export async function apiAddCharacterToParty(partyId: string, characterId: string): Promise<Party> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/add-character`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId }),
  });
  await assertOk(res);
  return res.json();
}

export async function apiRemoveCharacterFromParty(partyId: string, characterId: string): Promise<Party> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/remove-character`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId }),
  });
  await assertOk(res);
  return res.json();
}

export async function apiLeaveParty(partyId: string): Promise<void> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/leave`, {
    method: 'POST',
  });
  await assertOk(res);
}

export async function apiRemovePartyMember(partyId: string, uid: string): Promise<Party> {
  const res = await apiFetch(
    `/api/parties/${encodeURIComponent(partyId)}/members/${encodeURIComponent(uid)}`,
    { method: 'DELETE' },
  );
  await assertOk(res);
  return res.json();
}

export async function apiRegenerateInviteCode(partyId: string): Promise<Party> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/regenerate-code`, {
    method: 'POST',
  });
  await assertOk(res);
  return res.json();
}

export interface PartyCharacter extends CharacterSummary {
  hp?: { max?: number; current?: number };
  mp?: { max?: number; current?: number };
  clan?: string;
}

export async function apiFetchPartyCharacters(partyId: string): Promise<PartyCharacter[]> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/characters`);
  await assertOk(res);
  return res.json();
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
