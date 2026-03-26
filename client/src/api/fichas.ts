import type { Ficha, FichaResumo } from '../types/ficha';
import { apiFetch, assertOk } from './http';

export async function apiFetchFichas(): Promise<string[]> {
  const res = await apiFetch('/api/fichas');
  await assertOk(res);
  return res.json();
}

export async function apiFetchFichasResumo(): Promise<FichaResumo[]> {
  const res = await apiFetch('/api/fichas-resumo');
  await assertOk(res);
  return res.json();
}

export async function apiLoadFicha(id: string): Promise<Ficha | null> {
  const res = await apiFetch(`/api/fichas/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  await assertOk(res);
  return res.json();
}

export async function apiSaveFicha(id: string, data: Ficha): Promise<void> {
  const res = await apiFetch(`/api/fichas/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
}

export async function apiDeleteFicha(id: string): Promise<void> {
  const res = await apiFetch(`/api/fichas/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

export async function apiAvatarSemFundo(id: string): Promise<string | null> {
  const res = await apiFetch(`/api/avatar-sem-fundo/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.url || null;
}
