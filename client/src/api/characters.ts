import type { Character, CharacterSummary } from '../types/character';
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

export async function apiUploadAvatar(
  id: string,
  file: File,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append('avatar', file);
  const res = await apiFetch(`/api/avatar/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: form,
  });
  await assertOk(res);
  return res.json();
}

export async function apiAvatarTransparent(id: string): Promise<string | null> {
  const res = await apiFetch(`/api/avatar-transparent/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.url || null;
}
