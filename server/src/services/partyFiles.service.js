const crypto = require('crypto');
const { AppError } = require('../errors/AppError');
const partyRepository = require('../repositories/party.repository');
const { toPartyFileDTO, toPartyFileListDTO } = require('../dto/partyFile.dto');
const { PartyFileKind, kindFromMimetype } = require('../utils/partyFileKind');
const { decodeUploadFilename } = require('../utils/uploadFilename');
const { uploadPartyFileBuffer, deletePartyFileByKey, isR2Configured } = require('../../storage/r2');

const MAX_FILES_PER_PARTY = 200;

/**
 * Arquivos do grupo: o mestre (dono) envia e apaga; todo membro lista.
 * Cada mudança avisa o grupo por `party_roster_sync`, que a aba Arquivos
 * escuta para recarregar.
 */
function createPartyFilesService(refs) {
  async function listFiles(partyId, uid) {
    const party = await partyRepository.findOwnedOrMemberPartyLean(partyId, uid);
    if (!party) throw new AppError(404, 'Grupo não encontrado');
    return toPartyFileListDTO(party.files);
  }

  async function uploadFile(partyId, req) {
    if (!isR2Configured()) {
      throw new AppError(503, 'Armazenamento R2 não configurado no servidor');
    }
    if (!req.file) throw new AppError(400, 'Arquivo em falta (campo file)');

    const kind = kindFromMimetype(req.file.mimetype);
    if (!kind) throw new AppError(400, 'Tipo de arquivo não permitido');

    const party = await partyRepository.findOwnedOrMemberPartyLean(partyId, req.user.uid);
    if (!party) throw new AppError(404, 'Grupo não encontrado');
    if (party.ownerUid !== req.user.uid) {
      throw new AppError(403, 'Só o mestre do grupo pode enviar arquivos');
    }
    if ((party.files || []).length >= MAX_FILES_PER_PARTY) {
      throw new AppError(400, `Limite de ${MAX_FILES_PER_PARTY} arquivos por grupo atingido`);
    }

    const name = decodeUploadFilename(req.file.originalname);
    const stored = await uploadPartyFileBuffer({
      partyId,
      originalFilename: name,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      download: kind === PartyFileKind.DOCUMENT,
    });
    if (!stored) throw new AppError(503, 'Upload falhou');

    const file = {
      id: crypto.randomUUID(),
      kind,
      name,
      url: stored.publicUrl,
      key: stored.key,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };
    const updated = await partyRepository.pushOwnedPartyFile(partyId, req.user.uid, file);
    if (!updated) {
      // O grupo sumiu ou mudou de dono no meio do upload: não deixa o objeto órfão no bucket.
      await deletePartyFileByKey(partyId, stored.key);
      throw new AppError(404, 'Grupo não encontrado');
    }

    refs.broadcastPartyRoster(partyId);
    return toPartyFileDTO(file);
  }

  async function deleteFile(partyId, fileId, uid) {
    const before = await partyRepository.pullOwnedPartyFile(partyId, uid, fileId);
    if (!before) throw new AppError(404, 'Arquivo não encontrado');
    const file = (before.files || []).find((f) => f.id === fileId);
    if (file) await deletePartyFileByKey(partyId, file.key);
    refs.broadcastPartyRoster(partyId);
    return { ok: true };
  }

  /** Chamado ao apagar o grupo: tira do bucket tudo o que ele tinha. */
  async function deleteAllFiles(partyId, files) {
    await Promise.all((files || []).map((f) => deletePartyFileByKey(partyId, f.key)));
  }

  return { listFiles, uploadFile, deleteFile, deleteAllFiles };
}

module.exports = { createPartyFilesService };
