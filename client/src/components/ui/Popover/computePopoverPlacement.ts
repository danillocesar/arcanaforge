import type { PopoverPlacement, PopoverPlacementInput } from './PopoverPlacement';

const PAD = 8;
const GAP = 8;
const MIN_HEIGHT = 120;

/**
 * Posição do popover: abaixo do âncora por padrão; só vira para cima quando não
 * cabe embaixo e em cima há mais espaço. Se não couber em nenhum lado, limita a
 * altura ao espaço disponível (o painel rola por dentro) em vez de vazar da tela.
 */
export function computePopoverPlacement({
  anchor,
  panelWidth,
  panelHeight,
  viewportWidth,
  viewportHeight,
  align,
}: PopoverPlacementInput): PopoverPlacement {
  let left: number;
  if (align === 'start') left = anchor.left;
  else if (align === 'end') left = anchor.right - panelWidth;
  else left = anchor.left + anchor.width / 2 - panelWidth / 2;

  if (left + panelWidth > viewportWidth - PAD) left = viewportWidth - PAD - panelWidth;
  if (left < PAD) left = PAD;

  const spaceBelow = viewportHeight - anchor.bottom - GAP - PAD;
  const spaceAbove = anchor.top - GAP - PAD;
  const openUp = panelHeight > spaceBelow && spaceAbove > spaceBelow;
  const maxHeight = Math.max(openUp ? spaceAbove : spaceBelow, MIN_HEIGHT);
  const top = openUp
    ? Math.max(PAD, anchor.top - GAP - Math.min(panelHeight, maxHeight))
    : anchor.bottom + GAP;

  return { top, left, maxHeight };
}
