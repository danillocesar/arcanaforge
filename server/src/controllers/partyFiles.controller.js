function createPartyFilesController(partyFilesService) {
  return {
    async listFiles(req, res) {
      res.json(await partyFilesService.listFiles(req.params.id, req.user.uid));
    },
    async uploadFile(req, res) {
      res.status(201).json(await partyFilesService.uploadFile(req.params.id, req));
    },
    async deleteFile(req, res) {
      res.json(await partyFilesService.deleteFile(req.params.id, req.params.fileId, req.user.uid));
    },
  };
}

module.exports = { createPartyFilesController };
