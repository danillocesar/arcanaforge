const userRepository = require('../repositories/user.repository');
const { PLANS } = require('../config/plans');

async function ensureUserExists(uid, email) {
  const { user, isNew } = await userRepository.findOrCreate(uid, email);
  return { user, isNew };
}

function isTrialActive(user) {
  if (user.plan !== 'trial') return false;
  if (!user.trialEndsAt) return false;
  return new Date() < new Date(user.trialEndsAt);
}

function isAccessAllowed(user) {
  if (!user) return false;
  if (user.plan === 'trial') return isTrialActive(user);
  if (user.plan === 'pro') {
    return ['active', 'past_due'].includes(user.subscriptionStatus);
  }
  return user.plan === 'free';
}

function getSlotLimit(user) {
  if (!user) return PLANS.free.slots;
  return user.characterSlots || PLANS.free.slots;
}

function getEffectivePlan(user) {
  if (!user) return 'free';
  if (user.plan === 'trial' && !isTrialActive(user)) return 'free';
  return user.plan;
}

function getTrialDaysLeft(user) {
  if (user.plan !== 'trial' || !user.trialEndsAt) return 0;
  const ms = new Date(user.trialEndsAt) - new Date();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

module.exports = {
  ensureUserExists,
  isTrialActive,
  isAccessAllowed,
  getSlotLimit,
  getEffectivePlan,
  getTrialDaysLeft,
};
