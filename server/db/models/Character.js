const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    ownerUid: { type: String, index: true },
    ownerEmail: { type: String, index: true },
    system: { type: String, default: 'tormenta' },
    name: { type: String, default: '' },
    avatar: { type: String, default: '' },
    classes: { type: Array, default: [] },
  },
  {
    strict: false,
    timestamps: true,
    collection: 'characters',
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model('Character', characterSchema);
