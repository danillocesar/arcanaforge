import type {
  Character,
  AttributeId,
  BuffType,
  BuffEffect,
  AbilityKind,
  InventoryCategory,
  AttackModifier,
} from '../../../types/character';
import { BUFF_TYPES, SPELL_SCHOOLS, DAMAGE_TYPES, baseMpCostForLevel } from '../../../data/constants';
import { ATTRIBUTE_FULL_NAMES } from '../../../data/atributos';
import { SKILLS_CONFIG } from '../../../data/pericias';
import { ABILITY_CATEGORIES } from '../../../utils/abilityGroups';
import type { ItemEnhancementTarget } from '../../../data/itemEnhancements';
import type { OfficialCondition } from '../../../data/conditions';
import type { OfficialSpell } from '../../../data/spells';
import type { OfficialPower } from '../../../data/powers';
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
  | 'consumivel'
  | 'esoterico'
  | 'rd';

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

const attackModifierAttrOptions = [{ value: '', label: '— Nenhum —' }, ...attrOptions];

/** Sub-campos de um modificador de ataque — reutilizado em Poder, Magia e Itens. */
const ATTACK_MODIFIER_ITEM_FIELDS: FieldDescriptor[] = [
  { key: 'label', label: 'Nome', type: 'text', placeholder: 'Ex.: Ataque Poderoso' },
  { key: 'attackRoll', label: 'Bônus de Ataque', type: 'number', half: true },
  // Bônus dirigido por atributo: soma o valor do atributo no teste/dano,
  // acumulável com o valor fixo digitado ao lado.
  {
    key: 'attackRollAttribute', label: 'Ataque + atributo', type: 'select',
    options: attackModifierAttrOptions, half: true,
  },
  { key: 'damageBonus', label: 'Bônus de Dano', type: 'number', half: true },
  {
    key: 'damageBonusAttribute', label: 'Dano + atributo', type: 'select',
    options: attackModifierAttrOptions, half: true,
  },
  { key: 'damageDice', label: 'Dado extra', type: 'text', placeholder: 'Ex.: +2d6', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  // Habilita o stepper ×N na modal de ataque (ex.: Smite Divino, 1d8 por 1 PM).
  // Linha nova de lista nasce com '' em selects — por isso o "Não" é value ''.
  {
    key: 'repeatable', label: 'Pode repetir?', type: 'select',
    options: [{ value: '', label: 'Não' }, { value: 'true', label: 'Sim' }], half: true,
  },
  {
    key: 'attributeId', label: 'Atributo (temporário)', type: 'select', options: attackModifierAttrOptions, half: true,
  },
  { key: 'attributeValue', label: 'Bônus no Atributo', type: 'number', half: true },
];

const ATTACK_MODIFIERS_FIELD: FieldDescriptor = {
  key: 'attackModifiers', label: 'Modificador de Ataque', type: 'list', addLabel: 'Modificador',
  itemFields: ATTACK_MODIFIER_ITEM_FIELDS,
};

function attackModifiersFromValues(raw: unknown): AttackModifier[] {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((row) => ({
      label: s(row.label).trim(),
      attackRoll: n(row.attackRoll) || undefined,
      damageBonus: n(row.damageBonus) || undefined,
      damageDice: s(row.damageDice) || undefined,
      mpCost: n(row.mpCost) || undefined,
      attackRollAttribute: (s(row.attackRollAttribute) || undefined) as AttributeId | undefined,
      damageBonusAttribute: (s(row.damageBonusAttribute) || undefined) as AttributeId | undefined,
      attributeId: (s(row.attributeId) || undefined) as AttributeId | undefined,
      attributeValue: n(row.attributeValue) || undefined,
      repeatable: s(row.repeatable) === 'true' || undefined,
    }))
    .filter((m) => m.label);
}

function attackModifiersToForm(mods: AttackModifier[] | undefined): FormValues[] {
  return (mods ?? []).map((m) => ({
    label: m.label,
    attackRoll: m.attackRoll ?? 0,
    damageBonus: m.damageBonus ?? 0,
    damageDice: m.damageDice ?? '',
    mpCost: m.mpCost ?? 0,
    attackRollAttribute: m.attackRollAttribute ?? '',
    damageBonusAttribute: m.damageBonusAttribute ?? '',
    attributeId: m.attributeId ?? '',
    attributeValue: m.attributeValue ?? 0,
    repeatable: m.repeatable ? 'true' : '',
  }));
}

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

const schoolOptions = SPELL_SCHOOLS.map((v) => ({ value: v, label: v }));
const damageTypeOptions = DAMAGE_TYPES.map((v) => ({ value: v, label: v }));

/* ─────────────────────────── Poder / Habilidade ─────────────────────────── */

const kindOptions: Array<{ value: string; label: string }> = [
  { value: 'Poder', label: 'Poder' },
  { value: 'Habilidade', label: 'Habilidade' },
];

const abilityCategoryOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'Sem categoria' },
  ...ABILITY_CATEGORIES.map((category) => ({ value: category, label: category })),
];

