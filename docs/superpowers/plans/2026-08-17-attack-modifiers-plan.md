# Modificadores de Ataque Compostos — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar Poder/Habilidade, Magia e Item declararem modificadores de ataque
opcionais (ex.: Ataque Poderoso, Smite), e fazer o botão "⚔ Atacar" abrir um
checklist que compõe Ataque/Dano/Custo ao vivo a partir do que o jogador marcar
naquela rolagem — incluindo os `extraBonuses`/`extraDamage` que já existem hoje
dentro de um `Attack`, que passam a ser desligáveis em vez de sempre somados.

**Architecture:** Novo tipo `AttackModifier` anexável (campo opcional) em
`Ability`/`Spell`/`InventoryItem`. Novas funções puras em
`client/src/utils/attackCompose.ts` montam um checklist combinado (bônus do próprio
ataque + modificadores externos) e calculam o resultado composto a partir de um
`Set` de chaves marcadas. Um novo componente `ComposeAttackSheet` (mesmo padrão
visual/funcional do `CastActionSheet` já existente) substitui o clique direto em
"⚔ Atacar" quando há algo pra compor; sem nada pra compor, o comportamento de hoje
(ataque instantâneo) continua idêntico.

**Tech Stack:** React 19 + TypeScript (client), sem framework de teste automatizado
neste projeto — verificação via `npx tsc -b --force` e teste manual no navegador
(claude-in-chrome), seguido de `docker compose build app && docker compose up -d app`.

**Spec:** `docs/superpowers/specs/2026-08-17-attack-modifiers-design.md`

## Global Constraints

- Nenhuma migração de dados — `attackModifiers` é campo novo e opcional;
  `extraBonuses`/`extraDamage` mantêm o schema exato de hoje.
- Sem restrição por tipo de ataque (corpo a corpo x à distância) — todo modificador
  aparece pra qualquer ataque.
- Sem deduplicação de modificadores com nomes repetidos.
- Sem limite de quantos modificadores podem ser marcados ao mesmo tempo.
- Sem "usos limitados por dia/cena" — só custo em PM.
- Ataque sem nenhum `extraBonuses`/`extraDamage`/modificador disponível continua
  instantâneo, sem abrir tela nenhuma (comportamento de hoje intacto).

---

### Task 1: Tipo `AttackModifier` + campo em Ability/Spell/InventoryItem

**Files:**
- Modify: `client/src/types/character.ts:35-51`

**Interfaces:**
- Produces: `AttackModifier { label: string; attackRoll?: number; damageBonus?: number; damageDice?: string; mpCost?: number }`, e o campo opcional `attackModifiers?: AttackModifier[]` em `Ability`, `Spell` e `InventoryItem`.

- [x] **Passo 1: Adicionar a interface `AttackModifier`**

Em `client/src/types/character.ts`, logo depois da interface `ExtraDamage` (linha 39) e
antes de `Attack` (linha 41), adicionar:

```ts
export interface AttackModifier {
  label: string;
  attackRoll?: number;
  damageBonus?: number;
  damageDice?: string;
  mpCost?: number;
}
```

- [x] **Passo 2: Anexar o campo opcional em `Spell`**

Na interface `Spell` (por volta da linha 79-93), adicionar a última linha antes do
`}` de fechamento:

```ts
export interface Spell {
  name: string;
  school: string;
  castingTime: string;
  range: string;
  area: string;
  duration: string;
  resistance: string;
  mpCost: number;
  spellLevel: number;
  enhancements: Enhancement[];
  description: string;
  buffTargetScope?: BuffTargetScope;
  buffs?: BuffEffect[];
  attackModifiers?: AttackModifier[];
}
```

- [x] **Passo 3: Anexar o campo opcional em `Ability`**

Na interface `Ability` (por volta da linha 97-111), adicionar antes do `}` final:

```ts
export interface Ability {
  name: string;
  source: string;
  type: string;
  kind?: AbilityKind;
  mpCost: number;
  description: string;
  castable?: boolean;
  buffTargetScope?: BuffTargetScope;
  buffs?: BuffEffect[];
  prerequisite?: string;
  attackModifiers?: AttackModifier[];
}
```

- [x] **Passo 4: Anexar o campo opcional em `InventoryItem`**

Na interface `InventoryItem` (por volta da linha 115-133), adicionar antes do `}`
final:

