/**
 * Tipo de arquivo do grupo (espelha `server/src/utils/partyFileKind.js`):
 * imagem vai para a Galeria e abre no sistema; documento vai para Documentos e é baixado.
 */
export const PartyFileKind = {
  IMAGE: 'image',
  DOCUMENT: 'document',
} as const;

export type PartyFileKind = (typeof PartyFileKind)[keyof typeof PartyFileKind];

/** Arquivo que o mestre compartilhou com o grupo. */
export interface PartyFile {
  id: string;
  kind: PartyFileKind;
  name: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

/** O que o `<input type="file">` do upload aceita — o server valida o mesmo conjunto. */
export const PARTY_FILE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,application/pdf';

export const PARTY_FILE_MAX_BYTES = 20 * 1024 * 1024;
