import type {
  Character,
  AttributeId,
  BuffType,
  BuffEffect,
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
  | 'ataque'
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

/** Sub-campos de um efeito de buff — reutilizado no buff manual, em magias e em poderes. */
const BUFF_EFFECT_ITEM_FIELDS: FieldDescriptor[] = [
  { key: 'type', label: 'Tipo', type: 'select', options: buffTypeOptions, half: true },
  {
    key: 'attributeId', label: 'Atributo', type: 'select', options: attrOptions, half: true,
    showIf: (v) => v.type === 'attribute',
  },
  {
    key: 'skillId', label: 'Perícia', type: 'select', options: skillOptions, half: true,
    showIf: (v) => v.type === 'skill',
  },
  { key: 'value', label: 'Valor', type: 'text', placeholder: 'Ex.: 2 ou 1d6', half: true },
];

const emptyBuffEffect = (): FormValues => ({ type: 'attack_roll', attributeId: 'str', skillId: '', value: '' });

/**
 * Usado tanto pela Magia (Task 8) quanto pelo Poder/Habilidade (Task 9). Definido aqui
 * (antes de `abilityFields` mais abaixo no arquivo) para não ser referenciado antes de
 * declarado — `abilityFields` vem antes de `spellFields` na ordem atual do arquivo.
 */
const buffTargetScopeOptions = [
  { value: 'self', label: 'Só eu' },
  { value: 'party', label: 'Posso escolher outros' },
];

const rangeOptions = [
  { value: 'melee', label: 'Corpo a corpo' },
  { value: 'ranged', label: 'À distância' },
];

/* ─────────────────────────── Poder / Habilidade ─────────────────────────── */

const kindOptions: Array<{ value: string; label: string }> = [
  { value: 'Poder', label: 'Poder' },
  { value: 'Habilidade', label: 'Habilidade' },
];

const abilityFields: FieldDescriptor[] = [
  { key: 'kind', label: 'Tipo', type: 'select', options: kindOptions, half: true },
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome', half: true },
  { key: 'source', label: 'Fonte', type: 'text', placeholder: 'Classe, raça, origem…', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Efeito / regras' },
];

const abilidadeConfig: EntityConfig = {
  title: 'Poder / Habilidade',
  fields: abilityFields,
  empty: () => ({ kind: 'Poder', name: '', source: '', mpCost: 0, description: '' }),
  fromEntry: (c, i) => {
    const a = c.abilities[i];
    return { kind: a.kind ?? 'Poder', name: a.name, source: a.source, mpCost: a.mpCost, description: a.description };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.abilities[i] : { type: '' };
    const entry = {
      ...base,
      name: s(v.name),
      source: s(v.source),
      kind: (s(v.kind) || 'Poder') as AbilityKind,
      mpCost: n(v.mpCost),
      description: s(v.description),
    };
    return { ...c, abilities: upsert(c.abilities, entry, i) };
  },
  remove: (c, i) => ({ ...c, abilities: c.abilities.filter((_, idx) => idx !== i) }),
};

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
  { key: 'buffTargetScope', label: 'Alvo do buff', type: 'select', options: buffTargetScopeOptions, half: true },
  {
    key: 'buffs', label: 'Efeitos de Buff (base)', type: 'list', addLabel: 'Efeito',
    itemFields: BUFF_EFFECT_ITEM_FIELDS,
  },
  {
    key: 'enhancements', label: 'Aprimoramentos', type: 'list', addLabel: 'Aprimoramento',
    itemFields: [
      { key: 'mpCost', label: 'PM extra', type: 'number' },
      { key: 'description', label: 'Efeito', type: 'textarea', placeholder: 'Ex.: +1d6 de dano' },
      {
        key: 'buffs', label: 'Efeitos de Buff', type: 'list', addLabel: 'Efeito',
        itemFields: BUFF_EFFECT_ITEM_FIELDS,
      },
    ],
  },
];

const magiaConfig: EntityConfig = {
  title: 'Magia',
  fields: spellFields,
  empty: () => ({
    name: '', school: '', spellLevel: 1, mpCost: 1, castingTime: '', range: '',
    area: '', duration: '', resistance: '', description: '', enhancements: [],
    buffTargetScope: 'self', buffs: [],
  }),
  fromEntry: (c, i) => {
    const sp = c.spells[i];
    return {
      name: sp.name, school: sp.school, spellLevel: sp.spellLevel, mpCost: sp.mpCost,
      castingTime: sp.castingTime, range: sp.range, area: sp.area, duration: sp.duration,
      resistance: sp.resistance, description: sp.description,
      buffTargetScope: sp.buffTargetScope ?? 'self',
      buffs: effectsToForm(sp.buffs),
      enhancements: (sp.enhancements ?? []).map((e) => ({
        mpCost: e.mpCost,
        description: e.description,
        buffs: effectsToForm(e.buffs),
      })),
    };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.spells[i] : {};
    const rawEnhancements = Array.isArray(v.enhancements) ? v.enhancements : [];
    const entry = {
      ...base,
      name: s(v.name), school: s(v.school), spellLevel: n(v.spellLevel), mpCost: n(v.mpCost),
      castingTime: s(v.castingTime), range: s(v.range), area: s(v.area), duration: s(v.duration),
      resistance: s(v.resistance), description: s(v.description),
      buffTargetScope: s(v.buffTargetScope) || 'self',
      buffs: effectsFromValues(v.buffs),
      enhancements: rawEnhancements.map((e) => ({
        mpCost: n(e.mpCost),
        description: s(e.description),
        buffs: effectsFromValues(e.buffs),
      })),
    } as Character['spells'][number];
    return { ...c, spells: upsert(c.spells, entry, i) };
  },
  remove: (c, i) => ({ ...c, spells: c.spells.filter((_, idx) => idx !== i) }),
};

/* ─────────────────────────────── Buff ──────────────────────────────────── */

const buffFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do buff/condição' },
  { key: 'mp', label: 'Custo (PM)', type: 'number', half: true },
  {
    key: 'effects', label: 'Efeitos', type: 'list', addLabel: 'Efeito',
    itemFields: BUFF_EFFECT_ITEM_FIELDS,
  },
];

