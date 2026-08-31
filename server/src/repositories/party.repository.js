const Party = require('../../db/models/Party');

async function existsInviteCode(code) {
  return Party.exists({ inviteCode: code });
}

async function createParty(payload) {
  return Party.create(payload);
}

async function findVisibleToUser(uid) {
  return Party.find({
    $or: [{ ownerUid: uid }, { 'members.uid': uid }],
  }).lean();
}

async function updateOwnedParty(id, uid, update) {
  return Party.findOneAndUpdate(
    { _id: id, ownerUid: uid },
    update,
    { returnDocument: 'after', runValidators: true },
  ).lean();
}

async function deleteOwnedParty(id, uid) {
  return Party.findOneAndDelete({ _id: id, ownerUid: uid });
}

async function findByInviteCode(code) {
  return Party.findOne({ inviteCode: code });
}

async function findMemberParty(id, uid) {
  return Party.findOne({
    _id: id,
    'members.uid': uid,
  });
}

async function findMemberPartyLean(id, uid) {
  return Party.findOne({
    _id: id,
    'members.uid': uid,
  }).lean();
}

async function findById(id) {
  return Party.findById(id);
}

async function findOwnedParty(id, uid) {
  return Party.findOne({ _id: id, ownerUid: uid });
}

async function findOwnedOrMemberPartyLean(id, uid) {
  return Party.findOne({
    _id: id,
    $or: [{ ownerUid: uid }, { 'members.uid': uid }],
  }).lean();
}

/**
 * Grava a referência do evento de UM uid, sem ler a lista antes.
 *
 * Por que não `$set` do array inteiro: quem chama só conhece um snapshot lido
 * no começo da requisição. Dois votos que se sobrepõem partem do mesmo
 * snapshot, e o segundo `$set` apaga as referências gravadas pelo primeiro —
 * os eventos continuam de verdade na agenda das pessoas, e o app perde o único
 * jeito de apagá-los. Mexendo só na entrada do uid, escritas de uids
 * diferentes deixam de se atropelar.
 *
 * `$pull` do uid antes do `$push` é o que mantém o invariante "uma entrada por
 * uid" sem precisar ler o array: se já havia entrada (re-criação depois de uma
 * deleção não confirmada, por exemplo), ela sai e a nova entra. As duas
 * operações não cabem num update só — o Mongo recusa `$pull` e `$push` no
 * mesmo caminho.
 */
async function addProposalGoogleEvent(partyId, proposalId, ref) {
  const filtro = { _id: partyId, 'sessionProposals.id': proposalId };
  await Party.updateOne(filtro, {
    $pull: { 'sessionProposals.$.googleEvents': { uid: ref.uid } },
  });
  await Party.updateOne(filtro, {
    $push: { 'sessionProposals.$.googleEvents': ref },
  });
}

/** Remove a referência de UM uid. Chamado só quando a deleção no Google foi confirmada. */
async function removeProposalGoogleEvent(partyId, proposalId, uid) {
  await Party.updateOne(
    { _id: partyId, 'sessionProposals.id': proposalId },
    { $pull: { 'sessionProposals.$.googleEvents': { uid } } },
  );
}

module.exports = {
  existsInviteCode,
  createParty,
  findVisibleToUser,
  updateOwnedParty,
  deleteOwnedParty,
  findByInviteCode,
  findMemberParty,
  findMemberPartyLean,
  findById,
  findOwnedParty,
  findOwnedOrMemberPartyLean,
  addProposalGoogleEvent,
  removeProposalGoogleEvent,
};
