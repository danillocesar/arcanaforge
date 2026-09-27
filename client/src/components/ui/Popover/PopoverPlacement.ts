export type PopoverAlign = 'start' | 'center' | 'end';

/** Retângulo do âncora e medidas do painel/viewport usadas no cálculo. */
export interface PopoverPlacementInput {
  anchor: { top: number; bottom: number; left: number; right: number; width: number };
  panelWidth: number;
  /** Altura natural do conteúdo, sem o maxHeight de um cálculo anterior. */
  panelHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  align: PopoverAlign;
}

export interface PopoverPlacement {
  top: number;
  left: number;
  maxHeight: number;
}