function effectsFromValues(raw: unknown): BuffEffect[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((row) => ({
    type: (s(row.type) || buffTypeOptions[0]?.value || 'attack_roll') as BuffType,
    attributeId: row.type === 'attribute' ? ((s(row.attributeId) || 'str') as AttributeId) : undefined,
    skillId: row.type === 'skill' ? s(row.skillId) : undefined,
    value: s(row.value),
  }));
}

function effectsToForm(effects: BuffEffect[] | undefined): FormValues[] {
  return (effects ?? []).map((eff) => ({
    type: eff.type, attributeId: eff.attributeId ?? 'str', skillId: eff.skillId ?? '', value: eff.value,
  }));
}

const buffConfig: EntityConfig = {
  title: 'Buff / Condição',
  fields: buffFields,
  empty: () => ({ name: '', mp: 0, effects: [emptyBuffEffect()] }),
  fromEntry: (c, i) => {
    const b = c.buffs[i];
    return {
      name: b.name,
      mp: b.mp,
      effects: effectsToForm(b.effects),
    };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.buffs[i] : { active: false };
    const entry = {
      ...base,
      name: s(v.name),
      mp: n(v.mp),
      effects: effectsFromValues(v.effects),
      active: (base as { active?: boolean }).active ?? false,
    } as Character['buffs'][number];
    return { ...c, buffs: upsert(c.buffs, entry, i) };
  },
  remove: (c, i) => ({ ...c, buffs: c.buffs.filter((_, idx) => idx !== i) }),
};