```ts
export interface InventoryItem {
  name: string;
  quantity: number;
  weight: number;
  category?: InventoryCategory;
  effect?: string;
  slot?: string;
  damage?: string;
  critical?: string;
  type?: string;
  rangeType?: RangeType;
  mpCost?: number;
  attributeDamageBonus?: string;
  attackModifiers?: AttackModifier[];
}
```

- [x] **Passo 5: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro (campo novo e opcional não quebra nenhum código existente).

- [x] **Passo 6: Commit**

```bash
git add client/src/types/character.ts
git commit -m "feat(attacks): add AttackModifier type on Ability/Spell/InventoryItem"
```

---

### Task 2: Formulário — seção "Modificador de Ataque" em Poder, Magia e Itens

**Files:**
- Modify: `client/src/components/sheet/SheetForm/entityForms.ts`

**Interfaces:**
- Consumes: `AttackModifier` de `client/src/types/character.ts` (Task 1).
- Produces: `ATTACK_MODIFIERS_FIELD: FieldDescriptor` e as funções
  `attackModifiersFromValues(raw: unknown): AttackModifier[]` /
  `attackModifiersToForm(mods: AttackModifier[] | undefined): FormValues[]`, usadas
  pelas Tasks seguintes indiretamente só via os formulários (nenhuma outra task
  importa essas funções diretamente).

- [x] **Passo 1: Importar o tipo novo**

No topo de `client/src/components/sheet/SheetForm/entityForms.ts`, no bloco de
import de `../../../types/character` (linhas 1-8), adicionar `AttackModifier`:

```ts
import type {
  Character,
  AttributeId,
  BuffType,
  BuffEffect,
  AbilityKind,
  InventoryCategory,
  AttackModifier,
} from '../../../types/character';
```

- [x] **Passo 2: Criar o field descriptor e os conversores compartilhados**

Logo depois do bloco `BUFF_EFFECT_ITEM_FIELDS`/`emptyBuffEffect` (por volta da linha
72), adicionar:

```ts
/** Sub-campos de um modificador de ataque — reutilizado em Poder, Magia e Itens. */
const ATTACK_MODIFIER_ITEM_FIELDS: FieldDescriptor[] = [
  { key: 'label', label: 'Nome', type: 'text', placeholder: 'Ex.: Ataque Poderoso' },
  { key: 'attackRoll', label: 'Bônus de Ataque', type: 'number', half: true },
  { key: 'damageBonus', label: 'Bônus de Dano', type: 'number', half: true },
  { key: 'damageDice', label: 'Dado extra', type: 'text', placeholder: 'Ex.: +2d6', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
];

const ATTACK_MODIFIERS_FIELD: FieldDescriptor = {
  key: 'attackModifiers', label: 'Modificador de Ataque', type: 'list', addLabel: 'Modificador',
  itemFields: ATTACK_MODIFIER_ITEM_FIELDS,
};

function attackModifiersFromValues(raw: unknown): AttackModifier[] {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((row) => ({
      label: s(row.label),
      attackRoll: n(row.attackRoll) || undefined,
      damageBonus: n(row.damageBonus) || undefined,
      damageDice: s(row.damageDice) || undefined,
      mpCost: n(row.mpCost) || undefined,
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
  }));
}
```

- [x] **Passo 3: Adicionar ao formulário de Poder/Habilidade**

Em `abilityFields` (linhas 104-121), adicionar `ATTACK_MODIFIERS_FIELD` como último
item do array:

```ts
const abilityFields: FieldDescriptor[] = [
  { key: 'kind', label: 'Tipo', type: 'select', options: kindOptions, half: true },
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome', half: true },
  { key: 'source', label: 'Fonte', type: 'text', placeholder: 'Classe, raça, origem…', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'prerequisite', label: 'Pré-requisito', type: 'text', placeholder: 'Ex.: Força 13' },
  { key: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Efeito / regras' },
  { key: 'castable', label: 'Conjurável', type: 'select', options: castableOptions, half: true },
  {
    key: 'buffTargetScope', label: 'Alvo do buff', type: 'select', options: buffTargetScopeOptions, half: true,
    showIf: (v) => v.castable === 'true',
  },
  {
    key: 'buffs', label: 'Efeitos de Buff', type: 'list', addLabel: 'Efeito',
    itemFields: BUFF_EFFECT_ITEM_FIELDS,
    showIf: (v) => v.castable === 'true',
  },
  ATTACK_MODIFIERS_FIELD,
];
```

Em `abilidadeConfig` (linhas 123-157), adicionar `attackModifiers` em `empty`,
`fromEntry` e `apply`:

