const { getStripe } = require('../integrations/stripe');
const userRepository = require('../repositories/user.repository');

async function handleStripeEvent(rawBody, signature) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const error = new Error(`Webhook inválido: ${err.message}`);
    error.statusCode = 400;
    throw error;
  }

  await processEvent(event);
  return { received: true };
}

async function processEvent(event) {
  const eventId = event.id;

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object, eventId);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object, eventId);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object, eventId);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object, eventId);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object, eventId);
      break;
    default:
      break;
  }
}

async function handleCheckoutCompleted(session, eventId) {
  const uid = session.metadata?.uid;
  if (!uid) return;

  const user = await userRepository.findByUid(uid);
  if (!user) return;

  if (user.processedStripeEvents?.includes(eventId)) return;
  await userRepository.markStripeEventProcessed(uid, eventId);

  if (session.mode === 'subscription') {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    await userRepository.updateSubscription(uid, {
      plan: 'pro',
      subscriptionId: session.subscription,
      subscriptionStatus: 'active',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      stripeCustomerId: session.customer,
    });
    console.log(`[webhook] Usuário ${uid} ativou plano Pro`);
  } else if (session.mode === 'payment' && session.metadata?.type === 'slot') {
    await userRepository.addExtraSlot(uid);
    console.log(`[webhook] Usuário ${uid} comprou um slot extra`);
  }
}

async function handleInvoicePaid(invoice, eventId) {
  if (!invoice.subscription) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const uid = subscription.metadata?.uid;
  if (!uid) return;

  const user = await userRepository.findByUid(uid);
  if (!user) return;

  if (user.processedStripeEvents?.includes(eventId)) return;
  await userRepository.markStripeEventProcessed(uid, eventId);

  await userRepository.updateSubscription(uid, {
    subscriptionStatus: 'active',
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
  console.log(`[webhook] Fatura paga para usuário ${uid}`);
}

async function handlePaymentFailed(invoice, eventId) {
  if (!invoice.subscription) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const uid = subscription.metadata?.uid;
  if (!uid) return;

  const user = await userRepository.findByUid(uid);
  if (!user) return;

  if (user.processedStripeEvents?.includes(eventId)) return;
  await userRepository.markStripeEventProcessed(uid, eventId);

  await userRepository.updateSubscription(uid, { subscriptionStatus: 'past_due' });
  console.log(`[webhook] Pagamento falhou para usuário ${uid}`);
}

async function handleSubscriptionUpdated(subscription, eventId) {
  const uid = subscription.metadata?.uid;
  if (!uid) return;

  const user = await userRepository.findByUid(uid);
  if (!user) return;

  if (user.processedStripeEvents?.includes(eventId)) return;
  await userRepository.markStripeEventProcessed(uid, eventId);

  await userRepository.updateSubscription(uid, {
    subscriptionStatus: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}

async function handleSubscriptionDeleted(subscription, eventId) {
  const uid = subscription.metadata?.uid;
  if (!uid) {
    const user = await userRepository.findByStripeCustomerId(subscription.customer);
    if (!user) return;
    return handleSubscriptionDeletedForUser(user._id, eventId);
  }
  return handleSubscriptionDeletedForUser(uid, eventId);
}

async function handleSubscriptionDeletedForUser(uid, eventId) {
  const user = await userRepository.findByUid(uid);
  if (!user) return;

  if (user.processedStripeEvents?.includes(eventId)) return;
  await userRepository.markStripeEventProcessed(uid, eventId);

  await userRepository.updateSubscription(uid, {
    plan: 'free',
    subscriptionStatus: 'canceled',
    subscriptionId: null,
  });
  console.log(`[webhook] Assinatura cancelada para usuário ${uid}`);
}

module.exports = { handleStripeEvent };
