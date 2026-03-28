const { Router } = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { requireAuth } = require('../middlewares/requireAuth');
const billingController = require('../controllers/billing.controller');

function createBillingRoutes() {
  const router = Router();

  router.use(requireAuth);

  router.get('/api/billing/status', asyncHandler(billingController.getBillingStatus));
  router.post('/api/billing/subscribe', asyncHandler(billingController.createSubscriptionCheckout));
  router.post('/api/billing/buy-slot', asyncHandler(billingController.createSlotCheckout));
  router.post('/api/billing/cancel', asyncHandler(billingController.cancelSubscription));
  router.get('/api/billing/portal', asyncHandler(billingController.getPortalSession));

  return router;
}

module.exports = { createBillingRoutes };