```ts
const abilidadeConfig: EntityConfig = {
  title: 'Poder / Habilidade',
  fields: abilityFields,
  empty: () => ({
    kind: 'Poder', name: '', source: '', mpCost: 0, prerequisite: '', description: '',
    castable: 'false', buffTargetScope: 'self', buffs: [], attackModifiers: [],
  }),
  fromEntry: (c, i) => {
    const a = c.abilities[i];
    return {
      kind: a.kind ?? 'Poder', name: a.name, source: a.source, mpCost: a.mpCost,
      prerequisite: a.prerequisite ?? '', description: a.description,
      castable: a.castable ? 'true' : 'false',
      buffTargetScope: a.buffTargetScope ?? 'self',
      buffs: effectsToForm(a.buffs),
      attackModifiers: attackModifiersToForm(a.attackModifiers),
    };
  },
  apply: (c, v, i) => {
    const base = i != null ? c.abilities[i] : { type: '' };
    const entry = {
      ...base,
      name: s(v.name),
      source: s(v.source),
      kind: (s(v.kind) || 'Poder') as AbilityKind,
      mpCost: n(v.mpCost),
      prerequisite: s(v.prerequisite) || undefined,
      description: s(v.description),
      castable: s(v.castable) === 'true',
      buffTargetScope: s(v.buffTargetScope) || 'self',
      buffs: effectsFromValues(v.buffs),
      attackModifiers: attackModifiersFromValues(v.attackModifiers),
    } as Character['abilities'][number];
    return { ...c, abilities: upsert(c.abilities, entry, i) };
  },
  remove: (c, i) => ({ ...c, abilities: c.abilities.filter((_, idx) => idx !== i) }),
};
```

- [x] **Passo 4: Adicionar ao formulário de Magia**

Substituir `spellFields` (linhas 184-211) por:

```ts
const spellFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome da magia' },
  { key: 'school', label: 'Escola', type: 'select', options: schoolOptions, half: true },
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
  ATTACK_MODIFIERS_FIELD,
];
```

Substituir `magiaConfig` (linhas 213-255) por:

```ts
const magiaConfig: EntityConfig = {
  title: 'Magia',
  fields: spellFields,
  empty: () => ({
    name: '', school: schoolOptions[0]?.value ?? '', spellLevel: 1, mpCost: 1, castingTime: '', range: '',
    area: '', duration: '', resistance: '', description: '', enhancements: [],
    buffTargetScope: 'self', buffs: [], attackModifiers: [],
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
      resistance: s(v.resistance), description: s(v.description),
      buffTargetScope: s(v.buffTargetScope) || 'self',
      buffs: effectsFromValues(v.buffs),
      enhancements: rawEnhancements.map((e) => ({
        mpCost: n(e.mpCost),
        description: s(e.description),
        buffs: effectsFromValues(e.buffs),
      })),
      attackModifiers: attackModifiersFromValues(v.attackModifiers),
    } as Character['spells'][number];
    return { ...c, spells: upsert(c.spells, entry, i) };
  },
  remove: (c, i) => ({ ...c, spells: c.spells.filter((_, idx) => idx !== i) }),
};
```

- [x] **Passo 5: Adicionar ao formulário de Arma**

Substituir `armaConfig` (linhas 485-532) por:

```ts
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
    ATTACK_MODIFIERS_FIELD,
  ],
  empty: () => ({
    name: '', quantity: 1, slot: '', effect: '', weight: 0,
    rangeType: 'melee', mpCost: 0, damage: '', attributeDamageBonus: 'str', critical: '', type: '',
    attackModifiers: [],
  }),
  fromEntry: (c, i) => {
    const it = c.inventory[i];
    return {
      name: it.name, quantity: it.quantity ?? 1, slot: it.slot ?? '', effect: it.effect ?? '',
      weight: it.weight ?? 0,
      rangeType: it.rangeType ?? 'melee', mpCost: it.mpCost ?? 0, damage: it.damage ?? '',
      attributeDamageBonus: it.attributeDamageBonus ?? 'str', critical: it.critical ?? '', type: it.type ?? '',
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
      attackModifiers: attackModifiersFromValues(v.attackModifiers),
    } as Character['inventory'][number];
    return { ...c, inventory: upsert(c.inventory, entry, i) };
  },
  remove: (c, i) => ({ ...c, inventory: c.inventory.filter((_, idx) => idx !== i) }),
};
```

- [x] **Passo 6: Adicionar à fábrica `inventoryConfig` (Acessório/Comum/Consumível)**

