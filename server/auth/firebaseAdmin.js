const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function parsePrivateKey(key) {
  return key ? key.replace(/\\n/g, '\n') : '';
}

function initAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return getAuth();
}

const adminAuth = initAdmin();

/**
 * Email para pastas no R2: token → ficha (ownerEmail) → Firebase Admin getUser(uid).
 * @param {import('express').Request} req
 * @param {{ ownerEmail?: string } | null} [characterDoc]
 * @returns {Promise<string | null>}
 */
async function resolveUserEmail(req, characterDoc) {
  const fromToken = req.user?.email;
  if (fromToken && String(fromToken).trim()) {
    return String(fromToken).trim().toLowerCase();
  }
  const fromDoc = characterDoc?.ownerEmail;
  if (fromDoc && String(fromDoc).trim()) {
    return String(fromDoc).trim().toLowerCase();
  }
  if (!adminAuth) return null;
  try {
    const rec = await adminAuth.getUser(req.user.uid);
    if (rec.email) return rec.email.toLowerCase();
  } catch (err) {
    console.warn('[auth] resolveUserEmail getUser:', err.message);
  }
  return null;
}

module.exports = { adminAuth, resolveUserEmail };
