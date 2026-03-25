import type { Ficha } from '../types/ficha';
import type { CombateData } from '../types/combate';

export async function apiFetchFichas(): Promise<string[]> {
  const res = await fetch('/api/fichas');
  return res.json();
}

export async function apiFetchFichasResumo(): Promise<
  { nome: string; avatar: string; classes: { nome: string; nivel: number }[] }[]
> {
  const res = await fetch('/api/fichas-resumo');
  return res.json();
}

export async function apiLoadFicha(nome: string): Promise<Ficha | null> {
  const res = await fetch(`/api/fichas/${encodeURIComponent(nome)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function apiSaveFicha(nome: string, data: Ficha): Promise<void> {
  await fetch(`/api/fichas/${encodeURIComponent(nome)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function apiDeleteFicha(nome: string): Promise<void> {
  await fetch(`/api/fichas/${encodeURIComponent(nome)}`, { method: 'DELETE' });
}

export async function apiRenomear(nomeAntigo: string, nomeNovo: string): Promise<void> {
  await fetch(
    `/api/fichas/${encodeURIComponent(nomeAntigo)}/renomear/${encodeURIComponent(nomeNovo)}`,
    { method: 'POST' },
  );
}

export async function apiLoadCombate(): Promise<CombateData> {
  const res = await fetch('/api/combate');
  return res.json();
}

export async function apiSaveCombate(data: CombateData): Promise<void> {
  await fetch('/api/combate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function apiUploadAvatar(
  nome: string,
  file: File,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch(`/api/avatar/${encodeURIComponent(nome)}`, {
    method: 'POST',
    body: form,
  });
  return res.json();
}

export async function apiAvatarSemFundo(
  nome: string,
): Promise<string | null> {
  const res = await fetch(`/api/avatar-sem-fundo/${encodeURIComponent(nome)}`);
  const data = await res.json();
  return data.url || null;
}
