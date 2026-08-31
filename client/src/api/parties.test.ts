import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiProposeSession } from './parties';
import type { Party } from '../types/party';

function minimalParty(): Party {
  return {
    id: 'party1',
    name: 'Grupo Teste',
    system: 'tormenta',
    inviteCode: 'ABC123',
    ownerUid: 'owner1',
    ownerEmail: 'owner@test.com',
    members: [],
    sessionProposals: [],
  };
}

function stubFetch() {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => minimalParty(),
    text: async () => '',
  })) as unknown as typeof fetch;
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function bodyFromCall(fetchMock: ReturnType<typeof stubFetch>) {
  const call = (fetchMock as unknown as { mock: { calls: [RequestInfo | URL, RequestInit][] } }).mock.calls[0];
  const init = call[1];
  return JSON.parse(init.body as string);
}

describe('apiProposeSession', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preenche o timezone do navegador quando o chamador não informa um', async () => {
    const fetchMock = stubFetch();

    await apiProposeSession('party1', { date: '2026-09-15', time: '19:00' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = bodyFromCall(fetchMock);
    expect(body.timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(body.timezone).toBeTruthy();
  });

  it('não sobrescreve um timezone informado explicitamente', async () => {
    const fetchMock = stubFetch();

    await apiProposeSession('party1', { date: '2026-09-15', time: '19:00', timezone: 'Europe/Lisbon' });

    const body = bodyFromCall(fetchMock);
    expect(body.timezone).toBe('Europe/Lisbon');
  });

  it('repassa date e time sem alterá-los', async () => {
    const fetchMock = stubFetch();

    await apiProposeSession('party1', { date: '2026-09-15', time: '19:00' });

    const body = bodyFromCall(fetchMock);
    expect(body.date).toBe('2026-09-15');
    expect(body.time).toBe('19:00');
  });

  it('funciona sem autenticação configurada (getToken nulo → sem header Authorization)', async () => {
    const fetchMock = stubFetch();

    await apiProposeSession('party1', { date: '2026-09-15' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = (fetchMock as unknown as { mock: { calls: [RequestInfo | URL, RequestInit][] } }).mock.calls[0];
    const init = call[1];
    const headers = init.headers as Headers;
    expect(headers.has('Authorization')).toBe(false);
  });
});
