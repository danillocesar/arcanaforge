# Bônus Fixos (Poderes/Itens sempre ativos) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir marcar um Poder/Habilidade ou Item como "sempre ativo", aplicando
seu bônus automaticamente sem precisar de uma entrada em `character.buffs[]`, e
mostrando esses bônus fixos numa seção própria ("Bônus Fixos"), separada da lista de
Buffs & Condições (que continua só com o que é ligado/desligado manualmente).

**Architecture:** Novo campo `alwaysActive?: boolean` em `Ability` e `InventoryItem`
(+ `buffs?: BuffEffect[]` novo em `InventoryItem`, que hoje não tinha). Uma função
central `getActiveBuffs(character)` em `calculations.ts` junta os buffs manuais ativos
com buffs sintéticos derivados de Poderes/Itens fixos; todo cálculo que hoje relê
`character.buffs` diretamente passa a usar essa função só. Um novo componente
`FixedBonusesPanel` lista os Poderes/Itens fixos, sem toggle, full-width, abaixo da
linha Atributos+Buffs.

**Tech Stack:** React 19 + TypeScript (client), sem framework de teste automatizado
neste projeto — verificação via `npx tsc -b --force` e teste manual no navegador
(claude-in-chrome), seguido de `docker compose build app && docker compose up -d app`.

**Spec:** `docs/superpowers/specs/2026-08-17-fixed-bonuses-design.md`

## Global Constraints

- Só Poder/Habilidade e Item ganham `alwaysActive` — Magia fica de fora (pedido
  explícito do usuário).
- Sem migração de dados — campos novos e opcionais, personagens existentes
  continuam funcionando sem alteração.
- Sem deduplicação/validação cruzada entre `castable` e `alwaysActive` — um
  Poder pode ser as duas coisas ao mesmo tempo, sem bloqueio nem aviso.
- Bônus fixo de Item vale independente de `character.equipped` — mesmo
  comportamento que `attackModifiers` de Item já tem hoje.
- A seção "Bônus Fixos" nunca aparece na lista de Buffs & Condições (toggleável) e
  vice-versa — são duas fontes de dados e duas seções visuais completamente
  separadas.
- A lógica de resumo de efeitos (`summarizeEffects`/`effectTag`/`formatEffectValue`)
  fica num módulo compartilhado (`utils/buffEffects.ts`) — usada tanto por
  `ConditionChip` quanto por `FixedBonusesPanel`, não duplicada.

---

### Task 1: Campo `alwaysActive` em Ability e InventoryItem

**Files:**
- Modify: `client/src/types/character.ts:106-144`

**Interfaces:**
- Produces: `Ability.alwaysActive?: boolean`, `InventoryItem.alwaysActive?: boolean`,
  `InventoryItem.buffs?: BuffEffect[]` (novo em InventoryItem).

- [ ] **Passo 1: Adicionar `alwaysActive` em `Ability`**

Em `client/src/types/character.ts`, na interface `Ability` (linhas 106-121), trocar:

```ts
export interface Ability {
  name: string;
  source: string;
  type: string;
  /** Redesign etiqueta: distinguishes a Poder from a Habilidade in the unified list. */
  kind?: AbilityKind;
  mpCost: number;
  description: string;
  /** Se marcado, aparece na lista de Ações (aba Atributos) com botão de usar. */
  castable?: boolean;
  buffTargetScope?: BuffTargetScope;
  buffs?: BuffEffect[];
  /** Pré-requisito, ex. "Força 13" — presente em poderes gerais do catálogo oficial. */
  prerequisite?: string;
  attackModifiers?: AttackModifier[];
}
```

por:

```ts
export interface Ability {
  name: string;
  source: string;
  type: string;
  /** Redesign etiqueta: distinguishes a Poder from a Habilidade in the unified list. */
  kind?: AbilityKind;
  mpCost: number;
  description: string;
  /** Se marcado, aparece na lista de Ações (aba Atributos) com botão de usar. */
  castable?: boolean;
  buffTargetScope?: BuffTargetScope;
  buffs?: BuffEffect[];
  /** Pré-requisito, ex. "Força 13" — presente em poderes gerais do catálogo oficial. */
  prerequisite?: string;
  attackModifiers?: AttackModifier[];
  /** Se marcado, os `buffs` deste Poder/Habilidade aplicam sempre, sem precisar
   * "conjurar" — aparece na seção "Bônus Fixos", não na lista de Buffs & Condições. */
  alwaysActive?: boolean;
}
```

