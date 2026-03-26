const mongoose = require('mongoose');

const partySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    system: { type: String, enum: ['tormenta', 'naruto'], default: 'tormenta' },
    members: { type: [String], default: [] },
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
