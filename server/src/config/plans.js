const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS, 10) || 14;
const FREE_PLAN_SLOTS = parseInt(process.env.FREE_PLAN_SLOTS, 10) || 2;
const PRO_PLAN_SLOTS = parseInt(process.env.PRO_PLAN_SLOTS, 10) || 5;
const TRIAL_PLAN_SLOTS = parseInt(process.env.TRIAL_PLAN_SLOTS, 10) || 5;

const PLANS = {
  free: {
    slots: FREE_PLAN_SLOTS,
    maxParties: 1,
  },
  trial: {
    slots: TRIAL_PLAN_SLOTS,
    maxParties: null,
    durationDays: TRIAL_DAYS,
  },
  pro: {
    slots: PRO_PLAN_SLOTS,
    maxParties: null,
  },
};

const SOFT_DELETE_DELAY_DAYS = 2;

module.exports = { PLANS, TRIAL_DAYS, SOFT_DELETE_DELAY_DAYS };
