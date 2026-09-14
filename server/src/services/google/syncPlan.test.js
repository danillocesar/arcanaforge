const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isConfirmed, planSync } = require('./syncPlan');

const party = (votes) => ({
  members: [{ uid: 'a' }, { uid: 'b' }],
  sessionProposals: [],
  ...votes,
});

describe('isConfirmed', () => {
  it('confirma quando todos votaram sim', () => {
    const p = { responses: [{ uid: 'a', vote: 'sim' }, { uid: 'b', vote: 'sim' }] };
    assert.equal(isConfirmed(party(), p), true);
  });

  it('não confirma com voto pendente', () => {
    assert.equal(isConfirmed(party(), { responses: [{ uid: 'a', vote: 'sim' }] }), false);
  });

  it('não confirma com recusa', () => {
    const p = { responses: [{ uid: 'a', vote: 'sim' }, { uid: 'b', vote: 'nao' }] };
    assert.equal(isConfirmed(party(), p), false);
  });

  it('não confirma grupo sem membros', () => {
    assert.equal(isConfirmed({ members: [] }, { responses: [] }), false);
  });
});

describe('planSync', () => {
  const evento = (uid) => ({ uid, eventId: `ev-${uid}`, calendarId: `cal-${uid}` });

  it('cria para cada uid saudável quando cruza para confirmada', () => {
    const plano = planSync({
      prevConfirmed: false,
      nextConfirmed: true,
      proposalRemoved: false,
      healthyUids: ['a', 'b'],
      existingEvents: [],
    });
    assert.deepEqual(plano.toCreate, ['a', 'b']);
    assert.deepEqual(plano.toDelete, []);
  });

  it('não recria para quem já tem evento (idempotência por uid)', () => {
    const plano = planSync({
      prevConfirmed: false,
      nextConfirmed: true,
      proposalRemoved: false,
      healthyUids: ['a', 'b'],
      existingEvents: [evento('a')],
    });
    assert.deepEqual(plano.toCreate, ['b']);
  });

  it('não faz nada quando segue confirmada', () => {
    const plano = planSync({
      prevConfirmed: true,
      nextConfirmed: true,
      proposalRemoved: false,
      healthyUids: ['a'],
      existingEvents: [evento('a')],
    });
    assert.deepEqual(plano.toCreate, []);
    assert.deepEqual(plano.toDelete, []);
  });

  it('apaga tudo quando deixa de estar confirmada', () => {
    const plano = planSync({
      prevConfirmed: true,
      nextConfirmed: false,
      proposalRemoved: false,
      healthyUids: ['a', 'b'],
      existingEvents: [evento('a'), evento('b')],
    });
    assert.deepEqual(plano.toCreate, []);
    assert.deepEqual(plano.toDelete.map((e) => e.uid), ['a', 'b']);
  });

  it('apaga tudo quando a proposta é cancelada, mesmo seguindo confirmada', () => {
    const plano = planSync({
      prevConfirmed: true,
      nextConfirmed: true,
      proposalRemoved: true,
      healthyUids: ['a'],
      existingEvents: [evento('a')],
    });
    assert.deepEqual(plano.toDelete.map((e) => e.uid), ['a']);
    assert.deepEqual(plano.toCreate, []);
  });

  it('não faz nada quando nunca esteve confirmada', () => {
    const plano = planSync({
      prevConfirmed: false,
      nextConfirmed: false,
      proposalRemoved: false,
      healthyUids: ['a'],
      existingEvents: [],
    });
    assert.deepEqual(plano.toCreate, []);
    assert.deepEqual(plano.toDelete, []);
  });

  it('a deleção é dirigida por existingEvents, não pela lista atual de membros', () => {
    const plano = planSync({
      prevConfirmed: true,
      nextConfirmed: false,
      proposalRemoved: false,
      healthyUids: [],
      existingEvents: [evento('a')],
    });
    assert.deepEqual(plano.toDelete.map((e) => e.uid), ['a']);
  });

  it('de-duplica healthyUids e preserva ordem de primeira ocorrência', () => {
    const plano = planSync({
      prevConfirmed: false,
      nextConfirmed: true,
      proposalRemoved: false,
      healthyUids: ['a', 'a', 'b'],
      existingEvents: [],
    });
    assert.deepEqual(plano.toCreate, ['a', 'b']);
  });
});
