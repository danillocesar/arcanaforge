const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

process.env.GOOGLE_TOKEN_ENC_KEY = Buffer.alloc(32, 3).toString('base64');
const { signState, verifyState } = require('./oauthState');

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
});
