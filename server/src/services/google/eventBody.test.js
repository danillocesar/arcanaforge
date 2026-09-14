const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildEventBody, SESSION_DURATION_HOURS } = require('./eventBody');

const base = {
  partyName: 'Culto ao Nicolas Cage',
  calendarUrl: 'http://localhost:5173/tormenta/party/p1/calendar',
  defaultTimezone: 'America/Sao_Paulo',
};

describe('buildEventBody', () => {
  it('usa dateTime e timeZone quando a proposta tem horário', () => {
    const body = buildEventBody({
      ...base,
      proposal: { date: '2026-09-03', time: '19:00', timezone: 'America/Sao_Paulo' },
    });
    assert.equal(body.start.dateTime, '2026-09-03T19:00:00');
    assert.equal(body.start.timeZone, 'America/Sao_Paulo');
    assert.equal(body.end.dateTime, '2026-09-03T23:00:00');
    assert.equal(body.end.timeZone, 'America/Sao_Paulo');
  });

  it('atravessa a meia-noite somando a duração', () => {
    const body = buildEventBody({
      ...base,
      proposal: { date: '2026-09-03', time: '22:00', timezone: 'America/Sao_Paulo' },
    });
    assert.equal(body.end.dateTime, '2026-09-04T02:00:00');
  });

  it('usa date com fim no dia seguinte quando não há horário', () => {
    const body = buildEventBody({ ...base, proposal: { date: '2026-09-03', time: '' } });
    assert.equal(body.start.date, '2026-09-03');
    assert.equal(body.end.date, '2026-09-04');
    assert.equal(body.start.dateTime, undefined);
  });

  it('cai no fuso padrão quando a proposta não tem fuso', () => {
    const body = buildEventBody({
      ...base,
      proposal: { date: '2026-09-03', time: '19:00', timezone: '' },
    });
    assert.equal(body.start.timeZone, 'America/Sao_Paulo');
  });

  it('nunca inclui attendees nem organizer', () => {
    const body = buildEventBody({
      ...base,
      proposal: { date: '2026-09-03', time: '19:00', timezone: 'America/Sao_Paulo' },
    });
    assert.equal(body.attendees, undefined);
    assert.equal(body.organizer, undefined);
  });

  it('põe o nome do grupo no título e o link na descrição', () => {
    const body = buildEventBody({ ...base, proposal: { date: '2026-09-03', time: '' } });
    assert.match(body.summary, /Culto ao Nicolas Cage/);
    assert.match(body.description, /localhost:5173/);
  });

  it('a duração padrão é 4 horas', () => {
    assert.equal(SESSION_DURATION_HOURS, 4);
  });

  it('rejeita data malformada', () => {
    assert.throws(
      () => buildEventBody({
        ...base,
        proposal: { date: '03-09-2026', time: '' },
      }),
      /Data inválida/
    );
  });

  it('rejeita horário sem padding (7:00 em vez de 07:00)', () => {
    assert.throws(
      () => buildEventBody({
        ...base,
        proposal: { date: '2026-09-03', time: '7:00', timezone: 'America/Sao_Paulo' },
      }),
      /Horário inválido/
    );
  });

  it('rejeita horário com hora fora do intervalo (25:00)', () => {
    assert.throws(
      () => buildEventBody({
        ...base,
        proposal: { date: '2026-09-03', time: '25:00', timezone: 'America/Sao_Paulo' },
      }),
      /Horário inválido/
    );
  });

  it('rejeita horário com minuto fora do intervalo (12:60)', () => {
    assert.throws(
      () => buildEventBody({
        ...base,
        proposal: { date: '2026-09-03', time: '12:60', timezone: 'America/Sao_Paulo' },
      }),
      /Horário inválido/
    );
  });
});
