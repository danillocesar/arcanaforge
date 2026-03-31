const CharacterLogs = require('../../db/models/CharacterLogs');

async function findById(id) {
  return CharacterLogs.findById(id).lean();
}

async function upsertById(id, data) {
  return CharacterLogs.findByIdAndUpdate(
    id,
    { ...data, _id: id },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

async function deleteById(id) {
  return CharacterLogs.findByIdAndDelete(id);
}

module.exports = { findById, upsertById, deleteById };
