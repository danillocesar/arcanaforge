const User = require('../../db/models/User');

async function findByUid(uid) {
  return User.findById(uid).lean();
}

async function findOrCreate(uid, email) {
  let user = await User.findById(uid).lean();
  if (user) return { user, isNew: false };

  const created = await User.create({ _id: uid, email });
  return { user: created.toObject(), isNew: true };
}

module.exports = {
  findByUid,
  findOrCreate,
};