const castableOptions = [
  { value: 'false', label: 'Não' },
  { value: 'true', label: 'Sim' },
];

const alwaysActiveOptions = [
  { value: 'false', label: 'Não' },
  { value: 'true', label: 'Sim' },
];

const abilityFields: FieldDescriptor[] = [
  { key: 'kind', label: 'Tipo', type: 'select', options: kindOptions, half: true },
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome', half: true },
  // Agrupa a lista da aba Poderes. Vem preenchido do catálogo oficial; entrada
  // antiga ou manual fica em branco e cai no grupo "Sem categoria" até ser editada.
  // Com "Outro", o texto da Fonte vira o nome do grupo (grupo livre).
  { key: 'type', label: 'Categoria', type: 'select', options: abilityCategoryOptions, half: true },
  {
    key: 'source', label: 'Fonte', type: 'text', placeholder: 'Classe, raça, origem…', half: true,
    showIf: (v) => v.type !== 'Outro',
  },
  {
    key: 'source', label: 'Fonte (nome do grupo)', type: 'text', placeholder: 'Ex.: Poder de Legado', half: true,
    showIf: (v) => v.type === 'Outro',
  },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'prerequisite', label: 'Pré-requisito', type: 'text', placeholder: 'Ex.: Força 13' },
  { key: 'summary', label: 'Resumo', type: 'text', placeholder: '1 linha: o que o poder faz na prática' },
  { key: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Efeito / regras' },
  { key: 'castable', label: 'Conjurável', type: 'select', options: castableOptions, half: true },
  { key: 'alwaysActive', label: 'Sempre ativo', type: 'select', options: alwaysActiveOptions, half: true },
  {
    key: 'buffTargetScope', label: 'Alvo do buff', type: 'select', options: buffTargetScopeOptions, half: true,
    showIf: (v) => v.castable === 'true',
  },
  {
    key: 'buffs', label: 'Efeitos de Buff', type: 'list', addLabel: 'Efeito',
    itemFields: BUFF_EFFECT_ITEM_FIELDS,
    showIf: (v) => v.castable === 'true' || v.alwaysActive === 'true',
  },
  ATTACK_MODIFIERS_FIELD,
];

const abilidadeConfig: EntityConfig = {
  title: 'Poder / Habilidade',
  fields: abilityFields,
  empty: () => ({
    kind: 'Poder', name: '', type: '', source: '', mpCost: 0, prerequisite: '', summary: '', description: '',
    castable: 'false', alwaysActive: 'false', buffTargetScope: 'self', buffs: [], attackModifiers: [],
  }),
  fromEntry: (c, i) => {
    const a = c.abilities[i];
    return {
      kind: a.kind ?? 'Poder', name: a.name, type: a.type ?? '', source: a.source, mpCost: a.mpCost,
      prerequisite: a.prerequisite ?? '', summary: a.summary ?? '', description: a.description,
      castable: a.castable ? 'true' : 'false',
      alwaysActive: a.alwaysActive ? 'true' : 'false',
      buffTargetScope: a.buffTargetScope ?? 'self',
      buffs: effectsToForm(a.buffs),
      attackModifiers: attackModifiersToForm(a.attackModifiers),
    };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.abilities[i] : {};
    const entry = {
      ...base,
      name: s(v.name),
      type: s(v.type),
      source: s(v.source),
      kind: (s(v.kind) || 'Poder') as AbilityKind,
      mpCost: n(v.mpCost),
      prerequisite: s(v.prerequisite) || undefined,
      summary: s(v.summary) || undefined,
      description: s(v.description),
      castable: s(v.castable) === 'true',
      alwaysActive: s(v.alwaysActive) === 'true',
      buffTargetScope: s(v.buffTargetScope) || 'self',
      buffs: effectsFromValues(v.buffs),
      attackModifiers: attackModifiersFromValues(v.attackModifiers),
    } as Character['abilities'][number];
    return { ...c, abilities: upsert(c.abilities, entry, i) };
  },
  remove: (c, i) => ({ ...c, abilities: c.abilities.filter((_, idx) => idx !== i) }),
};