- [ ] **Passo 2: Adicionar `alwaysActive` e `buffs` em `InventoryItem`**

Na mesma arquivo, na interface `InventoryItem` (linhas 125-144), trocar:

```ts
export interface InventoryItem {
  name: string;
  quantity: number;
  weight: number;
  /** Redesign: groups items into Comuns / Consumíveis / Acessórios. Legacy items → 'comum'. */
  category?: InventoryCategory;
  /** Free-text effect (consumíveis / acessórios). */
  effect?: string;
  /** Equip slot / location (acessórios). */
  slot?: string;
  /** Dados de combate — só usados quando category === 'arma'. Preenchidos ⇒ a arma
   * aparece automaticamente como Ataque na aba Ações, sem precisar cadastrar de novo. */
  damage?: string;
  critical?: string;
  type?: string;
  rangeType?: RangeType;
  mpCost?: number;
  attributeDamageBonus?: string;
  attackModifiers?: AttackModifier[];
}
```

por:

```ts
export interface InventoryItem {
  name: string;
  quantity: number;
  weight: number;
  /** Redesign: groups items into Comuns / Consumíveis / Acessórios. Legacy items → 'comum'. */
  category?: InventoryCategory;
  /** Free-text effect (consumíveis / acessórios). */
  effect?: string;
  /** Equip slot / location (acessórios). */
  slot?: string;
  /** Dados de combate — só usados quando category === 'arma'. Preenchidos ⇒ a arma
   * aparece automaticamente como Ataque na aba Ações, sem precisar cadastrar de novo. */
  damage?: string;
  critical?: string;
  type?: string;
  rangeType?: RangeType;
  mpCost?: number;
  attributeDamageBonus?: string;
  attackModifiers?: AttackModifier[];
  /** Se marcado, os `buffs` deste Item aplicam sempre — aparece na seção
   * "Bônus Fixos", não na lista de Buffs & Condições. Vale independente de o item
   * estar em `character.equipped` (mesma regra que já vale pra `attackModifiers`). */
  alwaysActive?: boolean;
  buffs?: BuffEffect[];
}
```

- [ ] **Passo 3: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro (campos novos e opcionais não quebram nada existente).

- [ ] **Passo 4: Commit**

```bash
git add client/src/types/character.ts
git commit -m "feat(fixed-bonuses): add alwaysActive to Ability/InventoryItem + buffs to InventoryItem"
```

---

### Task 2: Extrair lógica de resumo de efeitos pra `utils/buffEffects.ts`

**Files:**
- Create: `client/src/utils/buffEffects.ts`
- Modify: `client/src/components/sheet/ConditionChip/ConditionChip.tsx`

**Interfaces:**
- Produces: `formatEffectValue(raw: string): string | null`,
  `effectTag(eff: BuffEffect): string`, `summarizeEffects(effects: BuffEffect[]): string`
  — todas exportadas de `utils/buffEffects.ts`, usadas por `ConditionChip` (esta task)
  e por `FixedBonusesPanel` (Task 6).

- [ ] **Passo 1: Criar `client/src/utils/buffEffects.ts`**

