const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Por que este é um arquivo separado, e não mais um describe em
// party.service.test.js:
// `cancelSession` dispara `syncProposal` via `const { syncProposal } =
// require('./google/calendarSync')` NO TOPO de party.service.js — uma
// desestruturação que roda uma única vez, na primeira vez que o módulo é
// carregado, e copia a referência da função para dentro do escopo de
// party.service.js. party.service.test.js já faz
// `require('./party.service')` para os testes de `proposeSession`, então a
// essa altura a referência real de `syncProposal` já foi capturada — trocar
// a propriedade `syncProposal` do módulo calendarSync DEPOIS não teria efeito
// nenhum sobre o que `cancelSession` chama.
//
// A saída limpa é fazer a troca ANTES do primeiro `require('./party.service')`
// deste processo. Como `node --test` roda cada arquivo `*.test.js` em um
// processo próprio (module cache isolado), colocar esse setup no topo de um
// arquivo novo garante que `party.service.js` ainda não foi carregado —
// desestruturar aqui já pega o stub, sem precisar mexer em require.cache.
const partyRepository = require('../repositories/party.repository');
const calendarSyncModule = require('./google/calendarSync');

const syncProposalState = { calls: [] };
const syncProposalOriginal = calendarSyncModule.syncProposal;
calendarSyncModule.syncProposal = async (args) => {
  syncProposalState.calls.push(args);
};

// eslint-disable-next-line global-require -- precisa vir depois do stub acima
const { createPartyService } = require('./party.service');

// Devolve a exportação real assim que party.service.js já desestruturou o
// stub: nada mais neste processo volta a chamar `require('./google/calendarSync')`
// pela primeira vez, então isto não afeta os testes abaixo.
calendarSyncModule.syncProposal = syncProposalOriginal;

const refs = { broadcastPartyRoster: () => {} };
const service = createPartyService(refs);

function criarProposta({ id = 'prop1', proposedBy, votos = {}, googleEvents = [] } = {}) {
  return {
    id,
    proposedBy,
    date: '2026-09-05',
    time: '19:00',
    timezone: 'America/Sao_Paulo',
    createdAt: new Date('2026-08-20T00:00:00Z'),
    responses: Object.entries(votos).map(([uid, vote]) => ({ uid, vote, respondedAt: new Date() })),
    googleEvents,
  };
}

// Fixture no formato de um documento Mongoose "vivo": tem `save()` e
// `toObject()`, mas NENHUM I/O de verdade — é o suficiente para exercitar
// cancelSession() sem banco.
function criarPartyFake({ ownerUid = 'owner1', membros, proposal, saveCalls }) {
  const party = {
    _id: 'party1',
    ownerUid,
    name: 'Mesa de teste',
    system: 'tormenta',
    members: membros.map((uid) => ({ uid })),
    sessionProposals: [proposal],
    // Se cancelSession regredir para `sessionProposals = filter(...); await party.save();`,
    // é este save() que dispara — e é exatamente o que os testes abaixo negam.
    save: async () => {
      saveCalls.push(true);
    },
    toObject() {
      return {
        _id: party._id,
        ownerUid: party.ownerUid,
        name: party.name,
        system: party.system,
        members: party.members.map((m) => ({ ...m })),
        sessionProposals: party.sessionProposals.map((p) => ({
          ...p,
          googleEvents: (p.googleEvents || []).map((e) => ({ ...e })),
          responses: (p.responses || []).map((r) => ({ ...r })),
        })),
      };
    },
  };
  return party;
}

