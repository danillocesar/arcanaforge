# Variáveis (atributo / nível) nos efeitos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um efeito de buff (em poder, magia, buff manual, item) pode valer "fixo + atributo + nível/metade do nível"; os modificadores próprios do ataque e a linha da perícia também aceitam atributo.

**Architecture:** Campos estruturados (`attributeBonus`, `levelBonus`) no `BuffEffect`, seguindo o precedente já entregue em `AttackModifier.attackRollAttribute` — sem parser de fórmula. Um único `resolveEffectValue(eff, character)` em `calculations.ts` substitui os ~18 `Number(eff.value)`; a regra anti-ciclo lê o atributo-guia só com buffs de valor fixo. Buff aplicado no grupo é congelado com os números do conjurador.

**Tech Stack:** React 19 + TypeScript strict, vitest.

**Spec:** `docs/backlog-ficha-2026-08-26.md` — épico **E3** (H3.1–H3.4).

## Global Constraints

- Fichas antigas (sem os campos novos) devem produzir **exatamente** os mesmos números de hoje — os testes existentes de `calculations.test.ts` e `attackCompose.test.ts` não podem mudar de expectativa.
- `extra_damage` continua string de dado (`1d6`); `resolveEffectValue` não se aplica a ele.
- Anti-ciclo: ao resolver `attributeBonus`, o atributo-guia = base + efeitos `attribute` de valor fixo (sem `attributeBonus`) + `levelBonus`. Um nível de derivação, documentado e testado.
- Buff `party` congela variáveis no `CastActionSheet` (valor resolvido do conjurador, campos de variável removidos), igual `dc`.
- Testes: `npm --prefix client run test`; tipagem `npx --prefix client tsc -b client`. Um commit por tarefa.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `client/src/types/character.ts` | `BuffEffect.attributeBonus/levelBonus`; `ExtraBonus/ExtraDamage.attribute`; `SkillData.bonusAttribute` |
| `client/src/utils/calculations.ts` (+ test) | `resolveEffectValue`, `guideAttribute`, troca dos `Number(eff.value)`; `calcTotalSkill` com `bonusAttribute`; `calcAttackRoll/calcDamageBonus` com `attribute` |
| `client/src/utils/attackCompose.ts` (+ test) | usa `resolveEffectValue`; linhas próprias do ataque com atributo |
| `client/src/utils/buffEffects.ts` (+ test) | `formatEffectFormula` para etiquetas (`+2 +Int +½nível`); `freezeEffects` |
| `client/src/components/sheet/SheetForm/entityForms.ts` | selects "+ atributo"/"+ nível" nos efeitos; atributo nos modificadores do ataque |
| `client/src/components/sheet/CastActionSheet/CastActionSheet.tsx` | congela para o grupo |
| `client/src/components/sheet/{ConditionChip,BuffsDrawer,FixedBonusesPanel,DefenseBreakdown,SkillRow}/` | exibição / select de perícia |

---

### Task 1: Motor — `resolveEffectValue` e troca dos pontos de leitura (H3.1)

**Files:**
- Modify: `client/src/types/character.ts:75-80`, `client/src/utils/calculations.ts`, `client/src/utils/calculations.test.ts`, `client/src/utils/attackCompose.ts`

**Interfaces:**
- `BuffEffect.attributeBonus?: AttributeId`; `BuffEffect.levelBonus?: 'full' | 'half'`
- `guideAttribute(character, attr): number` — atributo-guia anti-ciclo
- `resolveEffectValue(eff: BuffEffect, character: Character): number`

- [ ] **Step 1: Testes** (em `calculations.test.ts`):