Modificar `inventoryConfig()` (linhas 430-461) pra incluir o campo em todo item que
passa por ela:

```ts
function inventoryConfig(
  category: InventoryCategory,
  title: string,
  fields: FieldDescriptor[],
): EntityConfig {
  return {
    title,
    fields: [...fields, WEIGHT_FIELD, ATTACK_MODIFIERS_FIELD],
    empty: () => ({ name: '', quantity: 1, slot: '', effect: '', weight: 0, attackModifiers: [] }),
    fromEntry: (c, i) => {
      const it = c.inventory[i];
      return {
        name: it.name, quantity: it.quantity ?? 1, slot: it.slot ?? '', effect: it.effect ?? '',
        weight: it.weight ?? 0,
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
        attackModifiers: attackModifiersFromValues(v.attackModifiers),
      } as Character['inventory'][number];
      return { ...c, inventory: upsert(c.inventory, entry, i) };
    },
    remove: (c, i) => ({ ...c, inventory: c.inventory.filter((_, idx) => idx !== i) }),
  };
}
```

- [x] **Passo 7: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro.

- [x] **Passo 8: Teste manual no navegador**

Suba o dev server (`npm run dev`), abra o personagem de teste "teste", vá em
Poderes → "+ Poder/Hab." → "+ Personalizado". Confirme que aparece a seção
"Modificador de Ataque" com "+ Modificador". Adicione um modificador com Nome
"Ataque Poderoso", Bônus de Ataque -2, Bônus de Dano 5, salve. Reabra o mesmo poder
pra editar e confirme que os valores persistiram. Repita rapidamente pra um Item
(Equipamentos → "+ Item" → Acessório) confirmando que a mesma seção aparece lá.

- [x] **Passo 9: Commit**

```bash
git add client/src/components/sheet/SheetForm/entityForms.ts
git commit -m "feat(attacks): add 'Modificador de Ataque' form section to Poder/Magia/Itens"
```

---

### Task 3: Funções de composição — `client/src/utils/attackCompose.ts`

**Files:**
- Create: `client/src/utils/attackCompose.ts`

**Interfaces:**
- Consumes: `Character`, `Attack`, `AttackModifier`, `AttributeId` (types);
  `calcTotalSkill`, `getEffectiveAttribute`, `formatMod` de
  `client/src/utils/calculations.ts` (já existem, sem mudança).
- Produces: `AttackChecklistItem { key, label, source, attackRoll, damageBonus, damageDice, mpCost, defaultChecked }`;
  `buildAttackChecklist(character: Character, atk: Attack): AttackChecklistItem[]`;
  `ComposedAttack { attackRoll: number; damage: string; mpTotal: number; usedLabels: string[] }`;
  `composeAttack(character: Character, atk: Attack, checklist: AttackChecklistItem[], enabledKeys: Set<string>): ComposedAttack`.
  Usados pela Task 4 (`ComposeAttackSheet`) e Task 5 (`ActionCard`).

- [x] **Passo 1: Criar o arquivo com `buildAttackChecklist`**

```ts
import type { Attack, AttackModifier, AttributeId, Character } from '../types/character';
import { calcTotalSkill, getEffectiveAttribute, formatMod } from './calculations';

export interface AttackChecklistItem {
  key: string;
  label: string;
  /** '' para bônus do próprio ataque; 'Poder' | 'Magia' | 'Item' pros de fora. */
  source: string;
  attackRoll: number;
  damageBonus: number;
  damageDice: string;
  mpCost: number;
  defaultChecked: boolean;
}

function pushModifiers(
  items: AttackChecklistItem[],
  mods: AttackModifier[] | undefined,
  keyPrefix: string,
  source: string,
) {
  (mods ?? []).forEach((m, i) => {
    items.push({
      key: `${keyPrefix}-${i}`,
      label: m.label,
      source,
      attackRoll: m.attackRoll ?? 0,
      damageBonus: m.damageBonus ?? 0,
      damageDice: m.damageDice ?? '',
      mpCost: m.mpCost ?? 0,
      defaultChecked: false,
    });
  });
}

/**
 * Monta o checklist de um ataque: os `extraBonuses`/`extraDamage` do próprio
 * `Attack` (pré-marcados — preservam o resultado de hoje) seguidos de todo
 * `AttackModifier` disponível no personagem via Poder, Magia ou Item
 * (desmarcados por padrão — são opcionais novos).
 */
export function buildAttackChecklist(character: Character, atk: Attack): AttackChecklistItem[] {
  const items: AttackChecklistItem[] = [];

  (atk.extraBonuses ?? []).forEach((b, i) => {
    items.push({
      key: `own-bonus-${i}`,
      label: b.name,
      source: '',
      attackRoll: Number(b.value) || 0,
      damageBonus: 0,
      damageDice: '',
      mpCost: Number(b.mp) || 0,
      defaultChecked: true,
    });
  });

  (atk.extraDamage ?? []).forEach((d, i) => {
    const raw = String(d.value ?? '');
    const isDice = raw !== '' && Number.isNaN(Number(raw));
    items.push({
      key: `own-damage-${i}`,
      label: d.name,
      source: '',
      attackRoll: 0,
      damageBonus: isDice ? 0 : (Number(raw) || 0),
      damageDice: isDice ? raw : '',
      mpCost: Number(d.mp) || 0,
      defaultChecked: true,
    });
  });

  character.abilities.forEach((a, ai) => pushModifiers(items, a.attackModifiers, `ability-${ai}`, 'Poder'));
  character.spells.forEach((sp, si) => pushModifiers(items, sp.attackModifiers, `spell-${si}`, 'Magia'));
  character.inventory.forEach((it, ii) => pushModifiers(items, it.attackModifiers, `item-${ii}`, 'Item'));

  return items;
}
```

