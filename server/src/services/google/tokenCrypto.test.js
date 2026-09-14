const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const KEY = Buffer.alloc(32, 7).toString('base64');
let tokenCrypto;

function loadFresh() {
  delete require.cache[require.resolve('./tokenCrypto')];
  return require('./tokenCrypto');
}

describe('tokenCrypto', () => {
  const original = process.env.GOOGLE_TOKEN_ENC_KEY;

  beforeEach(() => {
    process.env.GOOGLE_TOKEN_ENC_KEY = KEY;
    tokenCrypto = loadFresh();
  });

  afterEach(() => {
    if (original === undefined) delete process.env.GOOGLE_TOKEN_ENC_KEY;
    else process.env.GOOGLE_TOKEN_ENC_KEY = original;
  });

  it('faz round-trip do token', () => {
    const enc = tokenCrypto.encryptToken('1//refresh-token-do-google');
    assert.equal(tokenCrypto.decryptToken(enc), '1//refresh-token-do-google');
  });

  it('gera ciphertext diferente a cada chamada (iv aleatório)', () => {
    assert.notEqual(tokenCrypto.encryptToken('abc'), tokenCrypto.encryptToken('abc'));
  });

  it('rejeita ciphertext adulterado pelo authTag', () => {
    const [iv, tag, cipher] = tokenCrypto.encryptToken('abc').split(':');
    const mexido = Buffer.from(cipher, 'base64');
    mexido[0] = mexido[0] ^ 0xff;
    assert.throws(() => tokenCrypto.decryptToken(`${iv}:${tag}:${mexido.toString('base64')}`));
  });

  it('deriva subchaves diferentes para info diferentes', () => {
    const a = tokenCrypto.deriveSubkey('arcanaforge:token-enc');
    const b = tokenCrypto.deriveSubkey('arcanaforge:oauth-state');
    assert.equal(a.length, 32);
    assert.notEqual(a.toString('hex'), b.toString('hex'));
  });

  it('não está configurado quando a chave falta', () => {
    delete process.env.GOOGLE_TOKEN_ENC_KEY;
    const semChave = loadFresh();
    assert.equal(semChave.isConfigured(), false);
    assert.throws(() => semChave.encryptToken('abc'));
  });

  it('não está configurado quando a chave não tem 32 bytes', () => {
    process.env.GOOGLE_TOKEN_ENC_KEY = Buffer.alloc(16, 1).toString('base64');
    assert.equal(loadFresh().isConfigured(), false);
  });
});
