const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Party = require('../../db/models/Party');
const partyRepository = require('./party.repository');

/**
 * O que estas três funções escrevem é a única defesa contra a classe de defeito
 * que a feature da Google Agenda já pagou duas vezes: um `$set` do array
 * inteiro, montado a partir do snapshot da requisição, apaga referências de
 * `googleEvents` gravadas concorrentemente e os eventos ficam de verdade na
 * agenda das pessoas, sem nada no banco apontando pra eles — indeletáveis.
 *
 * Os testes do `calendarSync` stubam estas funções, então cobrem o CHAMADOR e
 * não a correção: transformar `addProposalGoogleEvent` num no-op passava a
 * suíte inteira. Aqui a asserção é sobre o UPDATE DOCUMENT que cada função
 * manda ao Mongo.
 *
 * Como isso roda sem banco: `Model.updateOne(...)` devolve uma `Query` e só
 * executa no `.then()`/`.exec()`. O stub constrói a Query de verdade com o
 * `updateOne` original — só para ler `getFilter()`/`getUpdate()`, que é o que o
 * mongoose mandaria — e devolve uma promise resolvida no lugar dela, então
 * nada nunca é executado e nenhuma conexão é aberta. (O cast final dos valores
 * acontece no exec; o que se afirma aqui é a forma da operação.)
 */
async function capturarUpdates(fn) {
  const original = Party.updateOne;
  const chamadas = [];
  Party.updateOne = function stubUpdateOne(filter, update, options) {
    const query = original.call(this, filter, update, options);
    chamadas.push({ filter: query.getFilter(), update: query.getUpdate() });
    return Promise.resolve({ acknowledged: true, matchedCount: 1, modifiedCount: 1 });
  };
  try {
    await fn();
  } finally {
    Party.updateOne = original;
  }
  return chamadas;
}

/**
 * Nenhuma destas operações pode reescrever um array inteiro. O número esperado
 * de updates entra junto de propósito: sem ele, transformar a função num no-op
 * passaria por aqui em silêncio (zero chamadas, zero `$set`).
 */
function assertSemSet(chamadas, esperadas) {
  assert.equal(chamadas.length, esperadas, 'a função tem que emitir a operação, não virar no-op');
  for (const { update } of chamadas) {
    assert.equal(update.$set, undefined, `update não pode conter $set: ${JSON.stringify(update)}`);
    assert.equal(update.sessionProposals, undefined, 'update não pode reatribuir sessionProposals');
  }
}

const REF = { uid: 'u1', eventId: 'ev1', calendarId: 'cal1', createdAt: new Date('2026-09-01T00:00:00Z') };

describe('party.repository — addProposalGoogleEvent', () => {
  it('emite o $pull da entrada daquele uid E o $push da referência nova, nessa ordem', async () => {
    const chamadas = await capturarUpdates(() =>
      partyRepository.addProposalGoogleEvent('party1', 'prop1', REF),
    );

    assert.equal(chamadas.length, 2, 'são duas operações: o $pull do uid e o $push da nova');

    assert.deepEqual(chamadas[0].update, {
      $pull: { 'sessionProposals.$.googleEvents': { uid: 'u1' } },
    });
    assert.deepEqual(chamadas[1].update, {
      $push: { 'sessionProposals.$.googleEvents': REF },
    });
  });

  it('mira a proposta certa pelo operador posicional nos dois updates', async () => {
    const chamadas = await capturarUpdates(() =>
      partyRepository.addProposalGoogleEvent('party1', 'prop1', REF),
    );

    for (const { filter } of chamadas) {
      assert.deepEqual(filter, { _id: 'party1', 'sessionProposals.id': 'prop1' });
    }
    // Sem o `sessionProposals.id` no filtro o `$` não tem a que se referir e o
    // Mongo recusa a operação.
    for (const { update } of chamadas) {
      const caminho = Object.keys(update.$pull || update.$push)[0];
      assert.ok(caminho.startsWith('sessionProposals.$.'), `esperado caminho posicional, veio ${caminho}`);
    }
  });

  it('não reescreve a lista inteira', async () => {
    const chamadas = await capturarUpdates(() =>
      partyRepository.addProposalGoogleEvent('party1', 'prop1', REF),
    );
    assertSemSet(chamadas, 2);
  });

  it('o $pull é escopado ao uid da referência — não leva a entrada de outro membro', async () => {
    const chamadas = await capturarUpdates(() =>
      partyRepository.addProposalGoogleEvent('party1', 'prop1', { ...REF, uid: 'outro' }),
    );
    assert.deepEqual(chamadas[0].update.$pull['sessionProposals.$.googleEvents'], { uid: 'outro' });
  });
});

describe('party.repository — removeProposalGoogleEvent', () => {
  it('emite um único $pull escopado àquele uid, na proposta certa', async () => {
    const chamadas = await capturarUpdates(() =>
      partyRepository.removeProposalGoogleEvent('party1', 'prop1', 'u1'),
    );

    assert.equal(chamadas.length, 1);
    assert.deepEqual(chamadas[0].filter, { _id: 'party1', 'sessionProposals.id': 'prop1' });
    assert.deepEqual(chamadas[0].update, {
      $pull: { 'sessionProposals.$.googleEvents': { uid: 'u1' } },
    });
    assertSemSet(chamadas, 1);
  });
});

describe('party.repository — removeProposal', () => {
  it('remove a proposta por $pull no id, sem tocar nas outras', async () => {
    const chamadas = await capturarUpdates(() => partyRepository.removeProposal('party1', 'prop1'));

    assert.equal(chamadas.length, 1);
    assert.deepEqual(chamadas[0].filter, { _id: 'party1' });
    assert.deepEqual(chamadas[0].update, { $pull: { sessionProposals: { id: 'prop1' } } });
  });

  it('NÃO faz $set de sessionProposals — era esse $set que apagava googleEvents de outra proposta', async () => {
    const chamadas = await capturarUpdates(() => partyRepository.removeProposal('party1', 'prop1'));
    assertSemSet(chamadas, 1);
  });
});
