const userService = require('../services/user.service');

function requireActivePlan(req, res, next) {
  const user = req.subscriptionUser;
  if (!userService.isAccessAllowed(user)) {
    return res.status(402).json({
      error: 'Plano expirado. Renove para continuar.',
      code: 'PLAN_EXPIRED',
    });
  }
  return next();
}

module.exports = { requireActivePlan };
