const mongoose = require('mongoose');

const characterLogsSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    logs: { type: Array, default: [] },
  },
  {
    timestamps: true,
    collection: 'character_logs',
  },
);

module.exports = mongoose.model('CharacterLogs', characterLogsSchema);
