const mongoose = require('mongoose');

const characterContentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
  },
  {
    strict: false,
    timestamps: true,
    collection: 'character_content',
  },
);

module.exports = mongoose.model('CharacterContent', characterContentSchema);
