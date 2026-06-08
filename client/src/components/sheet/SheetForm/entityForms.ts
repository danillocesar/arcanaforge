import type {
  Character,
  AttributeId,
  BuffType,
  AbilityKind,
  InventoryCategory,
} from '../../../types/character';
import { BUFF_TYPES } from '../../../data/constants';
import { ATTRIBUTE_FULL_NAMES } from '../../../data/atributos';
import { SKILLS_CONFIG } from '../../../data/pericias';
import type { FieldDescriptor, FormValues } from './SheetForm';

export type EntityKind =
  | 'poder'
  | 'habilidade'
  | 'magia'
  | 'buff'
  | 'arma'
  | 'armadura'
  | 'acessorio'
  | 'comum'
  | 'consumivel';

export interface EntityConfig {
  title: string;
  fields: FieldDescriptor[];
  /** Draft for a new entry. */
  empty: () => FormValues;
  /** Draft from an existing entry (edit-on-click). */
  fromEntry: (char: Character, index: number) => FormValues;
  /** Add (index undefined) or update (by index) the entry; returns next Character. */
  apply: (char: Character, values: FormValues, index?: number) => Character;
  /** Remove the entry at index. */
  remove: (char: Character, index: number) => Character;
}

const s = (v: unknown): string => String(v ?? '');
const n = (v: unknown): number => Number(v ?? 0) || 0;

function upsert<T>(list: T[], entry: T, index?: number): T[] {
  if (index == null) return [...list, entry];
  const next = [...list];
  next[index] = entry;
  return next;
}

const attrOptions = (Object.entries(ATTRIBUTE_FULL_NAMES) as [AttributeId, string][]).map(
  ([value, label]) => ({ value, label }),
);
const buffTypeOptions = Object.entries(BUFF_TYPES).map(([value, label]) => ({ value, label }));
const skillOptions = SKILLS_CONFIG.map((sk) => ({ value: sk.id, label: sk.name }));
const rangeOptions = [
  { value: 'melee', label: 'Corpo a corpo' },
  { value: 'ranged', label: 'À distância' },
];

/* ─────────────────────────── Poder / Habilidade ─────────────────────────── */

const abilityFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome' },
  { key: 'source', label: 'Fonte', type: 'text', placeholder: 'Classe, raça, origem…', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Efeito / regras' },
];

function abilityConfig(kind: AbilityKind): EntityConfig {
  return {
    title: kind,
    fields: abilityFields,
    empty: () => ({ name: '', source: '', mpCost: 0, description: '' }),
    fromEntry: (c, i) => {
      const a = c.abilities[i];
      return { name: a.name, source: a.source, mpCost: a.mpCost, description: a.description };
    },
    apply: (c, v, i) => {
      const base = i != null ? c.abilities[i] : { name: '', source: '', type: '', mpCost: 0, description: '' };
      const entry = {
        ...base,
        name: s(v.name),
        source: s(v.source),
        kind,
        mpCost: n(v.mpCost),
        description: s(v.description),
      };
      return { ...c, abilities: upsert(c.abilities, entry, i) };
    },
    remove: (c, i) => ({ ...c, abilities: c.abilities.filter((_, idx) => idx !== i) }),
  };
}

/* ─────────────────────────────── Magia ─────────────────────────────────── */

const spellFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome da magia' },
  { key: 'school', label: 'Escola', type: 'text', half: true },
  { key: 'spellLevel', label: 'Círculo', type: 'number', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'castingTime', label: 'Execução', type: 'text', half: true },
  { key: 'range', label: 'Alcance', type: 'text', half: true },
  { key: 'area', label: 'Área/Alvo', type: 'text', half: true },
  { key: 'duration', label: 'Duração', type: 'text', half: true },
  { key: 'resistance', label: 'Resistência', type: 'text', half: true },
  { key: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Efeito da magia' },
];

