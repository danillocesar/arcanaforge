import { describe, it, expect } from 'vitest';
import { shouldAlert, __resetAlertThrottle } from './alertThrottle';

describe('shouldAlert', () => {
  it('allows the first alert and suppresses repeats inside the window', () => {
    __resetAlertThrottle();
    expect(shouldAlert('hp-sync:abc', 10_000, 1_000)).toBe(true);
    expect(shouldAlert('hp-sync:abc', 10_000, 5_000)).toBe(false);
    expect(shouldAlert('hp-sync:abc', 10_000, 10_999)).toBe(false);
  });

  it('allows again once the window has passed, restarting the window', () => {
    __resetAlertThrottle();
    expect(shouldAlert('k', 10_000, 1_000)).toBe(true);
    expect(shouldAlert('k', 10_000, 11_000)).toBe(true);
    expect(shouldAlert('k', 10_000, 12_000)).toBe(false);
  });

  it('suppressed attempts do not extend the window', () => {
    __resetAlertThrottle();
    expect(shouldAlert('k', 10_000, 1_000)).toBe(true);
    expect(shouldAlert('k', 10_000, 9_000)).toBe(false);
    // janela conta do último ALERTA mostrado (1s), não da última tentativa (9s)
    expect(shouldAlert('k', 10_000, 11_001)).toBe(true);
  });

  it('tracks keys independently', () => {
    __resetAlertThrottle();
    expect(shouldAlert('a', 10_000, 1_000)).toBe(true);
    expect(shouldAlert('b', 10_000, 1_000)).toBe(true);
    expect(shouldAlert('a', 10_000, 2_000)).toBe(false);
  });
});
