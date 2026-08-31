const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { selectBackfillTargets, todayKey } = require('./backfill');

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
  it('pega proposta confirmada e futura, preservando a identidade de party e proposal', () => {
    const partyAlvo = party([confirmada('2026-09-10')]);
    const alvos = selectBackfillTargets({ parties: [partyAlvo], uid: 'a', today: HOJE });
    assert.equal(alvos.length, 1);
    // Não é só o filtro que importa: o consumidor (syncProposal) precisa dos
    // objetos originais, não de cópias — daí a checagem por identidade.
    assert.equal(alvos[0].party, partyAlvo);
    assert.equal(alvos[0].proposal, partyAlvo.sessionProposals[0]);
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

describe('todayKey', () => {
  // 01:00 UTC de 4/set: em UTC já é dia 4, mas em São Paulo (UTC-3, sem
  // horário de verão) ainda são 22:00 do dia 3. Momento escolhido a dedo
  // para os dois fusos DISCORDAREM — sem isso o teste passaria mesmo se o
  // parâmetro timeZone fosse ignorado, que é exatamente o bug do F1.
  const AGORA_NA_FRONTEIRA = new Date('2026-09-04T01:00:00Z');

  it('usa o fuso informado, não o do processo — America/Sao_Paulo e UTC divergem perto da meia-noite UTC', () => {
    assert.equal(todayKey('America/Sao_Paulo', AGORA_NA_FRONTEIRA), '2026-09-03');
    assert.equal(todayKey('UTC', AGORA_NA_FRONTEIRA), '2026-09-04');
  });

  it('não depende da hora em que a suíte roda (now injetado)', () => {
    const meioDiaUtc = new Date('2026-01-15T12:00:00Z');
    assert.equal(todayKey('UTC', meioDiaUtc), '2026-01-15');
  });
});
