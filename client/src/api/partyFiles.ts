import type { PartyFile } from '../types/partyFile';
import { apiFetch, assertOk } from './http';

export async function apiFetchPartyFiles(partyId: string): Promise<PartyFile[]> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/files`);
  await assertOk(res);
  return res.json();
}

/** Só o mestre do grupo pode enviar; o server responde 403 para os demais. */
export async function apiUploadPartyFile(partyId: string, file: File): Promise<PartyFile> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/files`, {
    method: 'POST',
    body: formData,
  });
  await assertOk(res);
  return res.json();
}

export async function apiDeletePartyFile(partyId: string, fileId: string): Promise<void> {
  const res = await apiFetch(
    `/api/parties/${encodeURIComponent(partyId)}/files/${encodeURIComponent(fileId)}`,
    { method: 'DELETE' },
  );
  await assertOk(res);
}