```ts
import { ATTRIBUTE_LABELS } from '../data/atributos';
import { SKILLS_CONFIG } from '../data/pericias';
import type { BuffEffect } from '../types/character';

export function formatEffectValue(raw: string): string | null {
  const trimmed = (raw ?? '').toString().trim();
  if (!trimmed || trimmed === '0') return null;
  return /^[+-]/.test(trimmed) ? trimmed : `+${trimmed}`;
}

/** Etiqueta curta do que o efeito afeta — "For", "Vontade", "Atq", "Dano", "PV", "PM", "Def". */
export function effectTag(eff: BuffEffect): string {
  switch (eff.type) {
    case 'attribute':
      return eff.attributeId ? ATTRIBUTE_LABELS[eff.attributeId] : 'Atributo';
    case 'skill': {
      const skill = SKILLS_CONFIG.find((sk) => sk.id === eff.skillId);
      return skill ? skill.name : 'Perícia';
    }
    case 'attack_roll':
      return 'Atq';
    case 'fixed_damage':
    case 'extra_damage':
      return 'Dano';
    case 'hp':
      return 'PV';
    case 'mp':
      return 'PM';
    case 'defense':
      return 'Def';
    default:
      return '';
  }
}

/**
 * Resumo compacto dos efeitos de um buff pra caber numa linha:
 * um efeito → "Tag +valor"; vários com o mesmo valor (comum em buffs que somam o
 * mesmo bônus em várias perícias/atributos) → "Nx +valor"; valores diferentes →
 * junta cada valor com "/", igual ao comportamento antigo.
 */
export function summarizeEffects(effects: BuffEffect[]): string {
  const withValues = effects
    .map((eff) => ({ eff, val: formatEffectValue(eff.value) }))
    .filter((e): e is { eff: BuffEffect; val: string } => e.val != null);

  if (withValues.length === 0) return '';
  if (withValues.length === 1) {
    const { eff, val } = withValues[0];
    const tag = effectTag(eff);
    return tag ? `${tag} ${val}` : val;
  }

  const allSameValue = withValues.every((e) => e.val === withValues[0].val);
  if (allSameValue) return `${withValues.length}x ${withValues[0].val}`;

  return withValues.map((e) => e.val).join('/');
}
```

- [ ] **Passo 2: Atualizar `ConditionChip.tsx` pra importar do módulo novo**

Substituir o conteúdo inteiro de
`client/src/components/sheet/ConditionChip/ConditionChip.tsx` por:

```tsx
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { toggleBuffState } from '../../../utils/calculations';
import { summarizeEffects } from '../../../utils/buffEffects';
import type { Buff } from '../../../types/character';
import styles from './ConditionChip.module.css';

interface ConditionChipProps {
  buff: Buff;
  index: number;
}

type ChipVariant = 'buff' | 'warn' | 'danger';

function inferVariant(buff: Buff): ChipVariant {
  const effects = buff.effects || [];
  if (effects.length === 0) return 'warn';
  const isNegative = effects.some((eff) => {
    const raw = (eff.value ?? '').toString().trim();
    return raw.startsWith('-') || Number(raw) < 0;
  });
  if (isNegative) return 'danger';
  return 'buff';
}

/** Tooltip completo — nome (útil quando a linha corta com "...") + fonte + custo + descrição. */
function buildTooltip(buff: Buff): string {
  const parts = [buff.name || 'Sem nome'];
  if (buff.source) parts.push(buff.source);
  if (buff.mp > 0) parts.push(`${buff.mp} PM`);
  if (buff.description) parts.push(buff.description);
  return parts.join(' · ');
}

function ConditionChip({ buff, index }: ConditionChipProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  const handleToggle = () => updateCharacter((f) => toggleBuffState(f, index));
  const variant = inferVariant(buff);
  const summary = summarizeEffects(buff.effects || []);

  return (
    <button
      type="button"
      className={`${styles.row} ${styles[variant]} ${buff.active ? styles.on : ''}`}
      title={buildTooltip(buff)}
      aria-pressed={buff.active}
      onClick={readOnly ? undefined : handleToggle}
    >
      <span className={styles.name}>{buff.name || 'Sem nome'}</span>
      {summary && <span className={styles.tag}>{summary}</span>}
    </button>
  );
}

ConditionChip.displayName = 'ConditionChip';

export default ConditionChip;
```

- [ ] **Passo 3: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro.

- [ ] **Passo 4: Teste manual no navegador**

Abrir um personagem com pelo menos um buff ativo (ex. "teste" com um buff qualquer
criado via "+ Buff"). Confirmar que a lista de Buffs & Condições continua mostrando
nome + etiqueta do bônus exatamente como antes desta task (nenhuma mudança visual
esperada — é só uma extração de código).

- [ ] **Passo 5: Commit**

