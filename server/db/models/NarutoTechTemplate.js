const mongoose = require('mongoose');

const narutoTechTemplateSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, index: true },
    unlockLevel: { type: Number, default: 1 },
    category: { type: String, default: '' },
    action: { type: String, default: '' },
    range: { type: String, default: '' },
    baseDamage: { type: String, default: '' },
    duration: { type: String, default: '' },
    target: { type: String, default: '' },
    chakraCost: { type: String, default: '' },
    description: { type: String, default: '' },
    evolutions: { type: String, default: '' },
    availableFor: { type: [String], default: [] },
    dealsDamage: { type: Boolean, default: true },
    source: { type: String, default: 'basico' },
    sourceDetail: { type: String, default: '' },
    system: { type: String, default: 'naruto', index: true },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'naruto_technique_templates',
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

module.exports = mongoose.model('NarutoTechTemplate', narutoTechTemplateSchema);