function powerSourceLabel(power: OfficialPower): string {
  if (power.category === 'Concedido') {
    return power.domain ? `Poder Concedido (${power.domain})` : 'Poder Concedido';
  }
  if (power.category === 'Tormenta') return 'Poder da Tormenta';
  return `Poder Geral (${power.category})`;
}

/** Converte um poder oficial do catálogo em rascunho de formulário para o abilidadeConfig acima. */
export function powerToFormValues(power: OfficialPower): FormValues {
  return {
    kind: 'Poder',
    name: power.name,
    type: power.category,
    source: powerSourceLabel(power),
    mpCost: 0,
    prerequisite: power.prerequisite,
    description: power.description,
    castable: 'false',
    alwaysActive: 'false',
    buffTargetScope: 'self',
    buffs: [],
  };
}

/* ─────────────────────────────── Magia ─────────────────────────────────── */

const spellFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome da magia' },
  { key: 'school', label: 'Escola', type: 'select', options: schoolOptions, half: true },
  {
    key: 'spellLevel', label: 'Círculo', type: 'number', half: true,
    // Recalcula o Custo (PM) automaticamente ao trocar de círculo, mas só quando o
    // jogador nunca tocou no campo — se o valor atual já diverge do custo-base do
    // círculo anterior, é customização (poder/habilidade de classe) e fica intocado.
    onValueChange: (value, _next, prev) => {
      const prevBaseCost = baseMpCostForLevel(Number(prev.spellLevel) || 1);
      if ((Number(prev.mpCost) || 0) !== prevBaseCost) return;
      return { mpCost: baseMpCostForLevel(Number(value) || 1) };
    },
  },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'castingTime', label: 'Execução', type: 'text', half: true },
  { key: 'range', label: 'Alcance', type: 'text', half: true },
  { key: 'area', label: 'Área/Alvo', type: 'text', half: true },
  { key: 'duration', label: 'Duração', type: 'text', half: true },
  { key: 'resistance', label: 'Resistência', type: 'text', half: true },
  {
    key: 'summary', label: 'Resumo', type: 'text',
    placeholder: '1 linha: o que a magia faz na prática',
  },
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
      // Linha nova de lista nasce com '' em selects — por isso o "Não" é value ''.
      {
        key: 'isAttackModifier', label: 'Modificador de ataque?', type: 'select',
        options: [{ value: '', label: 'Não' }, { value: 'true', label: 'Sim' }],
      },
      { key: 'description', label: 'Efeito', type: 'textarea', placeholder: 'Ex.: +1d6 de dano' },
      {
        key: 'buffs', label: 'Efeitos de Buff', type: 'list', addLabel: 'Efeito',
        itemFields: BUFF_EFFECT_ITEM_FIELDS,
      },
      {
        key: 'attackModifiers', label: 'Modificador de Ataque', type: 'list', addLabel: 'Modificador',
        itemFields: ATTACK_MODIFIER_ITEM_FIELDS,
        showIf: (v) => v.isAttackModifier === 'true',
      },
    ],
  },
  ATTACK_MODIFIERS_FIELD,
];