```bash
git add client/src/utils/buffEffects.ts client/src/components/sheet/ConditionChip/ConditionChip.tsx
git commit -m "refactor(buffs): extract effect-summary helpers into utils/buffEffects.ts"
```

---

### Task 3: Formulário — campo "Sempre ativo" em Poder/Habilidade e Itens

**Files:**
- Modify: `client/src/components/sheet/SheetForm/entityForms.ts`

**Interfaces:**
- Consumes: `BuffEffect` (Task 1, já existia), `effectsFromValues`/`effectsToForm`
  (já existentes no próprio arquivo, usados pelo formulário de buff manual).
- Produces: campo de formulário `alwaysActive: 'true' | 'false'` e `buffs: FormValues[]`
  em `abilidadeConfig`, `armaConfig` e na fábrica `inventoryConfig` (Acessório/Comum/
  Consumível) — nenhuma outra task depende diretamente destes nomes de campo, só o
  usuário via UI.

- [ ] **Passo 1: Adicionar opções e campo em `abilityFields`/`abilidadeConfig`**

Em `client/src/components/sheet/SheetForm/entityForms.ts`, logo depois de
`const castableOptions = [...]` (por volta da linha 137-140), adicionar:

```ts
const alwaysActiveOptions = [
  { value: 'false', label: 'Não' },
  { value: 'true', label: 'Sim' },
];
```

Trocar `abilityFields` (por volta das linhas 142-160) de:

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

para:

```ts
const abilityFields: FieldDescriptor[] = [
  { key: 'kind', label: 'Tipo', type: 'select', options: kindOptions, half: true },
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome', half: true },
  { key: 'source', label: 'Fonte', type: 'text', placeholder: 'Classe, raça, origem…', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'prerequisite', label: 'Pré-requisito', type: 'text', placeholder: 'Ex.: Força 13' },
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
```

Trocar `abilidadeConfig` (por volta das linhas 162-198) de:

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

para:

```ts
const abilidadeConfig: EntityConfig = {
  title: 'Poder / Habilidade',
  fields: abilityFields,
  empty: () => ({
    kind: 'Poder', name: '', source: '', mpCost: 0, prerequisite: '', description: '',
    castable: 'false', alwaysActive: 'false', buffTargetScope: 'self', buffs: [], attackModifiers: [],
  }),
  fromEntry: (c, i) => {
    const a = c.abilities[i];
    return {
      kind: a.kind ?? 'Poder', name: a.name, source: a.source, mpCost: a.mpCost,
      prerequisite: a.prerequisite ?? '', description: a.description,
      castable: a.castable ? 'true' : 'false',
      alwaysActive: a.alwaysActive ? 'true' : 'false',
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
      alwaysActive: s(v.alwaysActive) === 'true',
      buffTargetScope: s(v.buffTargetScope) || 'self',
      buffs: effectsFromValues(v.buffs),
      attackModifiers: attackModifiersFromValues(v.attackModifiers),
    } as Character['abilities'][number];
    return { ...c, abilities: upsert(c.abilities, entry, i) };
  },
  remove: (c, i) => ({ ...c, abilities: c.abilities.filter((_, idx) => idx !== i) }),
};
```

- [ ] **Passo 2: Adicionar campo na fábrica `inventoryConfig` (Acessório/Comum/Consumível)**

Trocar a função `inventoryConfig` (por volta das linhas 474-507) de:

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

para:

```ts
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
```

- [ ] **Passo 3: Adicionar campo em `armaConfig`**

Trocar `armaConfig` (por volta das linhas 531-582) de:

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

