function createPartyController(partyService) {
  return {
    async listParties(req, res) {
      res.json(await partyService.listParties(req.user.uid));
    },
    async createParty(req, res) {
      res.json(await partyService.createParty(req.body, req));
    },
    async updateParty(req, res) {
      res.json(await partyService.updateParty(req.params.id, req.body, req.user.uid));
    },
    async deleteParty(req, res) {
      res.json(await partyService.deleteParty(req.params.id, req.user.uid));
    },
    async joinParty(req, res) {
      res.json(await partyService.joinParty(req.body, req));
    },
    async addCharacter(req, res) {
      res.json(await partyService.addCharacterToParty(req.params.id, req.body, req.user.uid));
    },
    async removeCharacter(req, res) {
      res.json(await partyService.removeCharacterFromParty(req.params.id, req.body, req.user.uid));
    },
    async leaveParty(req, res) {
      res.json(await partyService.leaveParty(req.params.id, req.user.uid));
    },
    async removeMember(req, res) {
      res.json(await partyService.removeMember(req.params.id, req.params.uid, req.user.uid));
    },
    async regenerateCode(req, res) {
      res.json(await partyService.regenerateCode(req.params.id, req.user.uid));
    },
    async listPartyCharacters(req, res) {
      res.json(await partyService.listPartyCharacters(req.params.id, req.user.uid));
    },
  };
}

module.exports = { createPartyController };
