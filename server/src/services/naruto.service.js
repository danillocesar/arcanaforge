const narutoRepository = require('../repositories/naruto.repository');

async function listClans() {
  const clans = await narutoRepository.findActiveClans();
  return clans.map((c) => ({
    id: c._id,
    name: c.name,
    icon: c.icon,
    system: c.system,
    active: c.active,
  }));
}

async function listTechniqueTemplates(query) {
  const filter = { system: 'naruto', active: true };
  if (query.source) filter.source = query.source;
  if (query.sourceDetail) filter.sourceDetail = query.sourceDetail;
  const docs = await narutoRepository.findTechniqueTemplates(filter);
  return docs.map((d) => ({
    id: d._id,
    name: d.name,
    unlockLevel: d.unlockLevel,
    category: d.category,
    action: d.action,
    range: d.range,
    baseDamage: d.baseDamage,
    duration: d.duration,
    target: d.target,
    chakraCost: d.chakraCost,
    description: d.description,
    evolutions: d.evolutions,
    availableFor: d.availableFor,
    dealsDamage: d.dealsDamage,
    source: d.source,
    sourceDetail: d.sourceDetail,
  }));
}

module.exports = { listClans, listTechniqueTemplates };
