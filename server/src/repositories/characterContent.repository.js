const CharacterContent = require('../../db/models/CharacterContent');

async function findById(id) {
  return CharacterContent.findById(id).lean();
}

async function upsertById(id, data) {
  return CharacterContent.findByIdAndUpdate(
    id,
    { ...data, _id: id },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

async function deleteById(id) {
  return CharacterContent.findByIdAndDelete(id);
}

module.exports = { findById, upsertById, deleteById };
