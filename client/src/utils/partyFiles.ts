import { PARTY_FILE_ACCEPT, PARTY_FILE_MAX_BYTES, PartyFileKind, type PartyFile } from '../types/partyFile';

/** "812 KB", "3,4 MB" — tamanho para a lista de documentos. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Separa a lista do grupo em Galeria (imagens) e Documentos, mantendo a ordem. */
export function splitPartyFiles(files: PartyFile[]): { images: PartyFile[]; documents: PartyFile[] } {
  return {
    images: files.filter((f) => f.kind === PartyFileKind.IMAGE),
    documents: files.filter((f) => f.kind === PartyFileKind.DOCUMENT),
  };
}

const ACCEPTED = new Set(PARTY_FILE_ACCEPT.split(','));

/**
 * Motivo para recusar o arquivo antes de enviar, ou null se pode seguir.
 * O server valida o mesmo; aqui é só para não gastar um upload de 20 MB à toa.
 */
export function rejectReason(file: Pick<File, 'type' | 'size' | 'name'>): string | null {
  if (!ACCEPTED.has(file.type)) return `${file.name}: só imagens (PNG, JPEG, WebP, GIF) ou PDF.`;
  if (file.size > PARTY_FILE_MAX_BYTES) return `${file.name}: passa de 20 MB.`;
  return null;
}

/** Mensagem legível de um erro da API (o server responde `{ "error": "..." }`). */
export function uploadErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    if (typeof parsed.error === 'string' && parsed.error) return parsed.error;
  } catch {
    // não era JSON: usa o texto como veio
  }
  return raw || 'Falha no envio';
}
