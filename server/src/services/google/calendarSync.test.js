const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calendarUrl, syncProposal } = require('./calendarSync');
const googleApi = require('./googleApi');
const googleLinkService = require('./googleLink.service');
const linkRepo = require('../../repositories/googleLink.repository');
const partyRepository = require('../../repositories/party.repository');

describe('calendarUrl', () => {
  it('usa o system do grupo quando presente (tormenta)', () => {
    const url = calendarUrl({ system: 'tormenta', _id: 'party1' });
    assert.equal(url, 'http://localhost:5173/tormenta/party/party1/calendar');
  });

  it('usa o system do grupo quando presente (outro sistema)', () => {
    const url = calendarUrl({ system: 'naruto', _id: 'party2' });
    assert.equal(url, 'http://localhost:5173/naruto/party/party2/calendar');
  });

  it('cai em "tormenta" quando o system está ausente', () => {
    const url = calendarUrl({ _id: 'party3' });
    assert.equal(url, 'http://localhost:5173/tormenta/party/party3/calendar');
  });

  it('cai em "tormenta" quando o system é string vazia', () => {
    const url = calendarUrl({ system: '', _id: 'party4' });
    assert.equal(url, 'http://localhost:5173/tormenta/party/party4/calendar');
  });
});

/**
 * Fan-out de syncProposal, o único orquestrador impuro da feature. O módulo é
 * CJS e todo o I/O passa por objetos de módulo (`googleApi.insertEvent`,
 * `googleLinkService.getAccessTokenFor`, os dois repositories), então trocar
 * essas propriedades é suficiente: nada aqui toca rede nem Mongo. `syncPlan` e
 * `eventBody` ficam REAIS de propósito — as duas garantias sob teste (o filtro
 * de sobreviventes e "só GoogleAuthError latcha") dependem da decisão do plano
 * de verdade, e a validação do corpo do evento também.
 */
function membros(...uids) {
  return uids.map((uid) => ({ uid }));
}

function proposta({ id = 'prop1', date = '2026-09-05', votos = {} } = {}) {
  return {
    id,
    date,
    time: '19:00',
    timezone: 'America/Sao_Paulo',
    responses: Object.entries(votos).map(([uid, vote]) => ({ uid, vote })),
  };
}

async function rodarSync({ stubs = {}, args }) {
  const chamadas = {
    insertEvent: [],
    deleteEvent: [],
    setLastError: [],
    gravou: [],
    removeu: [],
    logs: [],
  };

  const originais = {
    isEnabled: googleLinkService.isEnabled,
    getAccessTokenFor: googleLinkService.getAccessTokenFor,
    defaultTimezone: googleLinkService.defaultTimezone,
    insertEvent: googleApi.insertEvent,
    deleteEvent: googleApi.deleteEvent,
    findHealthyByUids: linkRepo.findHealthyByUids,
    setLastError: linkRepo.setLastError,
    add: partyRepository.addProposalGoogleEvent,
    remove: partyRepository.removeProposalGoogleEvent,
    consoleError: console.error,
  };

  googleLinkService.isEnabled = () => true;
  googleLinkService.defaultTimezone = () => 'America/Sao_Paulo';
  googleLinkService.getAccessTokenFor =
    stubs.getAccessTokenFor
    || (async (uid) => ({ accessToken: `token-${uid}`, calendarId: `cal-${uid}` }));

  googleApi.insertEvent = async (_accessToken, calendarId, body) => {
    chamadas.insertEvent.push({ calendarId, body });
    if (stubs.insertEvent) return stubs.insertEvent(calendarId);
    return `ev-${calendarId}`;
  };
  googleApi.deleteEvent = async (_accessToken, calendarId, eventId) => {
    chamadas.deleteEvent.push({ calendarId, eventId });
    if (stubs.deleteEvent) await stubs.deleteEvent(calendarId, eventId);
  };

  linkRepo.findHealthyByUids = async () => (stubs.healthyUids || []).map((uid) => ({ _id: uid }));
  linkRepo.setLastError = async (uid, message) => {
    chamadas.setLastError.push({ uid, message });
  };

  partyRepository.addProposalGoogleEvent = async (partyId, proposalId, ref) => {
    chamadas.gravou.push({ partyId, proposalId, ref });
  };
  partyRepository.removeProposalGoogleEvent = async (partyId, proposalId, uid) => {
    chamadas.removeu.push({ partyId, proposalId, uid });
  };

  // syncProposal nunca lança: loga. O teste captura em vez de sujar a saída.
  console.error = (...partes) => {
    chamadas.logs.push(partes.map((p) => (p instanceof Error ? p.message : String(p))).join(' '));
  };

  try {
    await syncProposal(args);
  } finally {
    googleLinkService.isEnabled = originais.isEnabled;
    googleLinkService.getAccessTokenFor = originais.getAccessTokenFor;
    googleLinkService.defaultTimezone = originais.defaultTimezone;
    googleApi.insertEvent = originais.insertEvent;
    googleApi.deleteEvent = originais.deleteEvent;
    linkRepo.findHealthyByUids = originais.findHealthyByUids;
    linkRepo.setLastError = originais.setLastError;
    partyRepository.addProposalGoogleEvent = originais.add;
    partyRepository.removeProposalGoogleEvent = originais.remove;
    console.error = originais.consoleError;
  }

  return chamadas;
}