```ts
describe('resolveEffectValue', () => {
  const c = baseCharacter({ classes: [{ name: 'Mago', level: 9 }], attributes: { str: 1, dex: 2, con: 0, int: 4, wis: 0, cha: 0 } });
  it('valor fixo continua igual', () => {
    expect(resolveEffectValue({ type: 'skill', skillId: 'misticismo', value: '2' }, c)).toBe(2);
  });
  it('soma o atributo e o nível/metade do nível', () => {
    expect(resolveEffectValue({ type: 'skill', skillId: 'misticismo', value: '2', attributeBonus: 'int' }, c)).toBe(6);
    expect(resolveEffectValue({ type: 'defense', value: '', levelBonus: 'half' }, c)).toBe(4);
    expect(resolveEffectValue({ type: 'defense', value: '1', levelBonus: 'full', attributeBonus: 'dex' }, c)).toBe(12);
  });
  it('o atributo-guia inclui buffs de atributo de valor fixo, mas não os derivados de outro atributo (sem ciclo)', () => {
    const cyc = baseCharacter({
      attributes: { str: 2, dex: 3, con: 0, int: 0, wis: 0, cha: 0 },
      buffs: [
        activeBuff({ name: 'fixo', effects: [{ type: 'attribute', attributeId: 'str', value: '1' }] }),
        activeBuff({ name: 'For em Des', effects: [{ type: 'attribute', attributeId: 'dex', value: '', attributeBonus: 'str' }] }),
        activeBuff({ name: 'Des em For', effects: [{ type: 'attribute', attributeId: 'str', value: '', attributeBonus: 'dex' }] }),
      ],
    });
    // For efetiva = 2 (base) + 1 (fixo) + Des-guia(3) = 6 ; Des efetiva = 3 + For-guia(2+1=3) = 6
    expect(getEffectiveAttribute(cyc, 'str')).toBe(6);
    expect(getEffectiveAttribute(cyc, 'dex')).toBe(6);
  });
  it('efeito de perícia com atributo entra em calcTotalSkill', () => {
    const s = baseCharacter({ classes: [{ name: 'Mago', level: 4 }], attributes: { str: 0, dex: 0, con: 0, int: 3, wis: 0, cha: 0 },
      buffs: [activeBuff({ effects: [{ type: 'skill', skillId: 'intimidacao', value: '', attributeBonus: 'int' }] })] });
    // meio nível 2 + Car 0 + Int 3 (buff) = 5
    expect(calcTotalSkill(s, 'intimidacao')).toBe(5);
  });
});
```

- [ ] **Step 2: Rodar** → FAIL (`resolveEffectValue` não exportado).

- [ ] **Step 3: Tipos** — em `BuffEffect`:

```ts
export interface BuffEffect {
  type: BuffType;
  attributeId?: AttributeId;
  skillId?: string;
  /** Termo fixo. Continua string por causa dos dados em `extra_damage` ("1d6"). */
  value: string;
  /** Variável: soma o valor efetivo deste atributo (ex.: "+Int em Misticismo"). Resolvido em
   * `resolveEffectValue`; buff de grupo é congelado no conjurador (CastActionSheet). */
  attributeBonus?: AttributeId;
  /** Variável: soma o nível ('full') ou metade do nível ('half') do personagem. */
  levelBonus?: 'full' | 'half';
}
```

- [ ] **Step 4: Implementar em `calculations.ts`** (logo após `getActiveBuffs`):

```ts
/**
 * Atributo-guia para variáveis: base + efeitos `attribute` de VALOR FIXO (+ nível) — nunca os
 * que dependem de outro atributo. Um nível de derivação, sem ciclo ("+For em Des" e "+Des em
 * For" ativos ao mesmo tempo terminam, cada um lendo o guia do outro).
 */
export function guideAttribute(character: Character, attr: AttributeId): number {
  let val = character.attributes[attr] || 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attribute' && eff.attributeId === attr && !eff.attributeBonus) {
        val += (Number(eff.value) || 0) + levelTerm(eff, character);
      }
    });
  });
  return val;
}

function levelTerm(eff: BuffEffect, character: Character): number {
  if (eff.levelBonus === 'full') return getTotalLevel(character);
  if (eff.levelBonus === 'half') return Math.floor(getTotalLevel(character) / 2);
  return 0;
}

/** Valor numérico de um efeito: fixo + atributo-guia + nível. Não usar para `extra_damage`. */
export function resolveEffectValue(eff: BuffEffect, character: Character): number {
  const fixed = Number(eff.value) || 0;
  const attr = eff.attributeBonus ? guideAttribute(character, eff.attributeBonus) : 0;
  return fixed + attr + levelTerm(eff, character);
}
```

Trocar **todos** os `Number(eff.value) || 0` de `calculations.ts` por `resolveEffectValue(eff, character)` nas funções: `getEffectiveAttribute` (`:110`), `getEffectiveMaxHp/Mp` (`:126/:137`), `calcTotalSkill` (`:177`), `calcTotalDefense` (`:194`), `getDefenseBreakdown` (`:238`), `toggleBuffState` (`:265`), `calcAttackRoll` (`:329`), `calcDamageBonus` (`:341`), `applyBuffToCharacter` (`:501/:509/:529` — usar o `character` recebido). Em `attackCompose.ts` (`composeAttack`, bloco `getActiveBuffs`): `attack_roll` e `fixed_damage` via `resolveEffectValue`; `extra_damage` continua string.

