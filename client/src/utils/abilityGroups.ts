import type { Ability } from '../types/character';

/** As cinco categorias oficiais de poder do T20, mais "Divino" e o escape "Outro". */
export const ABILITY_CATEGORIES = ['Combate', 'Destino', 'Magia', 'Concedido', 'Tormenta', 'Divino', 'Outro'] as const;

export const FAVORITES_GROUP_KEY = '__favorites__';
/** Habilidade de classe sem categoria do T20 — agrupa por si em vez de virar "Sem categoria". */
const ABILITY_KIND_GROUP_KEY = 'Habilidade';
const UNCATEGORISED_GROUP_KEY = 'Sem categoria';

/** Ordem de exibição: categorias oficiais, depois Outro, Habilidades e por fim os sem categoria. */
const GROUP_ORDER: string[] = [...ABILITY_CATEGORIES, ABILITY_KIND_GROUP_KEY, UNCATEGORISED_GROUP_KEY];

const GROUP_LABELS: Record<string, string> = {
  [FAVORITES_GROUP_KEY]: 'Favoritos',
  [ABILITY_KIND_GROUP_KEY]: 'Habilidades',
};

export interface AbilityGroupItem {
  /** Índice em `character.abilities` — preservado pra edição/remoção acertarem a entrada certa. */
  index: number;
  ability: Ability;
}

export interface AbilityGroup {
  key: string;
  label: string;
  items: AbilityGroupItem[];
}

/** Grupo a que um poder pertence: a categoria escolhida, senão o tipo da entrada.
 * "Outro" é especial: o texto da Fonte vira o nome do grupo, permitindo grupos livres. */
function groupKeyOf(ability: Ability): string {
  const type = (ability.type ?? '').trim();
  if (type === 'Outro') {
    const source = (ability.source ?? '').trim();
    if (source) return source;
  }
  if (type) return type;
  return ability.kind === 'Habilidade' ? ABILITY_KIND_GROUP_KEY : UNCATEGORISED_GROUP_KEY;
}

/**
 * Agrupa os poderes/habilidades para a aba Poderes: um grupo "Favoritos" fixo no
 * topo (os marcados, repetidos — o poder aparece nos dois lugares, como coleção na
 * Steam) seguido das categorias em ordem canônica. Grupo vazio não é devolvido.
 */
export function groupAbilities(abilities: Ability[]): AbilityGroup[] {
  const byKey = new Map<string, AbilityGroupItem[]>();
  const favorites: AbilityGroupItem[] = [];

  abilities.forEach((ability, index) => {
    const item = { index, ability };
    if (ability.favorite) favorites.push(item);
    const key = groupKeyOf(ability);
    byKey.set(key, [...(byKey.get(key) ?? []), item]);
  });

  // Chaves conhecidas na ordem canônica; qualquer categoria fora da lista (dado
  // antigo, texto digitado à mão) entra depois, em ordem alfabética.
  const knownKeys = GROUP_ORDER.filter((key) => byKey.has(key));
  const extraKeys = [...byKey.keys()].filter((key) => !GROUP_ORDER.includes(key)).sort();

  const groups: AbilityGroup[] = [...knownKeys, ...extraKeys].map((key) => ({
    key,
    label: GROUP_LABELS[key] ?? key,
    items: byKey.get(key) ?? [],
  }));

  if (favorites.length > 0) {
    groups.unshift({
      key: FAVORITES_GROUP_KEY,
      label: GROUP_LABELS[FAVORITES_GROUP_KEY],
      items: favorites,
    });
  }

  return groups;
}
