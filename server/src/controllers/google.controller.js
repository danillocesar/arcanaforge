const { AppError } = require('../errors/AppError');

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
        // O log completo fica no servidor; a URL do navegador (histórico,
        // referrer, logs de proxy) só recebe uma mensagem curta e controlada
        // — nunca o corpo bruto de uma resposta de erro do Google.
        console.error('Falha no callback OAuth do Google:', err);
        const mensagem = err instanceof AppError ? err.message : 'falha ao conectar com o Google';
        const motivo = encodeURIComponent(mensagem.slice(0, 120));
        // Se o state já tinha sido consumido e validado quando o erro
        // aconteceu (ex.: falha na troca de código), o returnTo é conhecido
        // e vem anexado no erro — sem isso o Toast de erro nunca aparece,
        // porque ele só existe dentro da página do grupo. Falha antes do
        // state ser consumido genuinamente não tem returnTo; cai na raiz.
        const destino = typeof err.returnTo === 'string' && err.returnTo ? err.returnTo : '/';
        res.redirect(`${CLIENT_URL}${destino}?google=error&reason=${motivo}`);
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
