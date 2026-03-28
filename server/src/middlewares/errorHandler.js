const { AppError } = require('../errors/AppError');

/**
 * @type {import('express').ErrorRequestHandler}
 */
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  const message = err && err.message ? err.message : 'Internal server error';
  return res.status(500).json({ error: message });
}

module.exports = { errorHandler };