const magiaConfig: EntityConfig = {
  title: 'Magia',
  fields: spellFields,
  empty: () => ({
    name: '', school: '', spellLevel: 1, mpCost: 1, castingTime: '', range: '',
    area: '', duration: '', resistance: '', description: '',
  }),
  fromEntry: (c, i) => {
    const sp = c.spells[i];
    return {
      name: sp.name, school: sp.school, spellLevel: sp.spellLevel, mpCost: sp.mpCost,
      castingTime: sp.castingTime, range: sp.range, area: sp.area, duration: sp.duration,
      resistance: sp.resistance, description: sp.description,
    };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.spells[i] : { enhancements: [] };
    const entry = {
      ...base,
      name: s(v.name), school: s(v.school), spellLevel: n(v.spellLevel), mpCost: n(v.mpCost),
      castingTime: s(v.castingTime), range: s(v.range), area: s(v.area), duration: s(v.duration),
      resistance: s(v.resistance), description: s(v.description),
      enhancements: (base as { enhancements?: unknown[] }).enhancements ?? [],
    } as Character['spells'][number];
    return { ...c, spells: upsert(c.spells, entry, i) };
  },
  remove: (c, i) => ({ ...c, spells: c.spells.filter((_, idx) => idx !== i) }),
};

/* ─────────────────────────────── Buff ──────────────────────────────────── */

const buffFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do buff/condição' },
  { key: 'type', label: 'Tipo', type: 'select', options: buffTypeOptions, half: true },
  { key: 'value', label: 'Valor', type: 'text', placeholder: 'Ex.: 2 ou 1d6', half: true },
  {
    key: 'attributeId', label: 'Atributo', type: 'select', options: attrOptions, half: true,
    showIf: (v) => v.type === 'attribute',
  },
  {
    key: 'skillId', label: 'Perícia', type: 'select', options: skillOptions, half: true,
    showIf: (v) => v.type === 'skill',
  },
  { key: 'mp', label: 'Custo (PM)', type: 'number', half: true },
];

const buffConfig: EntityConfig = {
  title: 'Buff / Condição',
  fields: buffFields,
  empty: () => ({ name: '', type: 'attribute', value: '', attributeId: 'str', skillId: '', mp: 0 }),
  fromEntry: (c, i) => {
    const b = c.buffs[i];
    return {
      name: b.name, type: b.type, value: b.value, mp: b.mp,
      attributeId: b.attributeId ?? 'str', skillId: b.skillId ?? '',
    };
  },
  apply: (c, v, i) => {
    const type = s(v.type) as BuffType;
    const base = i != null ? c.buffs[i] : { active: false };
    const entry = {
      ...base,
      name: s(v.name),
      type,
      value: s(v.value),
      mp: n(v.mp),
      attributeId: type === 'attribute' ? (s(v.attributeId) as AttributeId) : undefined,
      skillId: type === 'skill' ? s(v.skillId) : undefined,
      active: (base as { active?: boolean }).active ?? false,
    } as Character['buffs'][number];
    return { ...c, buffs: upsert(c.buffs, entry, i) };
  },
  remove: (c, i) => ({ ...c, buffs: c.buffs.filter((_, idx) => idx !== i) }),
};

/* ─────────────────────────────── Arma ──────────────────────────────────── */

const armaFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome da arma' },
  { key: 'damage', label: 'Dano', type: 'text', placeholder: 'Ex.: 1d8', half: true },
  { key: 'critical', label: 'Crítico', type: 'text', placeholder: 'Ex.: 19/x2', half: true },
  { key: 'rangeType', label: 'Alcance', type: 'select', options: rangeOptions, half: true },
  { key: 'attributeDamageBonus', label: 'Atributo de dano', type: 'select', options: attrOptions, half: true },
  { key: 'type', label: 'Tipo de dano', type: 'text', placeholder: 'Corte, perfuração…', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
];

const armaConfig: EntityConfig = {
  title: 'Arma',
  fields: armaFields,
  empty: () => ({ name: '', damage: '', critical: '', rangeType: 'melee', attributeDamageBonus: 'str', type: '', mpCost: 0 }),
  fromEntry: (c, i) => {
    const a = c.attacks[i];
    return {
      name: a.name, damage: a.damage, critical: a.critical, rangeType: a.rangeType,
      attributeDamageBonus: a.attributeDamageBonus || 'str', type: a.type, mpCost: a.mpCost,
    };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.attacks[i] : { extraBonuses: [], extraDamage: [] };
    const entry = {
      ...base,
      name: s(v.name), damage: s(v.damage), critical: s(v.critical),
      rangeType: s(v.rangeType), attributeDamageBonus: s(v.attributeDamageBonus),
      type: s(v.type), mpCost: n(v.mpCost),
      extraBonuses: (base as { extraBonuses?: unknown[] }).extraBonuses ?? [],
      extraDamage: (base as { extraDamage?: unknown[] }).extraDamage ?? [],
    } as Character['attacks'][number];
    return { ...c, attacks: upsert(c.attacks, entry, i) };
  },
  remove: (c, i) => ({ ...c, attacks: c.attacks.filter((_, idx) => idx !== i) }),
};