- [ ] **Step 5: Rodar tudo** — `npm --prefix client run test` → PASS (inclusive os antigos, inalterados).
- [ ] **Step 6: Commit** — `git commit -am "feat(efeitos): valor de efeito = fixo + atributo + nível, resolvido num ponto só (anti-ciclo)"`

---

### Task 2: Formulário, etiquetas e congelamento no grupo (H3.2 + parte de H3.1)

**Files:**
- Modify: `client/src/components/sheet/SheetForm/entityForms.ts` (`BUFF_EFFECT_ITEM_FIELDS`, `effectsFromValues`, `effectsToForm`, `emptyBuffEffect`)
- Modify: `client/src/utils/buffEffects.ts`, `client/src/utils/buffEffects.test.ts`
- Modify: `client/src/components/sheet/CastActionSheet/CastActionSheet.tsx`

**Interfaces:**
- `formatEffectFormula(eff: BuffEffect): string | null` — `"+2 +Int"`, `"+Int"`, `"+2 +½nível"`, `null` se tudo vazio
- `freezeEffects(effects: BuffEffect[], character: Character): BuffEffect[]` — resolve variáveis em `value` fixo e remove `attributeBonus`/`levelBonus`

- [ ] **Step 1: Testes** (`buffEffects.test.ts`):

```ts
describe('formatEffectFormula', () => {
  it('mostra fixo e variáveis', () => {
    expect(formatEffectFormula({ type: 'skill', value: '2', attributeBonus: 'int' })).toBe('+2 +Int');
    expect(formatEffectFormula({ type: 'defense', value: '', levelBonus: 'half' })).toBe('+½nível');
    expect(formatEffectFormula({ type: 'attribute', attributeId: 'str', value: '-1', attributeBonus: 'dex', levelBonus: 'full' })).toBe('-1 +Des +nível');
    expect(formatEffectFormula({ type: 'defense', value: '' })).toBeNull();
  });
});
describe('summarizeEffects com variáveis', () => {
  it('usa a fórmula quando o efeito tem variável', () => {
    expect(summarizeEffects([{ type: 'skill', skillId: 'misticismo', value: '', attributeBonus: 'int' }])).toBe('Misticismo +Int');
  });
});
```

E em `calculations.test.ts` (ou `buffEffects.test.ts` se `freezeEffects` morar lá — ele precisa de `resolveEffectValue`, então fica em `calculations.ts`):

```ts
describe('freezeEffects', () => {
  it('resolve as variáveis com os números do conjurador e remove os campos de variável', () => {
    const c = baseCharacter({ classes: [{ name: 'Clérigo', level: 6 }], attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 3, cha: 0 } });
    expect(freezeEffects([{ type: 'skill', skillId: 'cura', value: '1', attributeBonus: 'wis', levelBonus: 'half' }], c))
      .toEqual([{ type: 'skill', skillId: 'cura', value: '7' }]);
  });
  it('extra_damage passa intacto', () => {
    expect(freezeEffects([{ type: 'extra_damage', value: '1d6' }], baseCharacter())).toEqual([{ type: 'extra_damage', value: '1d6' }]);
  });
});
```

- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar**

`buffEffects.ts`:

```ts
const LEVEL_LABEL = { full: '+nível', half: '+½nível' } as const;

export function formatEffectFormula(eff: BuffEffect): string | null {
  const parts: string[] = [];
  const fixed = formatEffectValue(eff.value);
  if (fixed) parts.push(fixed);
  if (eff.attributeBonus) parts.push(`+${ATTRIBUTE_LABELS[eff.attributeBonus]}`);
  if (eff.levelBonus) parts.push(LEVEL_LABEL[eff.levelBonus]);
  return parts.length ? parts.join(' ') : null;
}
```

Em `summarizeEffects`, trocar `formatEffectValue(eff.value)` por `formatEffectFormula(eff)` (mantém o comportamento antigo quando não há variável). `BuffsDrawer.buildSummary` local também passa a usar `formatEffectFormula`.

