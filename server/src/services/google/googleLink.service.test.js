const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

process.env.GOOGLE_TOKEN_ENC_KEY = Buffer.alloc(32, 3).toString('base64');
process.env.GOOGLE_CLIENT_ID = 'client-id-teste';
process.env.GOOGLE_CLIENT_SECRET = 'client-secret-teste';

const service = require('./googleLink.service');
const repo = require('../../repositories/googleLink.repository');
const googleApi = require('./googleApi');
const { signState } = require('./oauthState');

describe('googleLink.service — safeReturnTo (guarda contra open redirect)', () => {
  it('mantém um caminho relativo de mesma origem', () => {
    assert.equal(service.safeReturnTo('/tormenta/party/abc/calendar'), '/tormenta/party/abc/calendar');
  });

  it('mantém a raiz', () => {
    assert.equal(service.safeReturnTo('/'), '/');
  });

  it('rejeita protocol-relative (//host) mesmo sem ponto no host', () => {
    assert.equal(service.safeReturnTo('//evilhost'), '/');
  });

  it('rejeita protocol-relative com domínio (//malicioso.com)', () => {
    assert.equal(service.safeReturnTo('//malicioso.com'), '/');
  });

  it('rejeita URL absoluta https', () => {
    assert.equal(service.safeReturnTo('https://malicioso.com'), '/');
  });

  it('rejeita URL absoluta http sem TLD', () => {
    assert.equal(service.safeReturnTo('http://evil'), '/');
  });

  it('rejeita esquema javascript:', () => {
    assert.equal(service.safeReturnTo('javascript:alert(1)'), '/');
  });

  it('rejeita caminho com querystring', () => {
    assert.equal(service.safeReturnTo('/caminho?a=1'), '/');
  });

  it('rejeita string vazia', () => {
    assert.equal(service.safeReturnTo(''), '/');
  });

  it('rejeita null', () => {
    assert.equal(service.safeReturnTo(null), '/');
  });

  it('rejeita undefined', () => {
    assert.equal(service.safeReturnTo(undefined), '/');
  });

  it('rejeita caminho com ".." (ponto fora do conjunto de caracteres aceito)', () => {
    assert.equal(service.safeReturnTo('/../etc'), '/');
  });
});

describe('googleLink.service — handleCallback: uid do state assinado vs. uid do documento gravado', () => {
  it('rejeita com 400 quando o state consumido pertence a outro uid, e nunca chama exchangeCode', async () => {
    // State assinado legitimamente para 'uid-legitimo'...
    const { state, nonce } = signState('uid-legitimo');

    // ...mas o documento de state supostamente gravado no banco (aqui
    // simulado) pertence a outro uid. Isso só aconteceria com um nonce
    // reaproveitado/forjado; o cross-check tem que barrar antes de qualquer
    // troca de código com o Google.
    const consumeStateOriginal = repo.consumeState;
    repo.consumeState = async () => ({ uid: 'uid-atacante', nonce, returnTo: '/x' });

    let exchangeCodeChamado = false;
    const exchangeCodeOriginal = googleApi.exchangeCode;
    googleApi.exchangeCode = async (...args) => {
      exchangeCodeChamado = true;
      return exchangeCodeOriginal(...args);
    };

    try {
      await assert.rejects(
        () => service.handleCallback({ code: 'codigo-qualquer', state }),
        (err) => {
          assert.equal(err.statusCode, 400);
          return true;
        },
      );
      assert.equal(exchangeCodeChamado, false, 'exchangeCode não deveria ter sido chamado');
    } finally {
      repo.consumeState = consumeStateOriginal;
      googleApi.exchangeCode = exchangeCodeOriginal;
    }
  });
});

describe('googleLink.service — handleCallback: returnTo anexado ao erro após o state ser consumido', () => {
  it('quando a troca de código falha depois do state válido e consumido, o erro carrega o returnTo gravado', async () => {
    const { state, nonce } = signState('uid-legitimo');

    const consumeStateOriginal = repo.consumeState;
    repo.consumeState = async () => (
      { uid: 'uid-legitimo', nonce, returnTo: '/tormenta/party/abc/calendar' }
    );

    const exchangeCodeOriginal = googleApi.exchangeCode;
    googleApi.exchangeCode = async () => {
      throw new Error('Google 500: falha simulada na troca de código');
    };

    try {
      await assert.rejects(
        () => service.handleCallback({ code: 'codigo-qualquer', state }),
        (err) => {
          assert.equal(err.returnTo, '/tormenta/party/abc/calendar');
          return true;
        },
      );
    } finally {
      repo.consumeState = consumeStateOriginal;
      googleApi.exchangeCode = exchangeCodeOriginal;
    }
  });

  it('quando o state é inválido (falha antes de ser consumido), o erro NÃO carrega returnTo', async () => {
    await assert.rejects(
      () => service.handleCallback({ code: 'codigo-qualquer', state: 'state-invalido-sem-ponto' }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.returnTo, undefined);
        return true;
      },
    );
  });
});