para:

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
```

- [ ] **Passo 4: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro.

- [ ] **Passo 5: Teste manual no navegador**

No personagem "teste": criar um Poder personalizado, marcar "Sempre ativo" = Sim,
confirmar que a seção "Efeitos de Buff" aparece e adicionar um efeito (ex. Atributo
Força +2). Repetir criando um Acessório com "Sempre ativo" = Sim + um efeito. Repetir
criando uma Arma com "Sempre ativo" = Sim + um efeito. Confirmar que os três salvam e
reabrem com os dados certos (a seção de efeitos ainda visível e preenchida).

- [ ] **Passo 6: Commit**

```bash
git add client/src/components/sheet/SheetForm/entityForms.ts
git commit -m "feat(fixed-bonuses): add 'Sempre ativo' field to Poder/Habilidade and Item forms"
```

---

### Task 4: `getActiveBuffs` — selecionador central de buffs em vigor

**Files:**
- Modify: `client/src/utils/calculations.ts`

**Interfaces:**
- Consumes: `Ability.alwaysActive`/`InventoryItem.alwaysActive`/`InventoryItem.buffs`
  (Task 1).
- Produces: `export function getActiveBuffs(character: Character): Buff[]` — usada
  pelas 7 funções desta mesma task e por `composeAttack` (Task 5).

- [ ] **Passo 1: Adicionar `synthesizeAlwaysActiveBuffs`/`getActiveBuffs`**

Em `client/src/utils/calculations.ts`, logo depois de `getTotalLevel` e antes de
`getEffectiveAttribute` (por volta da linha 60-62), adicionar:

```ts
/**
 * Buffs sintéticos, sempre ativos, vindos de Poderes/Habilidades e Itens marcados
 * como `alwaysActive` — não ficam em `character.buffs[]`, são derivados na hora.
 */
function synthesizeAlwaysActiveBuffs(character: Character): Buff[] {
  const fromAbilities = (character.abilities ?? [])
    .filter((a) => a.alwaysActive && (a.buffs?.length ?? 0) > 0)
    .map((a) => ({ name: a.name, effects: a.buffs ?? [], mp: 0, active: true, source: 'Poder' }));
  const fromItems = (character.inventory ?? [])
    .filter((it) => it.alwaysActive && (it.buffs?.length ?? 0) > 0)
    .map((it) => ({ name: it.name, effects: it.buffs ?? [], mp: 0, active: true, source: 'Item' }));
  return [...fromAbilities, ...fromItems];
}

/**
 * Todos os buffs em vigor agora: os manuais ligados em `character.buffs[]` mais os
 * sintéticos de Poderes/Itens fixos. Ponto único usado por todo cálculo que soma
 * efeitos de buff — evita duplicar o filtro `active`/iteração em cada função.
 */
export function getActiveBuffs(character: Character): Buff[] {
  return [...(character.buffs ?? []).filter((b) => b.active), ...synthesizeAlwaysActiveBuffs(character)];
}
```

- [ ] **Passo 2: Trocar o laço de buffs em `getEffectiveAttribute`**

Trocar:

```ts
export function getEffectiveAttribute(character: Character, attr: AttributeId): number {
  let val = character.attributes[attr] || 0;
  if (character.buffs) {
    character.buffs.forEach((b) => {
      if (!b.active) return;
      (b.effects || []).forEach((eff) => {
        if (eff.type === 'attribute' && eff.attributeId === attr) {
          val += Number(eff.value) || 0;
        }
      });
    });
  }
  return val;
}
```

por:

```ts
export function getEffectiveAttribute(character: Character, attr: AttributeId): number {
  let val = character.attributes[attr] || 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attribute' && eff.attributeId === attr) {
        val += Number(eff.value) || 0;
      }
    });
  });
  return val;
}
```

- [ ] **Passo 3: Trocar o laço de buffs em `calcTotalSkill`**

Trocar:

```ts
  let buffBonus = 0;
  if (character.buffs) {
    character.buffs.forEach((b) => {
      if (!b.active) return;
      (b.effects || []).forEach((eff) => {
        if (eff.type === 'skill' && eff.skillId === skillId) {
          buffBonus += Number(eff.value) || 0;
        }
      });
    });
  }
  return halfLevel + attributeMod + trainingBonus + miscBonus + armorPenalty + buffBonus;
```

por:

```ts
  let buffBonus = 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'skill' && eff.skillId === skillId) {
        buffBonus += Number(eff.value) || 0;
      }
    });
  });
  return halfLevel + attributeMod + trainingBonus + miscBonus + armorPenalty + buffBonus;