const magiaConfig: EntityConfig = {
  title: 'Magia',
  fields: spellFields,
  empty: () => ({
    name: '', school: schoolOptions[0]?.value ?? '', spellLevel: 1, mpCost: baseMpCostForLevel(1), castingTime: '', range: '',
    area: '', duration: '', resistance: '', summary: '', description: '', enhancements: [],
    buffTargetScope: 'self', buffs: [], attackModifiers: [],
  }),
  fromEntry: (c, i) => {
    const sp = c.spells[i];
    return {
      name: sp.name, school: sp.school, spellLevel: sp.spellLevel, mpCost: sp.mpCost,
      castingTime: sp.castingTime, range: sp.range, area: sp.area, duration: sp.duration,
      resistance: sp.resistance, summary: sp.summary ?? '', description: sp.description,
      buffTargetScope: sp.buffTargetScope ?? 'self',
      buffs: effectsToForm(sp.buffs),
      enhancements: (sp.enhancements ?? []).map((e) => ({
        mpCost: e.mpCost,
        description: e.description,
        buffs: effectsToForm(e.buffs),
        isAttackModifier: e.attackModifiers?.length ? 'true' : '',
        attackModifiers: attackModifiersToForm(e.attackModifiers),
      })),
      attackModifiers: attackModifiersToForm(sp.attackModifiers),
    };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.spells[i] : {};
    const rawEnhancements = Array.isArray(v.enhancements) ? v.enhancements : [];
    const entry = {
      ...base,
      name: s(v.name), school: s(v.school), spellLevel: n(v.spellLevel), mpCost: n(v.mpCost),
      castingTime: s(v.castingTime), range: s(v.range), area: s(v.area), duration: s(v.duration),
      resistance: s(v.resistance), summary: s(v.summary) || undefined, description: s(v.description),
      buffTargetScope: s(v.buffTargetScope) || 'self',
      buffs: effectsFromValues(v.buffs),
      enhancements: rawEnhancements.map((e) => ({
        mpCost: n(e.mpCost),
        description: s(e.description),
        buffs: effectsFromValues(e.buffs),
        // Desligar o select descarta as linhas: modificador oculto não pode
        // continuar aparecendo na modal de ataque.
        attackModifiers: s(e.isAttackModifier) === 'true'
          ? attackModifiersFromValues(e.attackModifiers)
          : undefined,
      })),
      attackModifiers: attackModifiersFromValues(v.attackModifiers),
    } as Character['spells'][number];
    return { ...c, spells: upsert(c.spells, entry, i) };
  },
  remove: (c, i) => ({ ...c, spells: c.spells.filter((_, idx) => idx !== i) }),
};

/** Converte uma magia oficial do catálogo em rascunho de formulário para o magiaConfig acima. */
export function spellToFormValues(spell: OfficialSpell): FormValues {
  return {
    name: spell.name,
    school: spell.school,
    spellLevel: spell.spellLevel,
    mpCost: baseMpCostForLevel(spell.spellLevel),
    castingTime: spell.castingTime,
    range: spell.range,
    area: spell.area,
    duration: spell.duration,
    resistance: spell.resistance,
    description: spell.description,
    buffTargetScope: 'self',
    buffs: [],
    enhancements: spell.enhancements.map((e) => ({
      mpCost: e.mpCost, description: e.description, buffs: [], isAttackModifier: '', attackModifiers: [],
    })),
  };
}

/* ─────────────────────────────── Buff ──────────────────────────────────── */

const buffFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do buff/condição' },
  { key: 'mp', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'description', label: 'Descrição (regra)', type: 'textarea', placeholder: 'Efeito da condição, para referência' },
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

export function effectsToForm(effects: BuffEffect[] | undefined): FormValues[] {
  return (effects ?? []).map((eff) => ({
    type: eff.type, attributeId: eff.attributeId ?? 'str', skillId: eff.skillId ?? '', value: eff.value,
  }));
}

const buffConfig: EntityConfig = {
  title: 'Buff / Condição',
  fields: buffFields,
  empty: () => ({ name: '', mp: 0, description: '', effects: [emptyBuffEffect()] }),
  fromEntry: (c, i) => {
    const b = c.buffs[i];
    return {
      name: b.name,
      mp: b.mp,
      description: b.description ?? '',
      effects: effectsToForm(b.effects),
    };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.buffs[i] : { active: false };
    const entry = {
      ...base,
      name: s(v.name),
      mp: n(v.mp),
      description: s(v.description) || undefined,
      effects: effectsFromValues(v.effects),
      active: (base as { active?: boolean }).active ?? false,
    } as Character['buffs'][number];
    return { ...c, buffs: upsert(c.buffs, entry, i) };
  },
  remove: (c, i) => ({ ...c, buffs: c.buffs.filter((_, idx) => idx !== i) }),
};

