const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true },
    plan: {
      type: String,
      enum: ['free', 'trial', 'pro'],
      default: 'trial',
    },
    trialEndsAt: { type: Date, default: null },
    subscriptionId: { type: String, default: null },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'unpaid', null],
      default: null,
    },
    currentPeriodEnd: { type: Date, default: null },
    characterSlots: { type: Number, default: 5 },
    extraSlotsPurchased: { type: Number, default: 0 },
    stripeCustomerId: { type: String, default: null },
    processedStripeEvents: { type: [String], default: [] },
  },
  {
    _id: false,
    timestamps: true,
    collection: 'users',
  },
);

module.exports = mongoose.model('User', userSchema);