- [x] **Passo 2: Adicionar `composeAttack` no mesmo arquivo**

```ts
export interface ComposedAttack {
  attackRoll: number;
  damage: string;
  mpTotal: number;
  usedLabels: string[];
}

/**
 * Calcula o resultado de uma rolagem de ataque a partir do subconjunto marcado do
 * checklist. Duplica deliberadamente uma pequena parte da aritmética de
 * `calcAttackRoll`/`calcDamageBonus`/`buildDamageSummary`/`calcTotalMp` (em
 * calculations.ts) em vez de reaproveitá-las: aquelas somam SEMPRE o
 * `extraBonuses`/`extraDamage` do ataque (usado pelo card em repouso); esta soma só
 * o subconjunto marcado — misturar as duas semânticas numa função só, ou passar um
 * filtro por todos os call sites existentes, seria mais arriscado que manter os
 * dois cálculos separados.
 */
export function composeAttack(
  character: Character,
  atk: Attack,
  checklist: AttackChecklistItem[],
  enabledKeys: Set<string>,
): ComposedAttack {
  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  let attackRoll = calcTotalSkill(character, skillId);

  const attrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  let damageBonus = getEffectiveAttribute(character, attrKey);

  const extraDice: string[] = [];
  let mpTotal = Number(atk.mpCost) || 0;
  const usedLabels: string[] = [];

  if (character.buffs) character.buffs.forEach((b) => {
    if (!b.active) return;
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attack_roll') attackRoll += Number(eff.value) || 0;
      if (eff.type === 'fixed_damage') damageBonus += Number(eff.value) || 0;
      if (eff.type === 'extra_damage' && eff.value) extraDice.push(String(eff.value));
    });
  });

  checklist.forEach((item) => {
    if (!enabledKeys.has(item.key)) return;
    attackRoll += item.attackRoll;
    damageBonus += item.damageBonus;
    if (item.damageDice) extraDice.push(item.damageDice);
    mpTotal += item.mpCost;
    usedLabels.push(item.label);
  });

  const parts: string[] = [];
  if (atk.damage) parts.push(atk.damage);
  extraDice.forEach((d) => parts.push(d));
  if (damageBonus !== 0 || parts.length === 0) {
    parts.push(damageBonus >= 0 && parts.length > 0 ? `+${damageBonus}` : formatMod(damageBonus));
  }
  const damage = parts.join('+').replace(/\+\+/g, '+').replace(/\+-/g, '-');

  return { attackRoll, damage, mpTotal, usedLabels };
}
```

- [x] **Passo 3: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro. Sem teste funcional nesta task — nada ainda importa este
arquivo; o comportamento é verificado na Task 6, uma vez ligado à interface.

- [x] **Passo 4: Commit**

```bash
git add client/src/utils/attackCompose.ts
git commit -m "feat(attacks): add buildAttackChecklist/composeAttack pure functions"
```

---

### Task 4: Componente `ComposeAttackSheet`

**Files:**
- Create: `client/src/components/sheet/ComposeAttackSheet/ComposeAttackSheet.tsx`
- Create: `client/src/components/sheet/ComposeAttackSheet/ComposeAttackSheet.module.css`

