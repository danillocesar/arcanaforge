const mongoose = require('mongoose');

const combatSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    enemies: { type: Array, default: [] },
    initiatives: { type: mongoose.Schema.Types.Mixed, default: {} },
    turnIndex: { type: Number, default: -1 },
    ordered: { type: Boolean, default: false },
    round: { type: Number, default: 1 },
  },
  {
    strict: false,
    timestamps: true,
    collection: 'combat',
  },
);

module.exports = mongoose.model('Combat', combatSchema);