/* ───────────────────────────── Armadura ────────────────────────────────── */

const armaduraConfig: EntityConfig = {
  title: 'Armadura',
  fields: [
    { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome da proteção' },
    { key: 'value', label: 'Bônus de Defesa', type: 'number', half: true },
    { key: 'penalty', label: 'Penalidade', type: 'number', half: true },
  ],
  empty: () => ({ name: '', value: 0, penalty: 0 }),
  fromEntry: (c, i) => {
    const d = c.defense.items[i];
    return { name: d.name, value: d.value, penalty: d.penalty };
  },
  apply: (c, v, i) => {
    const entry = { name: s(v.name), value: n(v.value), penalty: n(v.penalty) };
    return { ...c, defense: { ...c.defense, items: upsert(c.defense.items, entry, i) } };
  },
  remove: (c, i) => ({ ...c, defense: { ...c.defense, items: c.defense.items.filter((_, idx) => idx !== i) } }),
};

/* ──────────────── Inventory items (acessório / comum / consumível) ──────── */

function inventoryConfig(
  category: InventoryCategory,
  title: string,
  fields: FieldDescriptor[],
): EntityConfig {
  return {
    title,
    fields,
    empty: () => ({ name: '', quantity: 1, slot: '', effect: '' }),
    fromEntry: (c, i) => {
      const it = c.inventory[i];
      return { name: it.name, quantity: it.quantity ?? 1, slot: it.slot ?? '', effect: it.effect ?? '' };
    },
    apply: (c, v, i) => {
      const base = i != null ? c.inventory[i] : { weight: 0 };
      const entry = {
        ...base,
        name: s(v.name),
        quantity: n(v.quantity) || 1,
        category,
        slot: s(v.slot) || undefined,
        effect: s(v.effect) || undefined,
        weight: (base as { weight?: number }).weight ?? 0,
      } as Character['inventory'][number];
      return { ...c, inventory: upsert(c.inventory, entry, i) };
    },
    remove: (c, i) => ({ ...c, inventory: c.inventory.filter((_, idx) => idx !== i) }),
  };
}

const acessorioConfig = inventoryConfig('acessorio', 'Acessório', [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do acessório' },
  { key: 'slot', label: 'Local', type: 'text', placeholder: 'Ex.: pescoço, mãos', half: true },
  { key: 'effect', label: 'Efeito', type: 'text', half: true },
]);

const comumConfig = inventoryConfig('comum', 'Item comum', [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do item' },
  { key: 'quantity', label: 'Quantidade', type: 'number', half: true },
]);

const consumivelConfig = inventoryConfig('consumivel', 'Consumível', [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do consumível' },
  { key: 'quantity', label: 'Quantidade', type: 'number', half: true },
  { key: 'effect', label: 'Efeito', type: 'text', half: true },
]);

export const ENTITY_FORMS: Record<EntityKind, EntityConfig> = {
  poder: abilityConfig('Poder'),
  habilidade: abilityConfig('Habilidade'),
  magia: magiaConfig,
  buff: buffConfig,
  arma: armaConfig,
  armadura: armaduraConfig,
  acessorio: acessorioConfig,
  comum: comumConfig,
  consumivel: consumivelConfig,
};

/** Item sub-types selectable in the FAB "Item" form. */
export const ITEM_KINDS: Array<{ kind: EntityKind; label: string }> = [
  { kind: 'arma', label: 'Arma' },
  { kind: 'armadura', label: 'Armadura' },
  { kind: 'acessorio', label: 'Acessório' },
  { kind: 'comum', label: 'Comum' },
  { kind: 'consumivel', label: 'Consumível' },
];
