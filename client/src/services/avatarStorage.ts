import { apiFetch, assertOk } from '../api/http';

/**
 * Envia o ficheiro para a API (multipart); o servidor grava no Cloudflare R2.
 * Evita CORS do PUT directo ao domínio R2 a partir do browser.
 */
export async function uploadCharacterAvatar(characterId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await apiFetch(`/api/characters/${encodeURIComponent(characterId)}/avatar`, {
    method: 'POST',
    body: formData,
  });
  await assertOk(res);
  const { url } = (await res.json()) as { url: string };
  return url;
}
