const NarutoClan = require('../../db/models/NarutoClan');
const NarutoTechTemplate = require('../../db/models/NarutoTechTemplate');

async function findActiveClans() {
  return NarutoClan.find({ system: 'naruto', active: true })
    .select('_id name icon system active')
    .sort({ name: 1 })
    .lean();
}

async function findTechniqueTemplates(filter) {
  return NarutoTechTemplate.find(filter)
    .sort({ unlockLevel: 1, name: 1 })
    .lean();
}

module.exports = { findActiveClans, findTechniqueTemplates };
