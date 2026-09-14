import type { Character, CharacterSummary } from '../types/character';
import { uploadCharacterAvatar } from '../services/avatarStorage';
import { apiFetch, assertOk } from './http';

export async function apiFetchCharacters(): Promise<string[]> {
  const res = await apiFetch('/api/characters');
  await assertOk(res);
  return res.json();
}

export async function apiFetchCharacterSummaries(): Promise<CharacterSummary[]> {
  const res = await apiFetch('/api/characters/summary');
  await assertOk(res);
  return res.json();
}

export async function apiLoadCharacter(id: string): Promise<Character | null> {
  const res = await apiFetch(`/api/characters/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  await assertOk(res);
  return res.json();
}

export async function apiSaveCharacter(id: string, data: Character): Promise<void> {
  const res = await apiFetch(`/api/characters/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
}

export async function apiDeleteCharacter(id: string): Promise<void> {
  const res = await apiFetch(`/api/characters/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await assertOk(res);
}

export async function apiRestoreCharacter(id: string): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/api/characters/${encodeURIComponent(id)}/restore`, { method: 'POST' });
  await assertOk(res);
  return res.json();
}

export async function apiUploadAvatar(id: string, file: File): Promise<{ url: string }> {
  const url = await uploadCharacterAvatar(id, file);
  return { url };
}
