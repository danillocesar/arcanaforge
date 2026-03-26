const SAFE_ID = /^[a-zA-Z0-9_-]+$/;

function validateId(req, res, next) {
  const id = req.params.id || req.params.partyId;
  if (id && !SAFE_ID.test(id)) {
    return res.status(400).json({ error: 'ID contém caracteres inválidos' });
  }
  next();
}

function register(app) {
  app.param('id', validateId);
  app.param('partyId', validateId);
}

module.exports = { register, validateId };