`calculations.ts`:

```ts
/** Buff que viaja para outro personagem leva os NÚMEROS do conjurador — variável resolvida
 * aqui e removida, igual à CD (`dc`). Dados (`extra_damage`) passam intactos. */
export function freezeEffects(effects: BuffEffect[], character: Character): BuffEffect[] {
  return effects.map((eff) => {
    if (normalizeEffectType(eff.type) === 'extra_damage' || (!eff.attributeBonus && !eff.levelBonus)) return eff;
    const { attributeBonus: _a, levelBonus: _l, ...rest } = eff;
    return { ...rest, value: String(resolveEffectValue(eff, character)) };
  });
}
```

`CastActionSheet`: `buffPayload.effects = freezeEffects(combinedBuffs, character)` — para **todos** os casos (self incluído? Não: o buff só para si continua dinâmico). Implementar: `const partyEffects = freezeEffects(combinedBuffs, character);` e usar `{ ...buffPayload, effects: partyEffects }` só na chamada `apiApplyBuffToParty`; o `applyBuffToCharacter` local segue com `combinedBuffs`.

`entityForms.ts`:

```ts
const effectAttrOptions = [{ value: '', label: '— Nenhum —' }, ...attrOptions];
const levelBonusOptions = [{ value: '', label: 'Não' }, { value: 'full', label: 'Nível' }, { value: 'half', label: 'Metade do nível' }];

const BUFF_EFFECT_ITEM_FIELDS: FieldDescriptor[] = [
  // …type / attributeId / skillId como hoje…
  { key: 'value', label: 'Valor', type: 'text', placeholder: 'Ex.: 2, -1 ou 1d6 (dado só em Dano Extra)', half: true },
  {
    key: 'attributeBonus', label: '+ atributo', type: 'select', options: effectAttrOptions, half: true,
    showIf: (v) => v.type !== 'extra_damage',
  },
  {
    key: 'levelBonus', label: '+ nível', type: 'select', options: levelBonusOptions, half: true,
    showIf: (v) => v.type !== 'extra_damage',
  },
];
const emptyBuffEffect = (): FormValues => ({ type: 'attack_roll', attributeId: 'str', skillId: '', value: '', attributeBonus: '', levelBonus: '' });
```

`effectsFromValues`: `attributeBonus: (s(row.attributeBonus) || undefined) as AttributeId | undefined, levelBonus: (s(row.levelBonus) || undefined) as 'full' | 'half' | undefined` (não gravar para `extra_damage`). `effectsToForm`: `attributeBonus: eff.attributeBonus ?? '', levelBonus: eff.levelBonus ?? ''`.

`DefenseBreakdown` já recebe números resolvidos via `getDefenseBreakdown`; `FixedBonusesPanel`/`ConditionChip` usam `summarizeEffects` (já atualizado).

- [ ] **Step 4: Rodar + tipagem + manual** (poder "Erudição": efeito Perícia Misticismo, valor vazio, + atributo Int → chip "Misticismo +Int", total da perícia sobe pelo Int).
- [ ] **Step 5: Commit** — `git commit -am "feat(efeitos): selects '+ atributo' e '+ nível' nos efeitos de buff; etiquetas com fórmula; buff de grupo congelado"`

---

### Task 3: Modificadores próprios do ataque com atributo (H3.3)

**Files:**
- Modify: `client/src/types/character.ts:31-41`, `client/src/components/sheet/SheetForm/entityForms.ts` (`ataqueFields`, `ataqueConfig`), `client/src/utils/attackCompose.ts` (+ test), `client/src/utils/calculations.ts` (`calcAttackRoll`, `calcDamageBonus`)

- [ ] **Step 1: Testes** (`attackCompose.test.ts`):

```ts
it('modificador próprio do ataque com atributo soma o atributo efetivo no acerto/dano', () => {
  const c = { ...createEmptyCharacter('T'), attributes: { str: 3, dex: 1, con: 0, int: 0, wis: 0, cha: 0 } };
  const atk = { name: 'Espada', damage: '1d8', critical: '', type: 'Corte', rangeType: 'melee', mpCost: 0, attributeDamageBonus: 'str',
    extraBonuses: [{ name: 'Foco', value: 1, mp: 0, attribute: 'dex' }],
    extraDamage: [{ name: 'Brutal', value: '2', mp: 0, attribute: 'str' }] };
  const items = buildAttackChecklist(c, atk);
  expect(items.find((i) => i.key === 'own-bonus-0')?.attackRoll).toBe(2);   // 1 + Des 1
  expect(items.find((i) => i.key === 'own-damage-0')?.damageBonus).toBe(5); // 2 + For 3
});
```