```

- [ ] **Passo 4: Trocar o laço de buffs em `calcTotalDefense`**

Trocar:

```ts
export function calcTotalDefense(character: Character): number {
  let total = (character.defense.base || 10) + getEffectiveAttribute(character, 'dex');
  if (character.defense.items) {
    character.defense.items.forEach((item) => {
      total += item.value || 0;
    });
  }
  if (character.buffs) {
    character.buffs.forEach((b) => {
      if (!b.active) return;
      (b.effects || []).forEach((eff) => {
        if (eff.type === 'defense') total += Number(eff.value) || 0;
      });
    });
  }
  return total;
}
```

por:

```ts
export function calcTotalDefense(character: Character): number {
  let total = (character.defense.base || 10) + getEffectiveAttribute(character, 'dex');
  if (character.defense.items) {
    character.defense.items.forEach((item) => {
      total += item.value || 0;
    });
  }
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'defense') total += Number(eff.value) || 0;
    });
  });
  return total;
}
```

- [ ] **Passo 5: Trocar o filtro de buffs em `getDefenseBreakdown`**

Trocar:

```ts
  const buffs: DefenseBreakdownRow[] = (character.buffs || [])
    .filter((b) => b.active)
    .flatMap((b) => (b.effects || [])
      .filter((eff) => eff.type === 'defense')
      .map((eff) => ({ name: b.name || 'Buff', value: Number(eff.value) || 0 })));
```

por:

```ts
  const buffs: DefenseBreakdownRow[] = getActiveBuffs(character)
    .flatMap((b) => (b.effects || [])
      .filter((eff) => eff.type === 'defense')
      .map((eff) => ({ name: b.name || 'Buff', value: Number(eff.value) || 0 })));
```

- [ ] **Passo 6: Trocar o laço de buffs em `calcAttackRoll`**

Trocar:

```ts
export function calcAttackRoll(character: Character, atk: Character['attacks'][number]): number {
  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  let total = calcTotalSkill(character, skillId);
  if (atk.extraBonuses) atk.extraBonuses.forEach((b) => { total += Number(b.value) || 0; });
  if (character.buffs) character.buffs.forEach((b) => {
    if (!b.active) return;
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attack_roll') total += Number(eff.value) || 0;
    });
  });
  return total;
}
```

por:

```ts
export function calcAttackRoll(character: Character, atk: Character['attacks'][number]): number {
  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  let total = calcTotalSkill(character, skillId);
  if (atk.extraBonuses) atk.extraBonuses.forEach((b) => { total += Number(b.value) || 0; });
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attack_roll') total += Number(eff.value) || 0;
    });
  });
  return total;
}
```

- [ ] **Passo 7: Trocar o laço de buffs em `calcDamageBonus`**

Trocar:

```ts
export function calcDamageBonus(character: Character, atk: Character['attacks'][number]): number {
  const attrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  let total = getEffectiveAttribute(character, attrKey);
  if (atk.extraDamage) atk.extraDamage.forEach((b) => { total += Number(b.value) || 0; });
  if (character.buffs) character.buffs.forEach((b) => {
    if (!b.active) return;
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'fixed_damage') total += Number(eff.value) || 0;
    });
  });
  return total;
}
```

por:

```ts
export function calcDamageBonus(character: Character, atk: Character['attacks'][number]): number {
  const attrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  let total = getEffectiveAttribute(character, attrKey);
  if (atk.extraDamage) atk.extraDamage.forEach((b) => { total += Number(b.value) || 0; });
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'fixed_damage') total += Number(eff.value) || 0;
    });
  });
  return total;
}
```

- [ ] **Passo 8: Trocar o laço de buffs em `buildDamageSummary`**

Trocar:

```ts
  if (character.buffs) character.buffs.forEach((b) => {
    if (!b.active) return;
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'extra_damage') {
        const v = String(eff.value || '');
        if (v) extraDice.push(v);
      }
    });
  });
  extraDice.forEach((d) => parts.push(d));
```

por:

```ts
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'extra_damage') {
        const v = String(eff.value || '');
        if (v) extraDice.push(v);
      }
    });
  });
  extraDice.forEach((d) => parts.push(d));
