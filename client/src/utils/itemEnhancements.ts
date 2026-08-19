import {
  OFFICIAL_ITEM_ENHANCEMENTS,
  type ItemEnhancementTarget,
  type OfficialItemEnhancement,
} from '../data/itemEnhancements';
import type { FormValues } from '../components/sheet/SheetForm/SheetForm';

/** Entradas do catálogo aplicáveis a um tipo de item. */
export function enhancementsFor(target: ItemEnhancementTarget): OfficialItemEnhancement[] {
  return OFFICIAL_ITEM_ENHANCEMENTS.filter((e) => e.targets.includes(target));
}

/** `Melhoria: efeito` — a linha que a entrada deixa no campo de texto do item. */
function effectLine(entry: OfficialItemEnhancement): string {
  return `${entry.name}: ${entry.description}`;
}

const asRows = (raw: unknown): Record<string, unknown>[] =>
  Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];

/**
 * O que escolher uma melhoria/encanto muda no rascunho do item: anexa os efeitos
 * numéricos (quando existem), registra a linha de texto — que é a única forma de
 * um efeito procedural sobreviver — e liga `alwaysActive`, já que melhoria e encanto
 * valem sempre, não são conjurados.
 *
 * Devolve `{}` quando a entrada já está no item, pra o botão não empilhar duplicata.
 */
export function enhancementPatch(
  entry: OfficialItemEnhancement,
  values: FormValues,
): Partial<FormValues> {
  const line = effectLine(entry);
  const currentEffect = String(values.effect ?? '');
  if (currentEffect.includes(line)) return {};

  const patch: Partial<FormValues> = {
    effect: currentEffect ? `${currentEffect} · ${line}` : line,
    alwaysActive: 'true',
  };

  if (entry.attackModifiers?.length) {
    patch.attackModifiers = [
      ...asRows(values.attackModifiers),
      ...entry.attackModifiers,
    ] as FormValues['attackModifiers'];
  }
  if (entry.buffs?.length) {
    patch.buffs = [...asRows(values.buffs), ...entry.buffs] as FormValues['buffs'];
  }

  return patch;
}
