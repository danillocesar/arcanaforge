import { apiFetch, assertOk } from './http';
import type { BillingStatus } from '../contexts/PlanContext';

export async function apiFetchBillingStatus(): Promise<BillingStatus> {
  const res = await apiFetch('/api/billing/status');
  await assertOk(res);
  return res.json();
}

export async function apiSubscribePro(): Promise<{ url: string }> {
  const res = await apiFetch('/api/billing/subscribe', { method: 'POST' });
  await assertOk(res);
  return res.json();
}

export async function apiBuySlot(): Promise<{ url: string }> {
  const res = await apiFetch('/api/billing/buy-slot', { method: 'POST' });
  await assertOk(res);
  return res.json();
}

export async function apiCancelSubscription(): Promise<{ ok: boolean }> {
  const res = await apiFetch('/api/billing/cancel', { method: 'POST' });
  await assertOk(res);
  return res.json();
}

export async function apiGetBillingPortal(): Promise<{ url: string }> {
  const res = await apiFetch('/api/billing/portal');
  await assertOk(res);
  return res.json();
}

export async function apiRestoreCharacter(id: string): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/api/characters/${encodeURIComponent(id)}/restore`, { method: 'POST' });
  await assertOk(res);
  return res.json();
}