/** Converte uma condição oficial do catálogo em rascunho de formulário para o buffConfig acima. */
export function conditionToFormValues(condition: OfficialCondition): FormValues {
  return {
    name: condition.name,
    mp: 0,
    description: condition.description,
    effects: effectsToForm(condition.effects),
  };
}

/* ───────────────── Ataque (combinação: base + modificadores) ────────────── */

const ataqueFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Ex.: Katana, Bola de Fogo…' },
  { key: 'rangeType', label: 'Alcance (base)', type: 'select', options: rangeOptions, half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'damage', label: 'Dano (dados)', type: 'text', placeholder: 'Ex.: 2d8', half: true },
  { key: 'attributeDamageBonus', label: 'Atributo de dano', type: 'select', options: attrOptions, half: true },
  { key: 'critical', label: 'Crítico', type: 'text', placeholder: 'Ex.: 19/x2', half: true },
  { key: 'type', label: 'Tipo de dano', type: 'select', options: damageTypeOptions, half: true },
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
    critical: '', type: damageTypeOptions[0]?.value ?? '', extraBonuses: [], extraDamage: [],
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
      extraBonuses: bonuses.map((b) => ({ name: s(b.name).trim(), value: n(b.value), mp: n(b.mp) })),
      extraDamage: dmg.map((d) => ({ name: s(d.name).trim(), value: s(d.value), mp: n(d.mp) })),
    };
    return { ...c, attacks: upsert(c.attacks, entry, i) };
  },
  remove: (c, i) => ({ ...c, attacks: c.attacks.filter((_, idx) => idx !== i) }),
};

/* ───────────────────────────── Armadura ────────────────────────────────── */

/**
 * Abre o catálogo de melhorias/encantos do T20. A chave não é lida por nenhum
 * `apply` — o picker escreve nos campos que já existem (efeito, buffs,
 * attackModifiers), então nada de novo precisa ser persistido.
 */
const ENHANCEMENT_PICKER_FIELD = (target: ItemEnhancementTarget): FieldDescriptor => ({
  key: '__enhancements',
  label: 'Melhoria / Encanto',
  type: 'enhancementPicker',
  enhancementTarget: target,
});