**Interfaces:**
- Consumes: `buildAttackChecklist`, `composeAttack` (Task 3); `Sheet` (`client/src/components/ui/Sheet/Sheet.tsx`, já existe, aceita `open`/`onClose`/`title`/`footer`/children — mesmo uso de `CastActionSheet.tsx`); `useCharacterContext` (`updateCharacter`); `formatMod` de `calculations.ts`; `playSwordSound`/`playArrowSound` de `utils/sounds.ts`; `triggerAttackAnim` de `utils/animations.ts`.
- Produces: `ComposeAttackSheet` componente default export, props `{ attack: Attack | null; onClose: () => void }` — usado pela Task 5 (`ActionCard`).

- [x] **Passo 1: Criar `ComposeAttackSheet.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { buildAttackChecklist, composeAttack } from '../../../utils/attackCompose';
import { formatMod } from '../../../utils/calculations';
import { playSwordSound, playArrowSound } from '../../../utils/sounds';
import { triggerAttackAnim } from '../../../utils/animations';
import type { Attack } from '../../../types/character';
import Sheet from '../../ui/Sheet/Sheet';
import styles from './ComposeAttackSheet.module.css';

interface ComposeAttackSheetProps {
  attack: Attack | null;
  onClose: () => void;
}

/**
 * Aberto pelo "⚔ Atacar" do ActionCard quando há pelo menos um item pra compor
 * (extraBonuses/extraDamage do próprio ataque, ou AttackModifier de Poder/Magia/
 * Item do personagem). Checklist com total recalculado ao vivo, mesmo padrão do
 * CastActionSheet — mas confirma rolando/logando o ataque, não aplicando buff.
 */
function ComposeAttackSheet({ attack, onClose }: ComposeAttackSheetProps) {
  const { character, updateCharacter } = useCharacterContext();
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());
  const [lastAttack, setLastAttack] = useState<Attack | null>(null);

  const activeAttack = attack ?? lastAttack;

  useEffect(() => {
    if (attack && character) {
      setLastAttack(attack);
      const checked = buildAttackChecklist(character, attack)
        .filter((item) => item.defaultChecked)
        .map((item) => item.key);
      setEnabledKeys(new Set(checked));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attack]);

  if (!character || !activeAttack) return null;

  const checklist = buildAttackChecklist(character, activeAttack);
  const result = composeAttack(character, activeAttack, checklist, enabledKeys);
  const rangeLabel = activeAttack.rangeType === 'ranged' ? 'À distância' : 'Corpo a corpo';

  const toggleItem = (key: string) => {
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const confirm = () => {
    updateCharacter((f) => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - result.mpTotal) },
      logs: [
        ...f.logs,
        {
          type: 'attack',
          name: activeAttack.name || 'Ataque',
          mpSpent: result.mpTotal,
          timestamp: Date.now(),
          details: {
            attackRoll: result.attackRoll,
            damage: result.damage,
            rangeType: rangeLabel,
            modifiers: result.usedLabels,
          },
        },
      ],
    }));

    if (activeAttack.rangeType === 'ranged') {
      playArrowSound();
    } else {
      playSwordSound();
    }

    triggerAttackAnim('toast', {
      type: activeAttack.rangeType === 'ranged' ? 'ranged' : 'melee',
      name: activeAttack.name || 'Ataque',
      mpCost: result.mpTotal,
    });

    onClose();
  };

  const footer = (
    <>
      <button type="button" className={styles.btnCancel} onClick={onClose}>
        Cancelar
      </button>
      <button type="button" className={styles.btnConfirm} onClick={confirm}>
        ⚔ Atacar
      </button>
    </>
  );

  return (
    <Sheet open={Boolean(attack)} onClose={onClose} title={activeAttack.name || 'Ataque'} footer={footer}>
      <div className={styles.baseRow}>
        <div className={styles.baseStat}>
          <span className={styles.baseLabel}>Ataque</span>
          <span className={styles.baseVal}>{formatMod(result.attackRoll)}</span>
        </div>
        <div className={styles.baseStat}>
          <span className={styles.baseLabel}>Dano</span>
          <span className={styles.baseVal}>{result.damage}</span>
        </div>
      </div>

      {checklist.length > 0 && <div className={styles.listHeader}>Modificadores</div>}

      <div className={styles.list}>
        {checklist.map((item) => (
          <label key={item.key} className={styles.item}>
            <input
              type="checkbox"
              checked={enabledKeys.has(item.key)}
              onChange={() => toggleItem(item.key)}
            />
            <span className={styles.itemInfo}>
              <span className={styles.itemName}>{item.label}</span>
              {item.source && <span className={styles.itemSource}>{item.source}</span>}
            </span>
            <span className={styles.itemDelta}>
              {item.attackRoll ? `${formatMod(item.attackRoll)} atq` : ''}
              {item.damageBonus ? ` ${formatMod(item.damageBonus)} dano` : ''}
              {item.damageDice ? ` ${item.damageDice}` : ''}
            </span>
          </label>
        ))}
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Custo Total</span>
        <span className={styles.totalVal}>{result.mpTotal} PM</span>
      </div>
    </Sheet>
  );
}

ComposeAttackSheet.displayName = 'ComposeAttackSheet';

export default ComposeAttackSheet;
```

