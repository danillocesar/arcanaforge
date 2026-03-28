const narutoRepository = require('../repositories/naruto.repository');
const { toClanDTO, toTechTemplateDTO } = require('../dto/naruto.dto');

async function listClans() {
  const clans = await narutoRepository.findActiveClans();
  return clans.map(toClanDTO);
}

async function listTechniqueTemplates(query) {
  const filter = { system: 'naruto', active: true };
  if (query.source && typeof query.source === 'string') filter.source = query.source;
  if (query.sourceDetail && typeof query.sourceDetail === 'string') filter.sourceDetail = query.sourceDetail;
  const docs = await narutoRepository.findTechniqueTemplates(filter);
  return docs.map(toTechTemplateDTO);
}

module.exports = { listClans, listTechniqueTemplates };
