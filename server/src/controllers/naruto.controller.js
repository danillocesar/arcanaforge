const narutoService = require('../services/naruto.service');

async function getClans(_req, res) {
  res.json(await narutoService.listClans());
}

async function getTechniqueTemplates(req, res) {
  res.json(await narutoService.listTechniqueTemplates(req.query));
}

module.exports = { getClans, getTechniqueTemplates };
