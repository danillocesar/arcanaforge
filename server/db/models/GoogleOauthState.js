const mongoose = require('mongoose');

const googleOauthStateSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // nonce
    uid: { type: String, required: true },
    // Caminho relativo para onde devolver o navegador depois do consentimento.
    // Fica no banco (e nao no state assinado) para nao poder ser trocado no
    // meio do fluxo, e para nao ter que embutir barras num payload separado
    // por ponto.
    returnTo: { type: String, default: '/' },
    // expires: 0 faz o Mongo apagar o documento quando expiresAt passa.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { _id: false, collection: 'googleOauthStates' },
);

module.exports = mongoose.model('GoogleOauthState', googleOauthStateSchema);
