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

/** Substitui a lista de eventos do Google de uma proposta, sem reescrever o resto. */
async function updateProposalGoogleEvents(partyId, proposalId, googleEvents) {
  await Party.updateOne(
    { _id: partyId, 'sessionProposals.id': proposalId },
    { $set: { 'sessionProposals.$.googleEvents': googleEvents } },
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
  updateProposalGoogleEvents,
};
