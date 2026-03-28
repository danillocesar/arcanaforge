const Character = require('../../db/models/Character');

const ACTIVE_FILTER = { deletedAt: null };

async function findIdsByOwner(uid) {
  return Character.find({ ownerUid: uid, ...ACTIVE_FILTER }).select('_id');
}

async function findSummaryByOwner(uid) {
  return Character.find({ ownerUid: uid })
    .select('_id name avatar classes system ownerUid ownerEmail deletedAt pendingDeleteAt')
    .lean();
}

async function findOwnedById(id, uid) {
  return Character.findOne({ _id: id, ownerUid: uid, ...ACTIVE_FILTER }).lean();
}

async function findOwnedAvatarDataById(id, uid) {
  return Character.findOne({ _id: id, ownerUid: uid })
    .select('avatar name ownerEmail')
    .lean();
}

async function findOwnerById(id) {
  return Character.findById(id).select('ownerUid deletedAt').lean();
}

async function countByOwner(uid) {
  return Character.countDocuments({ ownerUid: uid, ...ACTIVE_FILTER });
}

async function upsertById(id, body) {
  return Character.findByIdAndUpdate(id, body, { upsert: true, setDefaultsOnInsert: true });
}

async function updateAvatar(id, avatarUrl) {
  return Character.findByIdAndUpdate(id, { avatar: avatarUrl });
}

async function softDeleteOwnedById(id, uid, pendingDeleteAt) {
  return Character.findOneAndUpdate(
    { _id: id, ownerUid: uid, deletedAt: null },
    { deletedAt: new Date(), pendingDeleteAt },
    { new: true },
  );
}

async function restoreOwnedById(id, uid) {
  return Character.findOneAndUpdate(
    { _id: id, ownerUid: uid },
    { $unset: { deletedAt: '', pendingDeleteAt: '' } },
    { new: true },
  );
}

async function hardDeleteById(id) {
  return Character.findByIdAndDelete(id);
}

async function findExpiredSoftDeletes() {
  return Character.find({
    deletedAt: { $ne: null },
    pendingDeleteAt: { $lte: new Date() },
  }).lean();
}

async function findByIds(charIds) {
  return Character.find({ _id: { $in: charIds }, ...ACTIVE_FILTER })
    .select('_id name avatar classes system ownerUid ownerEmail hp mp clan')
    .lean();
}

async function findOwnedCharacterById(id, uid) {
  return Character.findOne({ _id: id, ownerUid: uid, ...ACTIVE_FILTER }).lean();
}

module.exports = {
  findIdsByOwner,
  findSummaryByOwner,
  findOwnedById,
  findOwnedAvatarDataById,
  findOwnerById,
  countByOwner,
  upsertById,
  updateAvatar,
  softDeleteOwnedById,
  restoreOwnedById,
  hardDeleteById,
  findExpiredSoftDeletes,
  findByIds,
  findOwnedCharacterById,
};
