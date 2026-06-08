const userRepository = require('../repositories/user.repository');

async function ensureUserExists(uid, email) {
  const { user, isNew } = await userRepository.findOrCreate(uid, email);
  return { user, isNew };
}

module.exports = {
  ensureUserExists,
};
