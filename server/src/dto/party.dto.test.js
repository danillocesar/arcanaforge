const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { toPartyDTO } = require('./party.dto');

const doc = () => ({
  _id: 'party1',
  name: 'Mesa',
  ownerUid: 'a',
  ownerEmail: 'a@exemplo.com',
  members: [
    { uid: 'a', email: 'a@exemplo.com', characterIds: ['c1'], joinedAt: new Date() },
    { uid: 'b', email: 'b@exemplo.com' },
  ],
  sessionProposals: [
    {
      id: 'prop1',
      date: '2026-09-05',
      googleEvents: [
        { uid: 'a', eventId: 'ev-a', calendarId: 'cal-a' },
        { uid: 'b', eventId: 'ev-b', calendarId: 'cal-b' },
      ],
    },
  ],
});

// Spec §6: "o estado de link de cada um não é informação que os demais precisem
// ver". O cliente já mostrava só a própria entrada; era o fio que carregava as
// de todos, incluindo calendarId e eventId.
describe('toPartyDTO — googleEvents é por pessoa', () => {
  it('devolve só a entrada de quem está pedindo', () => {
    const dto = toPartyDTO(doc(), 'a');
    assert.deepEqual(dto.sessionProposals[0].googleEvents, [
      { uid: 'a', eventId: 'ev-a', calendarId: 'cal-a' },
    ]);
  });

  it('não vaza a entrada de outro membro', () => {
    const dto = toPartyDTO(doc(), 'b');
    assert.deepEqual(dto.sessionProposals[0].googleEvents.map((e) => e.uid), ['b']);
  });

  it('devolve lista vazia para quem não tem entrada', () => {
    const dto = toPartyDTO(doc(), 'c');
    assert.deepEqual(dto.sessionProposals[0].googleEvents, []);
  });

  it('sem viewerUid não vaza nada (lado seguro)', () => {
    const dto = toPartyDTO(doc());
    assert.deepEqual(dto.sessionProposals[0].googleEvents, []);
  });

  it('não mexe no documento de origem nem nos outros campos da proposta', () => {
    const original = doc();
    const dto = toPartyDTO(original, 'a');
    assert.equal(original.sessionProposals[0].googleEvents.length, 2);
    assert.equal(dto.sessionProposals[0].id, 'prop1');
    assert.equal(dto.sessionProposals[0].date, '2026-09-05');
    assert.equal(dto.id, 'party1');
    assert.equal(dto.ownerEmail, undefined);
  });

  it('proposta sem googleEvents sai com lista vazia', () => {
    const semEventos = doc();
    delete semEventos.sessionProposals[0].googleEvents;
    assert.deepEqual(toPartyDTO(semEventos, 'a').sessionProposals[0].googleEvents, []);
  });
});
