const { getStripe } = require('../integrations/stripe');
const userRepository = require('../repositories/user.repository');
const { AppError } = require('../errors/AppError');
const { toBillingStatusDTO } = require('../dto/billing.dto');

async function createCustomerIfNeeded(user) {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { uid: user._id },
  });

  await userRepository.updateSubscription(user._id, { stripeCustomerId: customer.id });
  return customer.id;
}

async function createSubscriptionCheckout(uid) {
  const user = await userRepository.findByUid(uid);
  if (!user) throw new AppError(404, 'Usuário não encontrado');

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) throw new AppError(500, 'STRIPE_PRO_PRICE_ID não configurado');

  const customerId = await createCustomerIfNeeded(user);
  const stripe = getStripe();

  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const successUrl = process.env.STRIPE_SUCCESS_URL || `${baseUrl}/billing?success=1`;
  const cancelUrl = process.env.STRIPE_CANCEL_URL || `${baseUrl}/billing`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { uid },
    subscription_data: { metadata: { uid } },
  });

  return { url: session.url };
}

async function createSlotCheckout(uid) {
  const user = await userRepository.findByUid(uid);
  if (!user) throw new AppError(404, 'Usuário não encontrado');

  const priceId = process.env.STRIPE_SLOT_PRICE_ID;
  if (!priceId) throw new AppError(500, 'STRIPE_SLOT_PRICE_ID não configurado');

  const customerId = await createCustomerIfNeeded(user);
  const stripe = getStripe();

  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const successUrl = process.env.STRIPE_SLOT_SUCCESS_URL || `${baseUrl}/billing?slot=1`;
  const cancelUrl = process.env.STRIPE_CANCEL_URL || `${baseUrl}/billing`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { uid, type: 'slot' },
  });

  return { url: session.url };
}

async function cancelSubscription(uid) {
  const user = await userRepository.findByUid(uid);
  if (!user) throw new AppError(404, 'Usuário não encontrado');
  if (!user.subscriptionId) throw new AppError(400, 'Sem assinatura ativa');

  const stripe = getStripe();
  await stripe.subscriptions.cancel(user.subscriptionId);
  return { ok: true };
}

async function getPortalSession(uid) {
  const user = await userRepository.findByUid(uid);
  if (!user) throw new AppError(404, 'Usuário não encontrado');
  if (!user.stripeCustomerId) throw new AppError(400, 'Sem conta Stripe vinculada');

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: (process.env.CLIENT_URL || '') + '/billing',
  });

  return { url: session.url };
}

async function getBillingStatus(uid) {
  const user = await userRepository.findByUid(uid);
  if (!user) throw new AppError(404, 'Usuário não encontrado');
  return toBillingStatusDTO(user);
}

module.exports = {
  createSubscriptionCheckout,
  createSlotCheckout,
  cancelSubscription,
  getPortalSession,
  getBillingStatus,
};