```

- [ ] **Passo 9: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro.

- [ ] **Passo 10: Commit**

```bash
git add client/src/utils/calculations.ts
git commit -m "feat(fixed-bonuses): add getActiveBuffs selector, use it in all buff-aware calculations"
```

---

### Task 5: `composeAttack` usa `getActiveBuffs`

**Files:**
- Modify: `client/src/utils/attackCompose.ts`

**Interfaces:**
- Consumes: `getActiveBuffs` (Task 4).

- [ ] **Passo 1: Importar `getActiveBuffs`**

Em `client/src/utils/attackCompose.ts`, trocar a linha 2:

```ts
import { calcTotalSkill, getEffectiveAttribute, formatMod } from './calculations';
```

por:

```ts
import { calcTotalSkill, getEffectiveAttribute, getActiveBuffs, formatMod } from './calculations';
```

- [ ] **Passo 2: Trocar o laço de buffs em `composeAttack`**

Trocar:

```ts
  if (character.buffs) character.buffs.forEach((b) => {
    if (!b.active) return;
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attack_roll') attackRoll += Number(eff.value) || 0;
      if (eff.type === 'fixed_damage') damageBonus += Number(eff.value) || 0;
      if (eff.type === 'extra_damage' && eff.value) extraDice.push(String(eff.value));
    });
  });
```

por:

```ts
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attack_roll') attackRoll += Number(eff.value) || 0;
      if (eff.type === 'fixed_damage') damageBonus += Number(eff.value) || 0;
      if (eff.type === 'extra_damage' && eff.value) extraDice.push(String(eff.value));
    });
  });
```

- [ ] **Passo 3: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro.

- [ ] **Passo 4: Commit**

```bash
git add client/src/utils/attackCompose.ts
git commit -m "feat(fixed-bonuses): composeAttack uses getActiveBuffs for buff-derived deltas"
```

---

### Task 6: Componente `FixedBonusesPanel` + wiring

**Files:**
- Create: `client/src/components/sheet/FixedBonusesPanel/FixedBonusesPanel.tsx`
- Create: `client/src/components/sheet/FixedBonusesPanel/FixedBonusesPanel.module.css`
- Modify: `client/src/components/sheet/TormentaSheetBody/TormentaSheetBody.tsx`

**Interfaces:**
- Consumes: `summarizeEffects` (Task 2), `Ability.alwaysActive`/`InventoryItem.alwaysActive`
  (Task 1).

- [ ] **Passo 1: Criar `FixedBonusesPanel.tsx`**

```tsx
import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import { summarizeEffects } from '../../../utils/buffEffects';
import styles from './FixedBonusesPanel.module.css';

interface FixedRow {
  key: string;
  name: string;
  summary: string;
}

/**
 * Lista os Poderes/Habilidades e Itens marcados como `alwaysActive` — só leitura,
 * nunca desliga, por isso fica numa seção separada da lista de Buffs & Condições
 * (que é toggleável). Some da tela quando não há nenhuma fonte fixa.
 */