/* ───────────────── Ataque (combinação: base + modificadores) ────────────── */

const ataqueFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Ex.: Katana, Bola de Fogo…' },
  { key: 'rangeType', label: 'Alcance (base)', type: 'select', options: rangeOptions, half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'damage', label: 'Dano (dados)', type: 'text', placeholder: 'Ex.: 2d8', half: true },
  { key: 'attributeDamageBonus', label: 'Atributo de dano', type: 'select', options: attrOptions, half: true },
  { key: 'critical', label: 'Crítico', type: 'text', placeholder: 'Ex.: 19/x2', half: true },
  { key: 'type', label: 'Tipo de dano', type: 'text', placeholder: 'Corte, fogo…', half: true },
  {
    key: 'extraBonuses', label: 'Modificadores de ataque', type: 'list', addLabel: 'Modificador',
    itemFields: [
      { key: 'name', label: 'Nome', type: 'text', placeholder: 'Ex.: Ataque Poderoso' },
      { key: 'value', label: 'Bônus', type: 'number' },
      { key: 'mp', label: 'PM', type: 'number' },
    ],
  },
  {
    key: 'extraDamage', label: 'Dano extra', type: 'list', addLabel: 'Dano',
    itemFields: [
      { key: 'name', label: 'Nome', type: 'text', placeholder: 'Ex.: Chama' },
      { key: 'value', label: 'Valor', type: 'text', placeholder: 'Ex.: 1d6 ou 2' },
      { key: 'mp', label: 'PM', type: 'number' },
    ],
  },
];

const ataqueConfig: EntityConfig = {
  title: 'Ataque',
  fields: ataqueFields,
  empty: () => ({
    name: '', rangeType: 'melee', mpCost: 0, damage: '', attributeDamageBonus: 'str',
    critical: '', type: '', extraBonuses: [], extraDamage: [],
  }),
  fromEntry: (c, i) => {
    const a = c.attacks[i];
    return {
      name: a.name, rangeType: a.rangeType, mpCost: a.mpCost, damage: a.damage,
      attributeDamageBonus: a.attributeDamageBonus || 'str', critical: a.critical, type: a.type,
      extraBonuses: (a.extraBonuses ?? []).map((b) => ({ name: b.name, value: b.value, mp: b.mp })),
      extraDamage: (a.extraDamage ?? []).map((d) => ({ name: d.name, value: d.value, mp: d.mp })),
    };
  },
  apply: (c, v, i) => {
    const bonuses = Array.isArray(v.extraBonuses) ? v.extraBonuses : [];
    const dmg = Array.isArray(v.extraDamage) ? v.extraDamage : [];
    const entry: Character['attacks'][number] = {
      name: s(v.name),
      damage: s(v.damage),
      critical: s(v.critical),
      type: s(v.type),
      rangeType: s(v.rangeType),
      mpCost: n(v.mpCost),
      attributeDamageBonus: s(v.attributeDamageBonus),
      extraBonuses: bonuses.map((b) => ({ name: s(b.name), value: n(b.value), mp: n(b.mp) })),
      extraDamage: dmg.map((d) => ({ name: s(d.name), value: s(d.value), mp: n(d.mp) })),
    };
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

/* ──────────────── Inventory items (arma / acessório / comum / consumível) ── */

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

const armaConfig = inventoryConfig('arma', 'Arma', [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Ex.: Espada longa, Arco' },
  { key: 'slot', label: 'Empunhadura', type: 'text', placeholder: 'Ex.: 1 mão, 2 mãos', half: true },
  { key: 'effect', label: 'Descrição', type: 'text', placeholder: 'Material, encantamento…', half: true },
]);

export const ENTITY_FORMS: Record<EntityKind, EntityConfig> = {
  poder: abilidadeConfig,
  habilidade: abilidadeConfig,
  magia: magiaConfig,
  buff: buffConfig,
  ataque: ataqueConfig,
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
