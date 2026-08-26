import type { Spell, Enhancement } from '../types/character';
import { OFFICIAL_SPELLS, type OfficialSpell } from '../data/spells';
import { normalizeSearch } from './formatters';

/**
 * Campos que a hidratação traz do catálogo quando o jogador não os editou. `mpCost`,
 * `summary`, `buffs`, `attackModifiers` e `buffTargetScope` são sempre do jogador.
 */
export const HYDRATED_FIELDS = [
  'school', 'castingTime', 'range', 'area', 'duration', 'resistance', 'description', 'enhancements',
] as const;
export type HydratedField = (typeof HYDRATED_FIELDS)[number];

type TextField = Exclude<HydratedField, 'enhancements'>;

function enhancementsSignature(list: Array<{ mpCost: number; description: string }> | undefined): string {
  return (list ?? []).map((e) => `${Number(e.mpCost) || 0}|${(e.description ?? '').trim()}`).join(' ');
}

function fieldDiffers(field: HydratedField, spell: Spell, official: OfficialSpell): boolean {
  if (field === 'enhancements') {
    return enhancementsSignature(spell.enhancements) !== enhancementsSignature(official.enhancements);
  }
  return String(spell[field] ?? '').trim() !== String(official[field] ?? '').trim();
}

/** Campos hidratáveis em que a magia da ficha difere do catálogo — o que vira `overrides`. */
export function computeSpellOverrides(spell: Spell, official: OfficialSpell): string[] {
  return HYDRATED_FIELDS.filter((f) => fieldDiffers(f, spell, official));
}

/**
 * Texto/custo dos aprimoramentos vêm do catálogo; `buffs`/`attackModifiers` que o jogador
 * configurou em cada linha ficam (casados por posição).
 */
function mergeEnhancements(mine: Enhancement[] | undefined, official: OfficialSpell['enhancements']): Enhancement[] {
  return official.map((o, i) => {
    const m = mine?.[i];
    return {
      mpCost: o.mpCost,
      description: o.description,
      ...(m?.buffs ? { buffs: m.buffs } : {}),
      ...(m?.attackModifiers ? { attackModifiers: m.attackModifiers } : {}),
    };
  });
}

/**
 * Magia com `catalogId`: os campos hidratáveis que o jogador não editou (`overrides`) vêm
 * do catálogo — assim correção/reimportação do catálogo chega à ficha. Sem `catalogId`
 * (personalizada) ou com id desconhecido, devolve a magia intacta.
 */
export function hydrateSpell(spell: Spell, catalog: OfficialSpell[] = OFFICIAL_SPELLS): Spell {
  if (!spell.catalogId) return spell;
  const official = catalog.find((s) => s.id === spell.catalogId);
  if (!official) return spell;
  const overrides = new Set(spell.overrides ?? []);
  const next: Spell = { ...spell };
  for (const field of HYDRATED_FIELDS) {
    if (overrides.has(field)) continue;
    if (field === 'enhancements') {
      next.enhancements = mergeEnhancements(spell.enhancements, official.enhancements);
    } else {
      next[field as TextField] = official[field as TextField];
    }
  }
  return next;
}

function findByName(name: string, catalog: OfficialSpell[]): OfficialSpell | undefined {
  const key = normalizeSearch(name);
  if (!key) return undefined;
  return catalog.find((s) => normalizeSearch(s.name) === key);
}

/**
 * Migração de leitura + hidratação. Magia sem `catalogId` cujo nome casa exatamente
 * (sem acento/caixa) com o catálogo recebe o id e guarda como `overrides` o que já
 * diferia — o texto novo do catálogo entra, mas nada que o jogador tinha se perde.
 * Idempotente. Devolve a mesma referência da lista quando nenhuma magia muda.
 */
export function hydrateSpells(spells: Spell[], catalog: OfficialSpell[] = OFFICIAL_SPELLS): Spell[] {
  let changed = false;
  const out = (spells ?? []).map((spell) => {
    if (spell.catalogId) {
      const hydrated = hydrateSpell(spell, catalog);
      if (hydrated !== spell) changed = true;
      return hydrated;
    }
    const official = findByName(spell.name, catalog);
    if (!official) return spell;
    changed = true;
    const migrated: Spell = {
      ...spell,
      name: official.name,
      catalogId: official.id,
      overrides: computeSpellOverrides(spell, official),
    };
    return hydrateSpell(migrated, catalog);
  });
  return changed ? out : spells;
}
