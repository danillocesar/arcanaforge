const MAX_NAME_LENGTH = 120;

/**
 * Nome original do upload como o usuário o vê. O busboy (por baixo do multer)
 * lê o `filename` do multipart como latin1, então um nome com acento chega
 * com os bytes UTF-8 espalhados em caracteres latin1 ("nível" vira "nÃ­vel").
 * Reinterpreta os bytes como UTF-8 quando isso dá um texto válido; senão
 * mantém o que veio.
 */
function decodeUploadFilename(raw) {
  const name = String(raw || '').trim();
  if (!name) return 'arquivo';
  const utf8 = Buffer.from(name, 'latin1').toString('utf8');
  const decoded = utf8.includes('�') ? name : utf8;
  return decoded.length > MAX_NAME_LENGTH ? decoded.slice(0, MAX_NAME_LENGTH) : decoded;
}

module.exports = { decodeUploadFilename };