const armaduraConfig: EntityConfig = {
  title: 'Armadura',
  fields: [
    { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome da proteção' },
    { key: 'value', label: 'Bônus de Defesa', type: 'number', half: true },
    { key: 'penalty', label: 'Penalidade', type: 'number', half: true },
    // Onde o ItemEnhancementPicker anota a melhoria/encanto escolhida — sem este
    // campo o clique no catálogo era descartado no salvar (nada acontecia).
    { key: 'effect', label: 'Melhorias & Encantos', type: 'text', placeholder: 'Preenchido pelo catálogo abaixo' },
    { key: 'alwaysActive', label: 'Sempre ativo', type: 'select', options: alwaysActiveOptions, half: true },
    {
      key: 'buffs', label: 'Efeitos de Buff', type: 'list', addLabel: 'Efeito',
      itemFields: BUFF_EFFECT_ITEM_FIELDS,
      showIf: (v) => v.alwaysActive === 'true',
    },
    ENHANCEMENT_PICKER_FIELD('protecao'),
  ],
  empty: () => ({ name: '', value: 0, penalty: 0, effect: '', alwaysActive: 'false', buffs: [] }),
  fromEntry: (c, i) => {
    const d = c.defense.items[i];
    return {
      name: d.name, value: d.value, penalty: d.penalty,
      effect: d.effect ?? '',
      alwaysActive: d.alwaysActive ? 'true' : 'false',
      buffs: effectsToForm(d.buffs),
    };
  },
  apply: (c, v, i) => {
    const entry = {
      name: s(v.name), value: n(v.value), penalty: n(v.penalty),
      effect: s(v.effect) || undefined,
      alwaysActive: s(v.alwaysActive) === 'true',
      buffs: effectsFromValues(v.buffs),
    };
    return { ...c, defense: { ...c.defense, items: upsert(c.defense.items, entry, i) } };
  },
  remove: (c, i) => ({ ...c, defense: { ...c.defense, items: c.defense.items.filter((_, idx) => idx !== i) } }),
};

/* ─────────────────────── Redução de Dano (por tipo) ────────────────────── */

const rdConfig: EntityConfig = {
  title: 'Redução de Dano',
  fields: [
    {
      key: 'name', label: 'Tipo de dano', type: 'text',
      placeholder: 'Ex.: fogo, corte — ou "Geral" contra tudo',
    },
    { key: 'value', label: 'Redução', type: 'number', half: true },
  ],
  empty: () => ({ name: '', value: 0 }),
  fromEntry: (c, i) => {
    const rd = c.damageReductions[i];
    return { name: rd.name, value: rd.value };
  },
  apply: (c, v, i) => {
    const entry = { name: s(v.name) || 'Geral', value: n(v.value) };
    return { ...c, damageReductions: upsert(c.damageReductions ?? [], entry, i) };
  },
  remove: (c, i) => ({
    ...c,
    damageReductions: (c.damageReductions ?? []).filter((_, idx) => idx !== i),
  }),
};

/* ──────────────── Inventory items (arma / acessório / comum / consumível) ── */

const WEIGHT_FIELD: FieldDescriptor = { key: 'weight', label: 'Peso (kg)', type: 'number', half: true };


function inventoryConfig(
  category: InventoryCategory,
  title: string,
  fields: FieldDescriptor[],
): EntityConfig {
  return {
    title,
    fields: [
      ...fields,
      WEIGHT_FIELD,
      { key: 'alwaysActive', label: 'Sempre ativo', type: 'select', options: alwaysActiveOptions, half: true },
      {
        key: 'buffs', label: 'Efeitos de Buff', type: 'list', addLabel: 'Efeito',
        itemFields: BUFF_EFFECT_ITEM_FIELDS,
        showIf: (v) => v.alwaysActive === 'true',
      },
      ATTACK_MODIFIERS_FIELD,
    ],
    empty: () => ({
      name: '', quantity: 1, slot: '', effect: '', weight: 0,
      alwaysActive: 'false', buffs: [], attackModifiers: [],
    }),
    fromEntry: (c, i) => {
      const it = c.inventory[i];
      return {
        name: it.name, quantity: it.quantity ?? 1, slot: it.slot ?? '', effect: it.effect ?? '',
        weight: it.weight ?? 0,
        alwaysActive: it.alwaysActive ? 'true' : 'false',
        buffs: effectsToForm(it.buffs),
        attackModifiers: attackModifiersToForm(it.attackModifiers),
      };
    },
    apply: (c, v, i) => {
      const base = i != null ? c.inventory[i] : {};
      const entry = {
        ...base,
        name: s(v.name),
        quantity: n(v.quantity) || 1,
        category,
        slot: s(v.slot) || undefined,
        effect: s(v.effect) || undefined,
        weight: n(v.weight),
        alwaysActive: s(v.alwaysActive) === 'true',
        buffs: effectsFromValues(v.buffs),
        attackModifiers: attackModifiersFromValues(v.attackModifiers),
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

/**
 * Item esotérico: cetro/varinha/foco de conjurador. O `inventoryConfig` genérico já
 * traz `alwaysActive` + `buffs` + `attackModifiers` — que é exatamente o "efeito
 * permanente" desses itens — sem o bloco de dano que os tirava da aba Ações.
 */
const esotericoConfig = inventoryConfig('esoterico', 'Item esotérico', [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Ex.: Cetro elemental, Varinha' },
  { key: 'effect', label: 'Efeito', type: 'text', placeholder: 'Efeito permanente do item' },
  // O caso concreto que motivou o catálogo: o Cetro Elemental precisa puxar
  // melhoria/encanto prontos em vez de o jogador digitar cada bônus.
  ENHANCEMENT_PICKER_FIELD('arma'),
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

/**
 * Arma: item de inventário com campos de combate opcionais. Preencher "Dano" faz
 * a arma aparecer automaticamente como card de Ataque na aba Ações — sem precisar
 * cadastrar a mesma arma duas vezes.
 */
const armaConfig: EntityConfig = {
  title: 'Arma',
  fields: [
    { key: 'name', label: 'Nome', type: 'text', placeholder: 'Ex.: Espada longa, Arco' },
    { key: 'slot', label: 'Empunhadura', type: 'text', placeholder: 'Ex.: 1 mão, 2 mãos', half: true },
    { key: 'effect', label: 'Descrição', type: 'text', placeholder: 'Material, encantamento…', half: true },
    WEIGHT_FIELD,
    { key: 'rangeType', label: 'Alcance', type: 'select', options: rangeOptions, half: true },
    { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
    { key: 'damage', label: 'Dano (dados)', type: 'text', placeholder: 'Ex.: 2d8 — vazio = não é um ataque', half: true },
    { key: 'attributeDamageBonus', label: 'Atributo de dano', type: 'select', options: attrOptions, half: true },
    { key: 'critical', label: 'Crítico', type: 'text', placeholder: 'Ex.: 19/x2', half: true },
    { key: 'type', label: 'Tipo de dano', type: 'select', options: damageTypeOptions, half: true },
    { key: 'alwaysActive', label: 'Sempre ativo', type: 'select', options: alwaysActiveOptions, half: true },
    {
      key: 'buffs', label: 'Efeitos de Buff', type: 'list', addLabel: 'Efeito',
      itemFields: BUFF_EFFECT_ITEM_FIELDS,
      showIf: (v) => v.alwaysActive === 'true',
    },
    ATTACK_MODIFIERS_FIELD,
    ENHANCEMENT_PICKER_FIELD('arma'),
  ],
  empty: () => ({
    name: '', quantity: 1, slot: '', effect: '', weight: 0,
    rangeType: 'melee', mpCost: 0, damage: '', attributeDamageBonus: 'str', critical: '', type: '',
    alwaysActive: 'false', buffs: [], attackModifiers: [],
  }),
  fromEntry: (c, i) => {
    const it = c.inventory[i];
    return {
      name: it.name, quantity: it.quantity ?? 1, slot: it.slot ?? '', effect: it.effect ?? '',
      weight: it.weight ?? 0,
      rangeType: it.rangeType ?? 'melee', mpCost: it.mpCost ?? 0, damage: it.damage ?? '',
      attributeDamageBonus: it.attributeDamageBonus ?? 'str', critical: it.critical ?? '', type: it.type ?? '',
      alwaysActive: it.alwaysActive ? 'true' : 'false',
      buffs: effectsToForm(it.buffs),
      attackModifiers: attackModifiersToForm(it.attackModifiers),
    };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.inventory[i] : {};
    const entry = {
      ...base,
      name: s(v.name),
      quantity: n(v.quantity) || 1,
      category: 'arma' as const,
      slot: s(v.slot) || undefined,
      effect: s(v.effect) || undefined,
      weight: n(v.weight),
      rangeType: s(v.rangeType) || undefined,
      mpCost: n(v.mpCost),
      damage: s(v.damage) || undefined,
      attributeDamageBonus: s(v.attributeDamageBonus) || undefined,
      critical: s(v.critical) || undefined,
      type: s(v.type) || undefined,
      alwaysActive: s(v.alwaysActive) === 'true',
      buffs: effectsFromValues(v.buffs),
      attackModifiers: attackModifiersFromValues(v.attackModifiers),
    } as Character['inventory'][number];
    return { ...c, inventory: upsert(c.inventory, entry, i) };
  },
  remove: (c, i) => ({ ...c, inventory: c.inventory.filter((_, idx) => idx !== i) }),
};

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
  esoterico: esotericoConfig,
  rd: rdConfig,
};

/** Item sub-types selectable in the FAB "Item" form. */
export const ITEM_KINDS: Array<{ kind: EntityKind; label: string }> = [
  { kind: 'arma', label: 'Arma' },
  { kind: 'armadura', label: 'Armadura' },
  { kind: 'acessorio', label: 'Acessório' },
  { kind: 'esoterico', label: 'Esotérico' },
  { kind: 'comum', label: 'Comum' },
  { kind: 'consumivel', label: 'Consumível' },
];