E em `calculations.test.ts`: `calcAttackRoll`/`calcDamageBonus` com os mesmos dados → acerto inclui +2 e dano +5 além dos termos base.

- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar**
- Tipos: `ExtraBonus.attribute?: AttributeId`, `ExtraDamage.attribute?: AttributeId` (doc: "soma o valor efetivo do atributo, além do fixo").
- `ataqueFields`: nas duas listas, sub-campo `{ key: 'attribute', label: '+ atributo', type: 'select', options: attackModifierAttrOptions }`; `fromEntry` copia `attribute: b.attribute ?? ''`; `apply` grava `attribute: (s(b.attribute) || undefined) as AttributeId | undefined`.
- `attackCompose.buildAttackChecklist`: `own-bonus-*` → `attackRoll: (Number(b.value) || 0) + (b.attribute ? attrValue(b.attribute) : 0)`; `own-damage-*` → `damageBonus: (isDice ? 0 : Number(raw) || 0) + (d.attribute ? attrValue(d.attribute) : 0)`.
- `calculations.calcAttackRoll`: `total += (Number(b.value) || 0) + (b.attribute ? getEffectiveAttribute(character, b.attribute) : 0)`; `calcDamageBonus`: idem para `extraDamage` numéricos (dado continua em `buildDamageSummary`).

- [ ] **Step 4: Rodar + tipagem**. **Step 5: Commit** — `git commit -am "feat(ataque): modificadores próprios do ataque aceitam '+ atributo'"`

---

### Task 4: Bônus por atributo direto na perícia (H3.4)

**Files:**
- Modify: `client/src/types/character.ts` (`SkillData`), `client/src/utils/calculations.ts` (`calcTotalSkill`, + test), `client/src/components/sheet/SkillRow/SkillRow.tsx` (+ css)

- [ ] **Step 1: Teste**:

```ts
it('soma o bonusAttribute da perícia usando o atributo-guia', () => {
  const c = baseCharacter({ classes: [{ name: 'Bardo', level: 2 }], attributes: { str: 0, dex: 0, con: 0, int: 2, wis: 0, cha: 3 },
    skills: { ...createEmptyCharacter('x').skills, diplomacia: { trained: false, misc: 0, bonusAttribute: 'int' } } });
  expect(calcTotalSkill(c, 'diplomacia')).toBe(1 + 3 + 2); // meio nível + Car + Int
});
```

- [ ] **Step 2: Implementar** — `SkillData.bonusAttribute?: AttributeId`; em `calcTotalSkill`: `const bonusAttr = skill.bonusAttribute ? guideAttribute(character, skill.bonusAttribute) : 0;` somado ao total. `SkillRow`: select compacto (`<select className={styles.bonusAttr}>` com "—" + For…Car) ao lado do `NumberField`, só em modo edição, `aria-label="Somar atributo"`; CSS `.bonusAttr { width: 54px; font-size: 11px; background: var(--surface-2); border: 1px solid var(--line-2); border-radius: 8px; color: var(--ink); }`. Quando definido, o `<small>` da linha mostra `Carisma + Int`.

- [ ] **Step 3: Rodar + tipagem + commit** — `git commit -am "feat(pericias): '+ atributo' direto na linha da perícia"`

---

## Self-review

- **Cobertura:** H3.1 → T1 (+ `freezeEffects` na T2, exibição via `getDefenseBreakdown` resolvido); H3.2 → T2 (selects em todos os formulários por herança de `BUFF_EFFECT_ITEM_FIELDS`, `effectsFromValues/ToForm`, placeholder, etiquetas em chips/drawer/fixos/card); H3.3 → T3; H3.4 → T4.
- **Anti-regressão:** T1 não muda expectativas antigas; a única alteração de comportamento em fichas existentes é zero.
- **Consistência de nomes:** `attributeBonus`, `levelBonus`, `guideAttribute`, `resolveEffectValue`, `formatEffectFormula`, `freezeEffects`, `ExtraBonus.attribute`, `SkillData.bonusAttribute`.
