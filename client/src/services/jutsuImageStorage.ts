import { apiFetch, assertOk } from '../api/http';

/**
 * Faz upload da imagem associada a um jutsu específico (multipart).
 * O servidor grava no Cloudflare R2 (pasta `jutsus/`) e atualiza
 * `character.jutsus[i].image` no documento.
 */
export async function uploadJutsuImage(
  characterId: string,
  jutsuId: string,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('jutsuId', jutsuId);

  const res = await apiFetch(`/api/characters/${encodeURIComponent(characterId)}/jutsu-image`, {
    method: 'POST',
    body: formData,
  });
  await assertOk(res);
  const { url } = (await res.json()) as { url: string };
  return url;
}