describe('party.service — cancelSession (repositório e syncProposal stubados, sem banco)', () => {
  it('cancela via partyRepository.removeProposal ($pull) e NUNCA chama party.save() — trava a regressão do $set do array inteiro que apagou googleEvents de outra proposta', async () => {
    const saveCalls = [];
    const removeProposalCalls = [];
    const eventosOriginais = [
      { uid: 'owner1', eventId: 'ev-owner1', calendarId: 'cal-owner1' },
      { uid: 'member2', eventId: 'ev-member2', calendarId: 'cal-member2' },
    ];
    const proposal = criarProposta({
      proposedBy: 'member2',
      votos: { owner1: 'sim', member2: 'sim' },
      googleEvents: eventosOriginais,
    });
    const party = criarPartyFake({ ownerUid: 'owner1', membros: ['owner1', 'member2'], proposal, saveCalls });

    const findMemberPartyOriginal = partyRepository.findMemberParty;
    const removeProposalOriginal = partyRepository.removeProposal;
    partyRepository.findMemberParty = async (partyId, uid) => {
      assert.equal(partyId, 'party1');
      assert.equal(uid, 'member2');
      return party;
    };
    partyRepository.removeProposal = async (partyId, proposalId) => {
      removeProposalCalls.push({ partyId, proposalId });
    };
    syncProposalState.calls = [];

    try {
      await service.cancelSession('party1', 'prop1', 'member2');
    } finally {
      partyRepository.findMemberParty = findMemberPartyOriginal;
      partyRepository.removeProposal = removeProposalOriginal;
    }

    assert.deepEqual(removeProposalCalls, [{ partyId: 'party1', proposalId: 'prop1' }]);
    assert.equal(saveCalls.length, 0, 'party.save() não pode ser chamado — reintroduziria o bug de eventos órfãos');

    assert.equal(syncProposalState.calls.length, 1);
    const chamada = syncProposalState.calls[0];
    assert.equal(chamada.proposalRemoved, true);
    assert.deepEqual(chamada.eventsBefore, eventosOriginais);
  });

  it('dono do grupo (que não propôs a sessão) também pode cancelar', async () => {
    const saveCalls = [];
    const removeProposalCalls = [];
    const proposal = criarProposta({
      proposedBy: 'member2',
      votos: { owner1: 'sim', member2: 'nao' },
      googleEvents: [],
    });
    const party = criarPartyFake({ ownerUid: 'owner1', membros: ['owner1', 'member2'], proposal, saveCalls });

    const findMemberPartyOriginal = partyRepository.findMemberParty;
    const removeProposalOriginal = partyRepository.removeProposal;
    partyRepository.findMemberParty = async () => party;
    partyRepository.removeProposal = async (partyId, proposalId) => {
      removeProposalCalls.push({ partyId, proposalId });
    };
    syncProposalState.calls = [];

    try {
      await service.cancelSession('party1', 'prop1', 'owner1');
    } finally {
      partyRepository.findMemberParty = findMemberPartyOriginal;
      partyRepository.removeProposal = removeProposalOriginal;
    }

    assert.deepEqual(removeProposalCalls, [{ partyId: 'party1', proposalId: 'prop1' }]);
    assert.equal(saveCalls.length, 0);
    assert.equal(syncProposalState.calls.length, 1);
    assert.equal(syncProposalState.calls[0].proposalRemoved, true);
  });

  it('quem não é o proponente nem o dono do grupo é rejeitado com 403, e removeProposal NÃO é chamado', async () => {
    const saveCalls = [];
    const removeProposalCalls = [];
    const proposal = criarProposta({
      proposedBy: 'member2',
      votos: { owner1: 'sim', member2: 'sim', intruso: 'sim' },
      googleEvents: [{ uid: 'owner1', eventId: 'ev-owner1', calendarId: 'cal-owner1' }],
    });
    const party = criarPartyFake({
      ownerUid: 'owner1',
      membros: ['owner1', 'member2', 'intruso'],
      proposal,
      saveCalls,
    });

    const findMemberPartyOriginal = partyRepository.findMemberParty;
    const removeProposalOriginal = partyRepository.removeProposal;
    partyRepository.findMemberParty = async () => party;
    partyRepository.removeProposal = async (partyId, proposalId) => {
      removeProposalCalls.push({ partyId, proposalId });
    };
    syncProposalState.calls = [];

    try {
      await assert.rejects(
        () => service.cancelSession('party1', 'prop1', 'intruso'),
        (err) => {
          assert.equal(err.statusCode, 403);
          assert.equal(err.message, 'Só quem propôs ou o dono do grupo pode cancelar');
          return true;
        },
      );
    } finally {
      partyRepository.findMemberParty = findMemberPartyOriginal;
      partyRepository.removeProposal = removeProposalOriginal;
    }

    assert.equal(removeProposalCalls.length, 0, 'proposta rejeitada não pode chegar a remover nada');
    assert.equal(saveCalls.length, 0);
    assert.equal(syncProposalState.calls.length, 0, 'proposta rejeitada não pode disparar sync com o Google');
  });

  it('eventsBefore é lido ANTES do $pull — uma mutação simulada durante removeProposal não vaza para o snapshot mandado ao syncProposal', async () => {
    const saveCalls = [];
    const eventosOriginais = [{ uid: 'owner1', eventId: 'ev-owner1', calendarId: 'cal-owner1' }];
    const proposal = criarProposta({
      proposedBy: 'owner1',
      votos: { owner1: 'sim' },
      googleEvents: eventosOriginais,
    });
    const party = criarPartyFake({ ownerUid: 'owner1', membros: ['owner1'], proposal, saveCalls });

    const findMemberPartyOriginal = partyRepository.findMemberParty;
    const removeProposalOriginal = partyRepository.removeProposal;
    partyRepository.findMemberParty = async () => party;
    // Simula um $pull concorrente chegando durante a remoção: se cancelSession
    // lesse `proposal.googleEvents` DEPOIS de chamar removeProposal (em vez de
    // antes, como o código faz hoje), o evento "fantasma" abaixo vazaria para
    // `eventsBefore` — e o assert.deepEqual no final pegaria isso.
    partyRepository.removeProposal = async () => {
      proposal.googleEvents.push({ uid: 'fantasma', eventId: 'ev-fantasma', calendarId: 'cal-fantasma' });
    };
    syncProposalState.calls = [];

    try {
      await service.cancelSession('party1', 'prop1', 'owner1');
    } finally {
      partyRepository.findMemberParty = findMemberPartyOriginal;
      partyRepository.removeProposal = removeProposalOriginal;
    }

    assert.equal(syncProposalState.calls.length, 1);
    // Comparado contra um literal novo, não contra `eventosOriginais`: esse
    // array é a MESMA referência que `proposal.googleEvents` (criarProposta não
    // clona), então comparar com ele se auto-enganaria — o push do "fantasma"
    // também apareceria no "esperado" e a asserção nunca pegaria a regressão.
    assert.deepEqual(
      syncProposalState.calls[0].eventsBefore,
      [{ uid: 'owner1', eventId: 'ev-owner1', calendarId: 'cal-owner1' }],
      'eventsBefore não pode conter o evento "fantasma" inserido durante o $pull',
    );
  });
});
