function createCombatController(combatService) {
  return {
    async getCombat(req, res) {
      res.json(await combatService.getCombat(req.params.id, req.user.uid));
    },
    async saveCombat(req, res) {
      res.json(await combatService.saveCombat(req.params.id, req.user.uid, req.body));
    },
  };
}

module.exports = { createCombatController };
