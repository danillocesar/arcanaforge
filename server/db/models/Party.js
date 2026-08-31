const mongoose = require('mongoose');

const partyMemberSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    email: { type: String, default: '' },
    characterIds: { type: [String], default: [] },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sessionResponseSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    vote: { type: String, enum: ['sim', 'nao'], required: true },
    respondedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const googleEventRefSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    eventId: { type: String, required: true },
    calendarId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sessionProposalSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    proposedBy: { type: String, required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    time: { type: String, default: '' }, // 'HH:mm', opcional
    timezone: { type: String, default: '' }, // IANA; '' cai no DEFAULT_TIMEZONE
    googleEvents: { type: [googleEventRefSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    responses: { type: [sessionResponseSchema], default: [] },
  },
  { _id: false },
);

const partySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    system: { type: String, default: 'tormenta' },
    inviteCode: { type: String, unique: true, sparse: true, index: true },
    members: { type: [partyMemberSchema], default: [] },
    ownerUid: { type: String, index: true },
    ownerEmail: { type: String, index: true },
    sessionProposals: { type: [sessionProposalSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'parties',
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model('Party', partySchema);