- [x] **Passo 2: Criar `ComposeAttackSheet.module.css`**

```css
.baseRow {
  display: flex;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-2);
  margin-bottom: 12px;
}

.baseStat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.baseLabel {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.baseVal {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
}

.listHeader {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 8px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 9px 12px;
  cursor: pointer;
}

.itemInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.itemName {
  font-size: 13px;
  font-weight: 600;
}

.itemSource {
  font-size: 10.5px;
  color: var(--ink-3);
}

.itemDelta {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-ink);
  background: var(--accent-soft);
  padding: 3px 8px;
  border-radius: 7px;
  white-space: nowrap;
}

.totalRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--line-2);
}

.totalLabel {
  font-size: 12px;
  color: var(--ink-2);
  font-weight: 700;
}

.totalVal {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 19px;
  color: var(--accent-ink);
}

.btnCancel {
  flex: 1;
  padding: 11px;
  border-radius: 11px;
  border: 1px solid var(--line-2);
  background: var(--surface-2);
  color: var(--ink-2);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
}

.btnConfirm {
  flex: 1;
  padding: 11px;
  border-radius: 11px;
  border: none;
  background: var(--accent);
  color: #04130d;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
}
```

- [x] **Passo 3: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro. Componente ainda não é importado por ninguém — comportamento
visual verificado na Task 6, junto com a Task 5.

- [x] **Passo 4: Commit**

```bash
git add client/src/components/sheet/ComposeAttackSheet/
git commit -m "feat(attacks): add ComposeAttackSheet component"
```

---

### Task 5: Ligar `ComposeAttackSheet` ao `ActionCard`

**Files:**
- Modify: `client/src/components/sheet/ActionCard/ActionCard.tsx`

**Interfaces:**
- Consumes: `ComposeAttackSheet` (Task 4), `buildAttackChecklist` (Task 3).

- [x] **Passo 1: Importar o necessário e calcular o checklist**

Substituir o topo do arquivo (imports, linhas 1-12) por:

```tsx
import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import {
  formatMod,
  calcAttackRoll,
  buildDamageSummary,
  calcTotalMp,
} from '../../../utils/calculations';
import { buildAttackChecklist } from '../../../utils/attackCompose';
import { playSwordSound, playArrowSound } from '../../../utils/sounds';
import { triggerAttackAnim } from '../../../utils/animations';
import type { Attack } from '../../../types/character';
import Card from '../../ui/Card/Card';
import ComposeAttackSheet from '../ComposeAttackSheet/ComposeAttackSheet';
import styles from './ActionCard.module.css';
```

- [x] **Passo 2: Adicionar estado de composição e o checklist**

Logo depois de `const { character, updateCharacter, readOnly } = useCharacterContext();`
(linha 31), adicionar:

```tsx
const [composing, setComposing] = useState(false);
```

Depois de `if (!character) return null;` (linha 33), adicionar:

```tsx
const checklist = buildAttackChecklist(character, attack);
const hasChecklist = checklist.length > 0;
```

- [x] **Passo 3: Trocar a condição do botão e o clique**

O botão hoje só aparece com `pmTotal > 0` e chama `rollAttack` direto. Passa a
aparecer também quando há checklist, e a decidir entre rolar direto (comportamento
de hoje, sem mudança pra ataque simples) ou abrir a tela de composição:

```tsx
{!readOnly && (pmTotal > 0 || hasChecklist) && (
  <button
    type="button"
    className={styles.btnRoll}
    onClick={hasChecklist ? () => setComposing(true) : rollAttack}
  >
    ⚔ Atacar
  </button>
)}

<ComposeAttackSheet attack={composing ? attack : null} onClose={() => setComposing(false)} />
```

