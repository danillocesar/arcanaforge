const Character = require('../../db/models/Character');

async function findIdsByOwner(uid) {
  return Character.find({ ownerUid: uid }).select('_id');
}

async function findSummaryByOwner(uid) {
  return Character.find({ ownerUid: uid })
    .select('_id name avatar classes system ownerUid ownerEmail')
    .lean();
}

async function findOwnedById(id, uid) {
  return Character.findOne({ _id: id, ownerUid: uid }).lean();
}

async function findOwnedAvatarDataById(id, uid) {
  return Character.findOne({ _id: id, ownerUid: uid })
    .select('avatar name ownerEmail')
    .lean();
}

async function findOwnerById(id) {
  return Character.findById(id).select('ownerUid').lean();
}

async function upsertById(id, body) {
  return Character.findByIdAndUpdate(id, body, { upsert: true, setDefaultsOnInsert: true });
}

async function updateAvatar(id, avatarUrl) {
  return Character.findByIdAndUpdate(id, { avatar: avatarUrl });
}

async function deleteOwnedById(id, uid) {
  return Character.findOneAndDelete({ _id: id, ownerUid: uid });
}

async function findByIds(charIds) {
  return Character.find({ _id: { $in: charIds } })
    .select('_id name avatar classes system ownerUid ownerEmail hp mp clan')
    .lean();
}

async function findOwnedCharacterById(id, uid) {
  return Character.findOne({ _id: id, ownerUid: uid }).lean();
}

module.exports = {
  findIdsByOwner,
  findSummaryByOwner,
  findOwnedById,
  findOwnedAvatarDataById,
  findOwnerById,
  upsertById,
  updateAvatar,
  deleteOwnedById,
  findByIds,
  findOwnedCharacterById,
};
