/**
 * @param {import('express').Request} req
 */
function ownerFieldsFromReq(req) {
  return {
    ownerUid: req.user.uid,
    ownerEmail: req.user.email ? String(req.user.email).trim().toLowerCase() : '',
  };
}

module.exports = { ownerFieldsFromReq };