Isso substitui o bloco atual (linhas 110-114) — a linha em branco/comentário que
vinha depois (linha 115) pode ser removida.

- [x] **Passo 4: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro.

- [x] **Passo 5: Commit**

```bash
git add client/src/components/sheet/ActionCard/ActionCard.tsx
git commit -m "feat(attacks): open ComposeAttackSheet from Atacar when there's something to compose"
```

---

### Task 6: Teste manual ponta a ponta no navegador

**Files:** nenhum (só verificação manual).

- [x] **Passo 1: Preparar o personagem de teste**

Suba o dev server (`npm run dev`), abra o personagem "teste". Em Poderes → "+
Personalizado", crie dois poderes:
- "Ataque Poderoso" com Modificador de Ataque: Nome "Ataque Poderoso", Bônus de
  Ataque -2, Bônus de Dano 5, Custo (PM) 0.
- "Smite" com Modificador de Ataque: Nome "Smite", Dado extra "+2d6", Custo (PM) 2.

Em Equipamentos → "+ Item" → Acessório, crie "Manopla de Força" com Modificador de
Ataque: Nome "Manopla de Força", Bônus de Ataque 1.

Em Ataques, crie (ou edite) um ataque corpo a corpo qualquer (ex.: "Espada",
dano 1d8).

- [x] **Passo 2: Abrir o compositor e conferir os 3 modificadores**

Clicar "⚔ Atacar" no card da Espada. Esperado: abre `ComposeAttackSheet` mostrando
Ataque/Dano base e um checklist com "Ataque Poderoso — Poder", "Smite — Poder" e
"Manopla de Força — Item", todos desmarcados.

- [x] **Passo 3: Conferir recálculo ao vivo**

Marcar só "Ataque Poderoso" → Ataque cai 2, Dano sobe 5. Marcar "Smite" também →
Dano ganha "+2d6" concatenado, Custo Total sobe pra 2 PM. Desmarcar "Ataque
Poderoso" → Ataque volta ao valor base, Dano mantém só o +2d6 do Smite.

- [x] **Passo 4: Confirmar e checar PM/histórico**

Marcar os 3, clicar "⚔ Atacar" no rodapé. Esperado: PM do personagem cai em 2
(custo do Smite), a tela fecha, toca o som de ataque. Abrir "..." → Histórico e
confirmar que a entrada registra o ataque com os 3 nomes em `modifiers`.

- [x] **Passo 5: Backward-compat — ataque com `extraBonuses` já cadastrado**

Editar o ataque "Espada" e adicionar um "Modificador de ataque" antigo (campo que já
existia): Nome "Foco", Bônus 1. Salvar. Clicar "⚔ Atacar" de novo — esperado: abre
o compositor com "Foco" já marcado (pré-selecionado). Confirmar sem desmarcar nada
e checar que o Ataque final é igual ao que seria antes desta mudança (base + 1).
Desmarcar "Foco" e confirmar que o total cai de volta ao valor sem o bônus.

- [x] **Passo 6: Ataque simples continua instantâneo**

Criar um ataque novo sem nenhum `extraBonuses`/`extraDamage` cadastrado, e com o
personagem sem nenhum `AttackModifier` disponível (ou testar num personagem
diferente, sem os poderes/item do Passo 1). Clicar "⚔ Atacar" — esperado: ataca na
hora, sem abrir nenhuma tela (comportamento de hoje intacto). Se o personagem "teste"
já tem os modificadores do Passo 1 cadastrados, criar um segundo personagem de teste
descartável só pra esta verificação, ou remover temporariamente os 3
poderes/item antes deste passo e devolvê-los depois.

- [x] **Passo 7: Limpar os dados de teste**

Remover os poderes "Ataque Poderoso"/"Smite", o item "Manopla de Força" e os
ataques de teste criados no personagem "teste" — mesma rotina de limpeza já usada
nas sessões anteriores.

---

### Task 7: Deploy

**Files:** nenhum (infra).

- [ ] **Passo 1: Parar o dev server**

```bash
netstat -ano | grep ":5173" | grep LISTENING
taskkill //F //PID <pid encontrado>
```

- [ ] **Passo 2: Rebuild e redeploy**

```bash
docker compose build app
docker compose up -d app
```

- [ ] **Passo 3: Smoke test**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/
docker compose logs --tail=10 app
```

Esperado: `HTTP 200` e logs sem erro de conexão/migração.
