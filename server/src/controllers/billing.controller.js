const billingService = require('../services/billing.service');
const webhookService = require('../services/webhook.service');

async function getBillingStatus(req, res) {
  res.json(await billingService.getBillingStatus(req.user.uid));
}

async function createSubscriptionCheckout(req, res) {
  res.json(await billingService.createSubscriptionCheckout(req.user.uid));
}

async function createSlotCheckout(req, res) {
  res.json(await billingService.createSlotCheckout(req.user.uid));
}

async function cancelSubscription(req, res) {
  res.json(await billingService.cancelSubscription(req.user.uid));
}

async function getPortalSession(req, res) {
  res.json(await billingService.getPortalSession(req.user.uid));
}

async function handleWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  const result = await webhookService.handleStripeEvent(req.body, signature);
  res.json(result);
}

module.exports = {
  getBillingStatus,
  createSubscriptionCheckout,
  createSlotCheckout,
  cancelSubscription,
  getPortalSession,
  handleWebhook,
};
