function generatePartyId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  return code;
}

module.exports = { generatePartyId, generateInviteCode };
