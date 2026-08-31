const GoogleLink = require('../../db/models/GoogleLink');
const GoogleOauthState = require('../../db/models/GoogleOauthState');

async function findByUid(uid) {
  return GoogleLink.findById(uid).lean();
}

async function upsert(uid, { email, refreshTokenEnc, scope, calendarId }) {
  await GoogleLink.findByIdAndUpdate(
    uid,
    { email, refreshTokenEnc, scope, calendarId, linkedAt: new Date(), lastError: null },
    { upsert: true },
  );
}

async function setLastError(uid, message) {
  await GoogleLink.findByIdAndUpdate(uid, { lastError: String(message).slice(0, 300) });
}

async function remove(uid) {
  await GoogleLink.findByIdAndDelete(uid);
}

/** Só vínculos saudáveis: com lastError preenchido, o app para de tentar. */
async function findHealthyByUids(uids) {
  if (!uids || uids.length === 0) return [];
  return GoogleLink.find({ _id: { $in: uids }, lastError: null }).lean();
}

async function createState(nonce, uid, expiresAt, returnTo) {
  await GoogleOauthState.create({ _id: nonce, uid, expiresAt, returnTo: returnTo || '/' });
}

/** Uso único: some do banco na primeira leitura. */
async function consumeState(nonce) {
  return GoogleOauthState.findOneAndDelete({ _id: nonce }).lean();
}

module.exports = {
  findByUid,
  upsert,
  setLastError,
  remove,
  findHealthyByUids,
  createState,
  consumeState,
};
