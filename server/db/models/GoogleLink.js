const mongoose = require('mongoose');

const googleLinkSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // uid do Firebase
    email: { type: String, default: '' },
    refreshTokenEnc: { type: String, required: true },
    scope: { type: String, default: '' },
    calendarId: { type: String, default: '' },
    linkedAt: { type: Date, default: Date.now },
    lastError: { type: String, default: null },
  },
  { _id: false, timestamps: true, collection: 'googleLinks' },
);

module.exports = mongoose.model('GoogleLink', googleLinkSchema);
