/**
 * Arquivo do grupo para o cliente. A chave do R2 (`key`) fica de fora: só o
 * server precisa dela para apagar o objeto.
 */
function toPartyFileDTO(file) {
  return {
    id: file.id,
    kind: file.kind,
    name: file.name,
    url: file.url,
    contentType: file.contentType || '',
    size: Number(file.size) || 0,
    uploadedAt: file.uploadedAt instanceof Date ? file.uploadedAt.toISOString() : String(file.uploadedAt || ''),
  };
}

/** Lista do grupo, mais recente primeiro. */
function toPartyFileListDTO(files) {
  return (files || [])
    .map(toPartyFileDTO)
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : a.uploadedAt > b.uploadedAt ? -1 : 0));
}

module.exports = { toPartyFileDTO, toPartyFileListDTO };
