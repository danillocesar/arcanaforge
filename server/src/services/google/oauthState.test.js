const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

process.env.GOOGLE_TOKEN_ENC_KEY = Buffer.alloc(32, 3).toString('base64');
const { signState, verifyState } = require('./oauthState');
const { deriveSubkey } = require('./tokenCrypto');

describe('oauthState', () => {
  it('verifica um state que ele mesmo assinou', () => {
    const { state, nonce } = signState('uid-123');
    assert.deepEqual(verifyState(state), { uid: 'uid-123', nonce });
  });

  it('devolve nonce diferente a cada assinatura', () => {
    assert.notEqual(signState('uid-123').nonce, signState('uid-123').nonce);
  });

  it('rejeita assinatura adulterada', () => {
    const { state } = signState('uid-123');
    const [payload] = state.split('.');
    assert.equal(verifyState(`${payload}.YXNzaW5hdHVyYS1mYWxzYQ`), null);
  });

  it('rejeita payload trocado mantendo a assinatura antiga', () => {
    const { state } = signState('uid-123');
    const [, sig] = state.split('.');
    const outro = Buffer.from('uid-999.nonce.9999999999999', 'utf8').toString('base64url');
    assert.equal(verifyState(`${outro}.${sig}`), null);
  });

  it('rejeita state expirado', () => {
    const { state } = signState('uid-123', 60);
    assert.equal(verifyState(state, Date.now() + 61_000), null);
  });

  it('rejeita formato sem ponto', () => {
    assert.equal(verifyState('semponto'), null);
    assert.equal(verifyState(''), null);
  });

  it('devolve expiresAt coerente com o ttl', () => {
    const antes = Date.now();
    const { expiresAt } = signState('uid-123', 300);
    assert.ok(expiresAt.getTime() >= antes + 300_000);
  });

  it('uid contendo ponto faz round-trip intacto', () => {
    const { state, nonce } = signState('user.name@example.com');
    assert.deepEqual(verifyState(state), { uid: 'user.name@example.com', nonce });
  });

  it('rejeita payload válido em base64url mas não JSON', () => {
    const payloadB64 = Buffer.from('não-é-json', 'utf8').toString('base64url');
    const sig = crypto
      .createHmac('sha256', deriveSubkey('arcanaforge:oauth-state'))
      .update(payloadB64)
      .digest('base64url');
    assert.equal(verifyState(`${payloadB64}.${sig}`), null);
  });

  it('rejeita payload com exp não-numérico', () => {
    const payloadB64 = Buffer.from(JSON.stringify({ uid: 'user', nonce: 'abc', exp: 'não-número' }), 'utf8').toString('base64url');
    const sig = crypto
      .createHmac('sha256', deriveSubkey('arcanaforge:oauth-state'))
      .update(payloadB64)
      .digest('base64url');
    assert.equal(verifyState(`${payloadB64}.${sig}`), null);
  });

  it('rejeita payload sem uid', () => {
    const payloadB64 = Buffer.from(JSON.stringify({ nonce: 'abc', exp: Date.now() + 60000 }), 'utf8').toString('base64url');
    const sig = crypto
      .createHmac('sha256', deriveSubkey('arcanaforge:oauth-state'))
      .update(payloadB64)
      .digest('base64url');
    assert.equal(verifyState(`${payloadB64}.${sig}`), null);
  });
});
