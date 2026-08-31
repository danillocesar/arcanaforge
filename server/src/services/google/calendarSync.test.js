const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calendarUrl } = require('./calendarSync');

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
