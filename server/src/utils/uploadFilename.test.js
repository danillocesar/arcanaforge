const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { decodeUploadFilename } = require('./uploadFilename');

describe('decodeUploadFilename', () => {
  it('recupera acentos de um nome UTF-8 lido como latin1 pelo busboy', () => {
    const asLatin1 = Buffer.from('Mapa — nível 2.pdf', 'utf8').toString('latin1');
    assert.equal(decodeUploadFilename(asLatin1), 'Mapa — nível 2.pdf');
  });

  it('mantém nomes ASCII como vieram', () => {
    assert.equal(decodeUploadFilename('mapa.png'), 'mapa.png');
  });

  it('mantém o original quando os bytes não formam UTF-8 válido', () => {
    assert.equal(decodeUploadFilename('café.png'), 'café.png');
  });

  it('usa "arquivo" quando o nome vem vazio', () => {
    assert.equal(decodeUploadFilename(''), 'arquivo');
  });
});
