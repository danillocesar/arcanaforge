/**
 * Tipo de arquivo do grupo: decide em qual separador aparece (Galeria ou
 * Documentos) e como é servido (imagem abre no sistema, documento é baixado).
 * O tipo sai do mimetype aceito no upload — o cliente não escolhe.
 */
const PartyFileKind = Object.freeze({
  IMAGE: 'image',
  DOCUMENT: 'document',
});

/** Mimetypes aceitos no upload e o tipo de cada um. */
const KIND_BY_MIMETYPE = Object.freeze({
  'image/png': PartyFileKind.IMAGE,
  'image/jpeg': PartyFileKind.IMAGE,
  'image/webp': PartyFileKind.IMAGE,
  'image/gif': PartyFileKind.IMAGE,
  'application/pdf': PartyFileKind.DOCUMENT,
});

function kindFromMimetype(mimetype) {
  return KIND_BY_MIMETYPE[String(mimetype || '').toLowerCase()] ?? null;
}

module.exports = { PartyFileKind, kindFromMimetype };
