import { describe, it, expect } from 'vitest';
import { computePopoverPlacement } from './computePopoverPlacement';
import type { PopoverPlacementInput } from './PopoverPlacement';

function input(overrides: Partial<PopoverPlacementInput> = {}): PopoverPlacementInput {
  return {
    anchor: { top: 100, bottom: 140, left: 900, right: 1000, width: 100 },
    panelWidth: 260,
    panelHeight: 300,
    viewportWidth: 1366,
    viewportHeight: 768,
    align: 'end',
    ...overrides,
  };
}

describe('computePopoverPlacement', () => {
  it('abre embaixo do âncora quando cabe', () => {
    const p = computePopoverPlacement(input());
    expect(p.top).toBe(148);
    expect(p.left).toBe(740);
  });

  it('em 1366x768, painel alto com âncora no topo fica embaixo e rola, sem sair pela parte de cima', () => {
    const p = computePopoverPlacement(input({ panelHeight: 700 }));
    expect(p.top).toBe(148);
    expect(p.maxHeight).toBe(768 - 140 - 16);
  });

  it('vira para cima só quando em cima há mais espaço', () => {
    const anchor = { top: 600, bottom: 640, left: 900, right: 1000, width: 100 };
    const p = computePopoverPlacement(input({ anchor, panelHeight: 300 }));
    expect(p.top).toBe(600 - 8 - 300);
  });

  it('para cima, nunca passa do topo da viewport', () => {
    const anchor = { top: 600, bottom: 640, left: 900, right: 1000, width: 100 };
    const p = computePopoverPlacement(input({ anchor, panelHeight: 900 }));
    expect(p.top).toBe(8);
    expect(p.maxHeight).toBe(600 - 16);
  });

  it('prende o painel dentro da largura da viewport', () => {
    const anchor = { top: 100, bottom: 140, left: 10, right: 60, width: 50 };
    expect(computePopoverPlacement(input({ anchor, align: 'end' })).left).toBe(8);
  });
});