const PARTY = { _id: 'party1', name: 'Mesa', system: 'tormenta', members: membros('a', 'b') };

describe('syncProposal — criação', () => {
  it('grava a referência de cada criação confirmada, por uid', async () => {
    const chamadas = await rodarSync({
      stubs: { healthyUids: ['a', 'b'] },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'sim' } }),
        prevConfirmed: false,
        proposalRemoved: false,
        eventsBefore: [],
      },
    });

    assert.equal(chamadas.insertEvent.length, 2);
    assert.deepEqual(
      chamadas.gravou.map((g) => ({ uid: g.ref.uid, eventId: g.ref.eventId })),
      [
        { uid: 'a', eventId: 'ev-cal-a' },
        { uid: 'b', eventId: 'ev-cal-b' },
      ],
    );
    assert.equal(chamadas.gravou[0].partyId, 'party1');
    assert.equal(chamadas.gravou[0].proposalId, 'prop1');
    assert.equal(chamadas.setLastError.length, 0);
  });

  it('pula quem não tem link saudável (só os saudáveis viram evento)', async () => {
    const chamadas = await rodarSync({
      stubs: { healthyUids: ['a'] },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'sim' } }),
        prevConfirmed: false,
        proposalRemoved: false,
        eventsBefore: [],
      },
    });

    assert.deepEqual(chamadas.insertEvent.map((c) => c.calendarId), ['cal-a']);
    assert.deepEqual(chamadas.gravou.map((g) => g.ref.uid), ['a']);
  });

  it('idempotência por uid: quem já tem entrada em googleEvents não recebe outro evento', async () => {
    const chamadas = await rodarSync({
      stubs: { healthyUids: ['a', 'b'] },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'sim' } }),
        prevConfirmed: false,
        proposalRemoved: false,
        eventsBefore: [{ uid: 'a', eventId: 'ev-antigo', calendarId: 'cal-a' }],
      },
    });

    assert.deepEqual(chamadas.insertEvent.map((c) => c.calendarId), ['cal-b']);
    assert.deepEqual(chamadas.gravou.map((g) => g.ref.uid), ['b']);
  });

  // A regra que protege o requisito mais duro do usuário: um erro qualquer do
  // Google não pode marcar o link de ninguém como quebrado. Alargar este catch
  // tem que quebrar um teste.
  it('um Error comum de insertEvent NÃO chama setLastError e não grava referência', async () => {
    const chamadas = await rodarSync({
      stubs: {
        healthyUids: ['a'],
        insertEvent: () => {
          throw new Error('Falha transiente ao criar evento: 403');
        },
      },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'sim' } }),
        prevConfirmed: false,
        proposalRemoved: false,
        eventsBefore: [],
      },
    });

    assert.equal(chamadas.setLastError.length, 0, 'erro transiente não pode latchar o link');
    assert.equal(chamadas.gravou.length, 0);
    assert.equal(chamadas.logs.length, 1);
  });

  it('um GoogleAuthError de insertEvent chama setLastError e não grava referência', async () => {
    const chamadas = await rodarSync({
      stubs: {
        healthyUids: ['a'],
        insertEvent: () => {
          throw new googleApi.GoogleAuthError('calendário não encontrado');
        },
      },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'sim' } }),
        prevConfirmed: false,
        proposalRemoved: false,
        eventsBefore: [],
      },
    });

    assert.deepEqual(chamadas.setLastError, [
      { uid: 'a', message: 'calendário não encontrado' },
    ]);
    assert.equal(chamadas.gravou.length, 0);
  });

  it('falha em um membro não impede o outro', async () => {
    const chamadas = await rodarSync({
      stubs: {
        healthyUids: ['a', 'b'],
        insertEvent: (calendarId) => {
          if (calendarId === 'cal-a') throw new Error('Falha ao criar evento: 500');
          return 'ev-b';
        },
      },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'sim' } }),
        prevConfirmed: false,
        proposalRemoved: false,
        eventsBefore: [],
      },
    });

    assert.deepEqual(chamadas.gravou.map((g) => g.ref.uid), ['b']);
    assert.equal(chamadas.setLastError.length, 0);
  });

  it('buildEventBody inválido não chama o Google e não persiste nada', async () => {
    const chamadas = await rodarSync({
      stubs: { healthyUids: ['a', 'b'] },
      args: {
        party: PARTY,
        // Data fora de YYYY-MM-DD: buildEventBody lança antes de qualquer
        // chamada ao Google.
        proposal: proposta({ date: '05/09/2026', votos: { a: 'sim', b: 'sim' } }),
        prevConfirmed: false,
        proposalRemoved: false,
        eventsBefore: [],
      },
    });

    assert.equal(chamadas.insertEvent.length, 0);
    assert.equal(chamadas.gravou.length, 0);
    assert.equal(chamadas.setLastError.length, 0);
    assert.equal(chamadas.logs.length, 2, 'um log por membro');
  });
});

