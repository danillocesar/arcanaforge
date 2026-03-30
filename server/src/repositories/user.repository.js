const User = require('../../db/models/User');
const { PLANS, TRIAL_DAYS } = require('../config/plans');

function trialEndsAt() {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d;
}

async function findByUid(uid) {
  return User.findById(uid).lean();
}

async function findOrCreate(uid, email) {
  let user = await User.findById(uid).lean();
  if (user) return { user, isNew: false };

  const created = await User.create({
    _id: uid,
    email,
    plan: 'trial',
    trialEndsAt: trialEndsAt(),
    characterSlots: PLANS.trial.slots,
    extraSlotsPurchased: 0,
  });
  return { user: created.toObject(), isNew: true };
}

async function updateSubscription(uid, fields) {
  return User.findByIdAndUpdate(uid, fields, { new: true, lean: true });
}

async function addExtraSlot(uid) {
  return User.findByIdAndUpdate(
    uid,
    { $inc: { extraSlotsPurchased: 1, characterSlots: 1 } },
    { new: true, lean: true },
  );
}

async function markStripeEventProcessed(uid, eventId) {
  return User.findByIdAndUpdate(
    uid,
    { $addToSet: { processedStripeEvents: eventId } },
    { new: true, lean: true },
  );
}

async function findByStripeCustomerId(customerId) {
  return User.findOne({ stripeCustomerId: customerId }).lean();
}

module.exports = {
  findByUid,
  findOrCreate,
  updateSubscription,
  addExtraSlot,
  markStripeEventProcessed,
  findByStripeCustomerId,
};
