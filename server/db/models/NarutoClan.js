const mongoose = require('mongoose');

const narutoClanSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, unique: true, index: true },
    icon: { type: String, required: true },
    system: { type: String, default: 'naruto', index: true },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'naruto_clans',
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

module.exports = mongoose.model('NarutoClan', narutoClanSchema);
