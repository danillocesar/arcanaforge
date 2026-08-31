const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { selectBackfillTargets } = require('./backfill');

const HOJE = '2026-09-03';

const party = (proposals) => ({
  _id: 'p1',
  name: 'Grupo',
  members: [{ uid: 'a' }, { uid: 'b' }],
  sessionProposals: proposals,
});

const confirmada = (date, extra = {}) => ({
  id: `prop-${date}`,
  date,
  time: '19:00',
  responses: [{ uid: 'a', vote: 'sim' }, { uid: 'b', vote: 'sim' }],
  googleEvents: [],
  ...extra,
});

describe('selectBackfillTargets', () => {
  it('pega proposta confirmada e futura', () => {
    const alvos = selectBackfillTargets({ parties: [party([confirmada('2026-09-10')])], uid: 'a', today: HOJE });
    assert.equal(alvos.length, 1);
    assert.equal(alvos[0].proposal.date, '2026-09-10');
  });

  it('pega proposta confirmada de hoje', () => {
    const alvos = selectBackfillTargets({ parties: [party([confirmada(HOJE)])], uid: 'a', today: HOJE });
    assert.equal(alvos.length, 1);
  });

  it('ignora proposta confirmada no passado', () => {
    const alvos = selectBackfillTargets({ parties: [party([confirmada('2026-08-20')])], uid: 'a', today: HOJE });
    assert.deepEqual(alvos, []);
  });

  it('ignora proposta não confirmada', () => {
    const naoConfirmada = { ...confirmada('2026-09-10'), responses: [{ uid: 'a', vote: 'sim' }] };
    const alvos = selectBackfillTargets({ parties: [party([naoConfirmada])], uid: 'a', today: HOJE });
    assert.deepEqual(alvos, []);
  });

  it('ignora proposta que já tem evento para aquele uid', () => {
    const comEvento = confirmada('2026-09-10', {
      googleEvents: [{ uid: 'a', eventId: 'ev', calendarId: 'cal' }],
    });
    assert.deepEqual(selectBackfillTargets({ parties: [party([comEvento])], uid: 'a', today: HOJE }), []);
  });

  it('ainda pega quando o evento existente é de outro membro', () => {
    const comEvento = confirmada('2026-09-10', {
      googleEvents: [{ uid: 'b', eventId: 'ev', calendarId: 'cal' }],
    });
    assert.equal(selectBackfillTargets({ parties: [party([comEvento])], uid: 'a', today: HOJE }).length, 1);
  });
});