function FixedBonusesPanel() {
  const { character } = useCharacterContext();

  if (!character) return null;

  const fromAbilities: FixedRow[] = (character.abilities ?? [])
    .filter((a) => a.alwaysActive && (a.buffs?.length ?? 0) > 0)
    .map((a, i) => ({
      key: `ability-${i}`,
      name: a.name || 'Sem nome',
      summary: summarizeEffects(a.buffs ?? []),
    }));

  const fromItems: FixedRow[] = (character.inventory ?? [])
    .filter((it) => it.alwaysActive && (it.buffs?.length ?? 0) > 0)
    .map((it, i) => ({
      key: `item-${i}`,
      name: it.name || 'Sem nome',
      summary: summarizeEffects(it.buffs ?? []),
    }));

  const rows = [...fromAbilities, ...fromItems];

  if (rows.length === 0) return null;

  return (
    <div className={styles.panel}>
      <SectionHeader title="Bônus Fixos" />
      <div className={styles.list}>
        {rows.map((row) => (
          <div key={row.key} className={styles.row}>
            <span className={styles.name}>{row.name}</span>
            {row.summary && <span className={styles.tag}>{row.summary}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

FixedBonusesPanel.displayName = 'FixedBonusesPanel';

export default FixedBonusesPanel;
```

- [ ] **Passo 2: Criar `FixedBonusesPanel.module.css`**

```css
.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
  padding: 6px 9px;
}

.name {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 130px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-ink);
  white-space: nowrap;
}
```

- [ ] **Passo 3: Wire em `TormentaSheetBody.tsx`**

Trocar o import (linha 9-10):

```ts
import BuffsPanel from '../BuffsPanel/BuffsPanel';
import AcoesPanel from '../AcoesPanel/AcoesPanel';
```

por:

```ts
import BuffsPanel from '../BuffsPanel/BuffsPanel';
import FixedBonusesPanel from '../FixedBonusesPanel/FixedBonusesPanel';
import AcoesPanel from '../AcoesPanel/AcoesPanel';
```

Trocar o case `'atributos'` de:

```ts
    case 'atributos':
      return (
        <>
          <div className={styles.atributosRow}>
            <div className={styles.atributosMain}>
              <AttributesPanel />
            </div>
            <div className={styles.atributosBuffs}>
              <BuffsPanel />
            </div>
          </div>
          <AcoesPanel />
        </>
      );
```

por:

```ts
    case 'atributos':
      return (
        <>
          <div className={styles.atributosRow}>
            <div className={styles.atributosMain}>
              <AttributesPanel />
            </div>
            <div className={styles.atributosBuffs}>
              <BuffsPanel />
            </div>
          </div>
          <FixedBonusesPanel />
          <AcoesPanel />
        </>
      );
```

- [ ] **Passo 4: Typecheck**

Rodar: `cd client && npx tsc -b --force`
Esperado: nenhum erro.

- [ ] **Passo 5: Commit**

```bash
git add client/src/components/sheet/FixedBonusesPanel/ client/src/components/sheet/TormentaSheetBody/TormentaSheetBody.tsx
git commit -m "feat(fixed-bonuses): add FixedBonusesPanel, wired below Atributos+Buffs"
```

---

### Task 7: Teste manual ponta a ponta no navegador

**Files:** nenhum (só verificação manual).

- [ ] **Passo 1: Poder fixo com efeito de atributo**

No personagem "teste", criar um Poder personalizado "Bônus Fixo Teste", marcar
"Sempre ativo" = Sim, adicionar efeito Atributo → Força +2. Salvar. Esperado: NÃO
aparece na lista "Buffs & Condições"; aparece na nova seção "Bônus Fixos" (abaixo da
linha Atributos+Buffs) como "Bônus Fixo Teste — For +2"; o atributo Força na aba
Atributos já reflete o +2 imediatamente, sem precisar ligar nada.

- [ ] **Passo 2: Item fixo com efeito de defesa**

Criar um Acessório "Amuleto Teste", marcar "Sempre ativo" = Sim, adicionar efeito
Defesa +1. Esperado: aparece em "Bônus Fixos" como "Amuleto Teste — Def +1"; a Defesa
total na aba Atributos sobe em 1 imediatamente.

- [ ] **Passo 3: Desmarcar remove o efeito**

Editar o Poder "Bônus Fixo Teste", trocar "Sempre ativo" pra Não, salvar. Esperado:
some da seção "Bônus Fixos"; Força volta ao valor sem o +2.

- [ ] **Passo 4: Poder conjurável + fixo ao mesmo tempo não quebra**

Marcar "Bônus Fixo Teste" como "Sempre ativo" = Sim de novo, e também "Conjurável" =
Sim com um efeito de buff próprio (ex. Ataque +1). Esperado: aparece tanto na lista de
Ações (com botão de conjurar) quanto na seção "Bônus Fixos", cada mecanismo
funcionando independentemente (conjurar cria/atualiza uma entrada em Buffs &
Condições; o efeito fixo continua valendo à parte, sem interferência).

- [ ] **Passo 5: Buffs & Condições continua igual**

Confirmar que criar/ligar/desligar um buff manual via "+ Buff" continua funcionando
exatamente como antes — aparece só na lista toggleável, nunca em "Bônus Fixos".

- [ ] **Passo 6: Limpar os dados de teste**

Remover o Poder "Bônus Fixo Teste" e o Acessório "Amuleto Teste" do personagem
"teste".

---

### Task 8: Deploy

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