describe('syncProposal — deleção e filtro de sobreviventes', () => {
  const EVENTOS = [
    { uid: 'a', eventId: 'ev-a', calendarId: 'cal-a' },
    { uid: 'b', eventId: 'ev-b', calendarId: 'cal-b' },
  ];

  // O coração do filtro de sobreviventes: só a deleção CONFIRMADA tira a
  // referência. Quem falhou mantém a dela, que é o único jeito de tentar apagar
  // o evento (que continua na agenda da pessoa) mais tarde.
  it('deleção confirmada remove a referência; a que falhou mantém a dela', async () => {
    const chamadas = await rodarSync({
      stubs: {
        healthyUids: ['a', 'b'],
        deleteEvent: (calendarId) => {
          if (calendarId === 'cal-a') throw new Error('Falha ao apagar evento: 500');
        },
      },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'nao' } }),
        prevConfirmed: true,
        proposalRemoved: false,
        eventsBefore: EVENTOS,
      },
    });

    assert.deepEqual(chamadas.deleteEvent.map((c) => c.calendarId), ['cal-a', 'cal-b']);
    assert.deepEqual(chamadas.removeu.map((r) => r.uid), ['b']);
    assert.equal(chamadas.setLastError.length, 0, 'erro transiente não pode latchar o link');
    assert.equal(chamadas.logs.length, 1);
  });

  it('GoogleAuthError na deleção latcha o link daquele membro e mantém a referência', async () => {
    const chamadas = await rodarSync({
      stubs: {
        healthyUids: ['a', 'b'],
        deleteEvent: (calendarId) => {
          if (calendarId === 'cal-a') throw new googleApi.GoogleAuthError('Calendar 401');
        },
      },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'nao' } }),
        prevConfirmed: true,
        proposalRemoved: false,
        eventsBefore: EVENTOS,
      },
    });

    assert.deepEqual(chamadas.setLastError, [{ uid: 'a', message: 'Calendar 401' }]);
    assert.deepEqual(chamadas.removeu.map((r) => r.uid), ['b']);
  });

  it('membro sem token utilizável mantém a referência, e isso não latcha nada', async () => {
    const chamadas = await rodarSync({
      stubs: {
        healthyUids: ['a', 'b'],
        getAccessTokenFor: async (uid) => (
          uid === 'a' ? null : { accessToken: 'token-b', calendarId: 'cal-b' }
        ),
      },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'nao' } }),
        prevConfirmed: true,
        proposalRemoved: false,
        eventsBefore: EVENTOS,
      },
    });

    assert.deepEqual(chamadas.deleteEvent.map((c) => c.calendarId), ['cal-b']);
    assert.deepEqual(chamadas.removeu.map((r) => r.uid), ['b']);
    assert.equal(chamadas.setLastError.length, 0);
  });

  it('proposta cancelada apaga os eventos e não escreve nada no documento', async () => {
    const chamadas = await rodarSync({
      stubs: { healthyUids: ['a', 'b'] },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'sim' } }),
        prevConfirmed: true,
        proposalRemoved: true,
        eventsBefore: EVENTOS,
      },
    });

    assert.deepEqual(chamadas.deleteEvent.map((c) => c.eventId), ['ev-a', 'ev-b']);
    assert.equal(chamadas.removeu.length, 0, 'a proposta já saiu do documento: nada a gravar');
    assert.equal(chamadas.gravou.length, 0);
  });

  it('confirmada → confirmada não cria nem apaga nada', async () => {
    const chamadas = await rodarSync({
      stubs: { healthyUids: ['a', 'b'] },
      args: {
        party: PARTY,
        proposal: proposta({ votos: { a: 'sim', b: 'sim' } }),
        prevConfirmed: true,
        proposalRemoved: false,
        eventsBefore: EVENTOS,
      },
    });

    assert.equal(chamadas.insertEvent.length, 0);
    assert.equal(chamadas.deleteEvent.length, 0);
    assert.equal(chamadas.gravou.length, 0);
    assert.equal(chamadas.removeu.length, 0);
  });
});
