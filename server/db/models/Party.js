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

const partySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    system: { type: String, default: 'tormenta' },
    inviteCode: { type: String, unique: true, sparse: true, index: true },
    members: { type: [partyMemberSchema], default: [] },
    ownerUid: { type: String, index: true },
    ownerEmail: { type: String, index: true },
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
