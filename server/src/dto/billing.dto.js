const userService = require('../services/user.service');

/**
 * Status de billing exposto ao frontend.
 * Exclui campos internos: subscriptionId, stripeCustomerId,
 * processedStripeEvents, email, _id.
 *
 * Campos não usados no frontend (confirmado por análise):
 * - rawPlan: declarado em BillingStatus mas nenhum componente o lê
 */
function toBillingStatusDTO(user) {
  return {
    plan: userService.getEffectivePlan(user),
    trialEndsAt: user.trialEndsAt ?? null,
    trialDaysLeft: userService.getTrialDaysLeft(user),
    subscriptionStatus: user.subscriptionStatus ?? null,
    currentPeriodEnd: user.currentPeriodEnd ?? null,
    characterSlots: user.characterSlots ?? 0,
    extraSlotsPurchased: user.extraSlotsPurchased ?? 0,
    isExpired: !userService.isAccessAllowed(user),
    isTrial: user.plan === 'trial',
  };
}

module.exports = { toBillingStatusDTO };
