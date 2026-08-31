const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function createGoogleController(googleLinkService) {
  return {
    async startOAuth(req, res) {
      res.json({ url: await googleLinkService.startOAuth(req.user.uid, req.query.returnTo) });
    },

    // Redirect de navegador: erro também volta como redirect, não como JSON.
    async callback(req, res) {
      try {
        const { returnTo } = await googleLinkService.handleCallback({
          code: req.query.code,
          state: req.query.state,
        });
        // Volta para a aba de onde a pessoa saiu: sem isso o Toast da Task 7,
        // que vive na pagina do grupo, nunca dispara.
        res.redirect(`${CLIENT_URL}${returnTo}?google=ok`);
      } catch (err) {
        const motivo = encodeURIComponent(err.message || 'erro');
        res.redirect(`${CLIENT_URL}/?google=error&reason=${motivo}`);
      }
    },

    async getLink(req, res) {
      res.json(await googleLinkService.getLinkState(req.user.uid));
    },

    async deleteLink(req, res) {
      await googleLinkService.unlink(req.user.uid);
      res.json({ ok: true });
    },
  };
}

module.exports = { createGoogleController };
