# Sistema de Buffs Multi-Alvo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let magias e poderes concedam um ou mais efeitos de buff (base + aprimoramentos), e ao conjurar/usar, o jogador escolha quais personagens do grupo recebem o buff — aplicado automaticamente, ativo, com aviso em tempo real.

**Architecture:** `Buff` passa de {type, attributeId, skillId, value} achatado para {name, effects: BuffEffect[]}. Magias/Poderes ganham a mesma lista de efeitos + um seletor de escopo (self/party). O motor genérico de formulário (`SheetForm`) ganha suporte a listas aninhadas. Um componente compartilhado de conjuração (`CastActionSheet`) calcula os efeitos combinados e, se aplicável, mostra um seletor de alvos (personagens do grupo). Aplicar em outro personagem passa por um novo endpoint de servidor restrito a "mesmo grupo", que grava direto no Mongo e notifica via WebSocket.

**Tech Stack:** React 19 + TypeScript (client), Express + Mongoose (server), sem framework de testes automatizados no projeto — verificação via `npx tsc -b` (typecheck) e teste manual no navegador (claude-in-chrome).

**Reference spec:** `docs/superpowers/specs/2026-08-16-multi-target-buffs-design.md`

---

## Task 1: Modelo de dados (tipos)

**Files:**
- Modify: `client/src/types/character.ts`

- [ ] **Step 1: Adicionar `BuffEffect`, reescrever `Buff`, estender `Enhancement`/`Spell`/`Ability`**

Abra `client/src/types/character.ts`. Localize a interface `Buff` (hoje):

```ts
export interface Buff {
  name: string;
  type: BuffType;
  attributeId?: AttributeId;
  skillId?: string;
  value: string;
  mp: number;
  active: boolean;
}
```

Substitua por:

```ts
export interface BuffEffect {
  type: BuffType;
  attributeId?: AttributeId;
  skillId?: string;
  value: string;
}

export interface Buff {
  name: string;
  effects: BuffEffect[];
  mp: number;
  active: boolean;
  /** Texto de exibição, ex. "de Fulano" — presente só em buffs aplicados por magia/poder. */
  source?: string;
}
```

Localize `Enhancement` (hoje):

```ts
export interface Enhancement {
  description: string;
  mpCost: number;
}
```

Substitua por:

```ts
export interface Enhancement {
  description: string;
  mpCost: number;
  buffs?: BuffEffect[];
}
```

Localize `Spell` (hoje):

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
}
```

Substitua por:

```ts
export type BuffTargetScope = 'self' | 'party';

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
}
```

Localize `Ability` (hoje):

```ts
export interface Ability {
  name: string;
  source: string;
  type: string;
  /** Redesign etiqueta: distinguishes a Poder from a Habilidade in the unified list. */
  kind?: AbilityKind;
  mpCost: number;
  description: string;
}
```

Substitua por:

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
}
```

- [ ] **Step 2: Typecheck (vai falhar em vários lugares — esperado)**

```bash
cd client && npx tsc -b --force
```

Esperado: FALHA, com erros em `calculations.ts`, `ConditionChip.tsx`, `entityForms.ts`,
`BuffsList.tsx` (todos referenciando `buff.type`/`buff.attributeId`/`buff.skillId`/
`buff.value`, que não existem mais). Essas quebras são corrigidas nas próximas tasks —
não corrija nada agora, só confirme que o erro é exatamente esse (referências a campos
removidos do `Buff`), não outra coisa.

- [ ] **Step 3: Commit**

```bash
git add client/src/types/character.ts
git commit -m "feat(buffs): support multi-effect buffs in data model"
```

---

## Task 2: `calculations.ts` — ler `effects[]`, normalização, aplicação direta

**Files:**
- Modify: `client/src/utils/calculations.ts`

- [ ] **Step 1: Reescrever as funções que leem buffs**

Em `client/src/utils/calculations.ts`, localize `getEffectiveAttribute` (hoje):

```ts
export function getEffectiveAttribute(character: Character, attr: AttributeId): number {
  let val = character.attributes[attr] || 0;
  if (character.buffs) {
    character.buffs.forEach((b) => {
      if (b.active && b.type === 'attribute' && b.attributeId === attr) {
        val += Number(b.value) || 0;
      }
    });
  }
  return val;
}
```

Substitua por:

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

Localize `calcTotalSkill`'s buff loop (hoje, dentro da função, perto do fim):

```ts
  let buffBonus = 0;
  if (character.buffs) {
    character.buffs.forEach((b) => {
      if (b.active && b.type === 'skill' && b.skillId === skillId) {
        buffBonus += Number(b.value) || 0;
      }
    });
  }
```

Substitua por:

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
```

Localize `calcTotalDefense` (hoje):

```ts
export function calcTotalDefense(character: Character): number {
  let total = character.defense.base || 10;
  if (character.defense.items) {
    character.defense.items.forEach((item) => {
      total += item.value || 0;
    });
  }
  if (character.buffs) {
    character.buffs.forEach((b) => {
      if (b.active && b.type === 'defense') total += Number(b.value) || 0;
    });
  }
  return total;
}
```

Substitua por:

```ts
export function calcTotalDefense(character: Character): number {
  let total = character.defense.base || 10;
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

Localize `getDefenseBreakdown`'s buffs mapping (hoje):

```ts
  const buffs: DefenseBreakdownRow[] = (character.buffs || [])
    .filter((b) => b.active && b.type === 'defense')
    .map((b) => ({ name: b.name || 'Buff', value: Number(b.value) || 0 }));
```

Substitua por:

```ts
  const buffs: DefenseBreakdownRow[] = (character.buffs || [])
    .filter((b) => b.active)
    .flatMap((b) => (b.effects || [])
      .filter((eff) => eff.type === 'defense')
      .map((eff) => ({ name: b.name || 'Buff', value: Number(eff.value) || 0 })));
```

Localize `calcAttackRoll` (hoje):

```ts
export function calcAttackRoll(character: Character, atk: Character['attacks'][number]): number {
  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  let total = calcTotalSkill(character, skillId);
  if (atk.extraBonuses) atk.extraBonuses.forEach((b) => { total += Number(b.value) || 0; });
  if (character.buffs) character.buffs.forEach((b) => {
    if (b.active && b.type === 'attack_roll') total += Number(b.value) || 0;
  });
  return total;
}
```

Substitua por:

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

Localize `calcDamageBonus` (hoje):

```ts
export function calcDamageBonus(character: Character, atk: Character['attacks'][number]): number {
  const attrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  let total = getEffectiveAttribute(character, attrKey);
  if (atk.extraDamage) atk.extraDamage.forEach((b) => { total += Number(b.value) || 0; });
  if (character.buffs) character.buffs.forEach((b) => {
    if (b.active && b.type === 'fixed_damage') total += Number(b.value) || 0;
  });
  return total;
}
```

Substitua por:

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

Localize a função `buildDamageSummary` inteira (hoje):

```ts
export function buildDamageSummary(character: Character, atk: Character['attacks'][number]): string {
  const parts: string[] = [];
  const damageDice = atk.damage || '';
  if (damageDice) parts.push(damageDice);

  const damageBonus = calcDamageBonus(character, atk);

  const extraDice: string[] = [];
  if (atk.extraDamage) atk.extraDamage.forEach((b) => {
    const v = String(b.value || '');
    if (v && isNaN(Number(v))) extraDice.push(v);
  });
  if (character.buffs) character.buffs.forEach((b) => {
    if (b.active && b.type === 'extra_damage') {
      const v = String(b.value || '');
      if (v) extraDice.push(v);
    }
  });
  extraDice.forEach((d) => parts.push(d));

  if (damageBonus !== 0 || parts.length === 0) {
    parts.push(damageBonus >= 0 && parts.length > 0 ? `+${damageBonus}` : formatMod(damageBonus));
  }

  return parts.join('+').replace(/\+\+/g, '+').replace(/\+-/g, '-');
}
```

Substitua por:

```ts
export function buildDamageSummary(character: Character, atk: Character['attacks'][number]): string {
  const parts: string[] = [];
  const damageDice = atk.damage || '';
  if (damageDice) parts.push(damageDice);

  const damageBonus = calcDamageBonus(character, atk);

  const extraDice: string[] = [];
  if (atk.extraDamage) atk.extraDamage.forEach((b) => {
    const v = String(b.value || '');
    if (v && isNaN(Number(v))) extraDice.push(v);
  });
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

  if (damageBonus !== 0 || parts.length === 0) {
    parts.push(damageBonus >= 0 && parts.length > 0 ? `+${damageBonus}` : formatMod(damageBonus));
  }

  return parts.join('+').replace(/\+\+/g, '+').replace(/\+-/g, '-');
}
```

- [ ] **Step 2: Reescrever `toggleBuffState` para efeitos múltiplos**

Localize `toggleBuffState` (hoje):

```ts
export function toggleBuffState(character: Character, idx: number): Character {
  const buffs = [...character.buffs];
  const b = { ...buffs[idx] };
  if (!b) return character;
  const wasActive = b.active;
  b.active = !wasActive;

  let mpCurrent = character.mp.current;
  let hpTemp = character.temporaryHp;
  let mpTemp = character.temporaryMp;
  const mpCost = Number(b.mp) || 0;
  const val = Number(b.value) || 0;

  if (!wasActive) {
    if (mpCost > 0) mpCurrent = Math.max(0, mpCurrent - mpCost);
    if (b.type === 'hp') hpTemp += val;
    if (b.type === 'mp') mpTemp += val;
  } else {
    if (b.type === 'hp') hpTemp = Math.max(0, hpTemp - val);
    if (b.type === 'mp') mpTemp = Math.max(0, mpTemp - val);
  }

  buffs[idx] = b;
  return {
    ...character,
    buffs,
    mp: { ...character.mp, current: mpCurrent },
    temporaryHp: hpTemp,
    temporaryMp: mpTemp,
  };
}
```

Substitua por:

```ts
export function toggleBuffState(character: Character, idx: number): Character {
  const buffs = [...character.buffs];
  const b = { ...buffs[idx] };
  if (!b) return character;
  const wasActive = b.active;
  b.active = !wasActive;

  let mpCurrent = character.mp.current;
  let hpTemp = character.temporaryHp;
  let mpTemp = character.temporaryMp;
  const mpCost = Number(b.mp) || 0;
  const sign = wasActive ? -1 : 1;

  if (!wasActive && mpCost > 0) mpCurrent = Math.max(0, mpCurrent - mpCost);

  (b.effects || []).forEach((eff) => {
    const val = Number(eff.value) || 0;
    if (eff.type === 'hp') hpTemp = Math.max(0, hpTemp + sign * val);
    if (eff.type === 'mp') mpTemp = Math.max(0, mpTemp + sign * val);
  });

  buffs[idx] = b;
  return {
    ...character,
    buffs,
    mp: { ...character.mp, current: mpCurrent },
    temporaryHp: hpTemp,
    temporaryMp: mpTemp,
  };
}
```

- [ ] **Step 3: Adicionar `normalizeBuffs` e `applyBuffToCharacter`**

No fim de `client/src/utils/calculations.ts`, adicione:

```ts
/**
 * Converte buffs no formato antigo (type/attributeId/skillId/value soltos no buff,
 * sem `effects`) para o formato novo. Personagens salvos antes desta mudança não têm
 * `effects` — sem isso, os cálculos acima (que só leem `effects`) os ignorariam
 * silenciosamente.
 */
export function normalizeBuffs(buffs: unknown[]): Buff[] {
  return (buffs || []).map((raw) => {
    const b = raw as Record<string, unknown>;
    if (Array.isArray(b.effects)) return b as unknown as Buff;
    const legacy = b as { type?: BuffType; attributeId?: AttributeId; skillId?: string; value?: string };
    const effects: BuffEffect[] = legacy.type
      ? [{ type: legacy.type, attributeId: legacy.attributeId, skillId: legacy.skillId, value: String(legacy.value ?? '') }]
      : [];
    return {
      name: String(b.name ?? ''),
      effects,
      mp: Number(b.mp) || 0,
      active: Boolean(b.active),
      source: typeof b.source === 'string' ? b.source : undefined,
    };
  });
}

/**
 * Aplica um buff já ativo num personagem: adiciona à lista de buffs e soma os
 * deltas de PV/PM temporário dos efeitos do tipo hp/mp (mesma soma que
 * toggleBuffState faria ao ativar, mas sem custo de PM — o custo já foi pago na
 * conjuração). Usado tanto para o próprio conjurador (auto-aplicação local) quanto
 * ao receber a notificação em tempo real de um buff aplicado por outro jogador.
 */
export function applyBuffToCharacter(character: Character, buff: Buff): Character {
  let hpTemp = character.temporaryHp;
  let mpTemp = character.temporaryMp;
  buff.effects.forEach((eff) => {
    const val = Number(eff.value) || 0;
    if (eff.type === 'hp') hpTemp += val;
    if (eff.type === 'mp') mpTemp += val;
  });
  return {
    ...character,
    buffs: [...character.buffs, buff],
    temporaryHp: hpTemp,
    temporaryMp: mpTemp,
  };
}
```

- [ ] **Step 4: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: os erros de `calculations.ts` somem. Ainda deve falhar em
`ConditionChip.tsx`, `entityForms.ts`, `BuffsList.tsx` (próximas tasks).

- [ ] **Step 5: Commit**

```bash
git add client/src/utils/calculations.ts
git commit -m "feat(buffs): read effects[] in calculations, add normalize + apply helpers"
```

---

## Task 3: Normalização ao carregar personagem

**Files:**
- Modify: `client/src/contexts/CharacterContext.tsx`

- [ ] **Step 1: Normalizar buffs em `loadCharacter` e `setCharacterDirect`**

Em `client/src/contexts/CharacterContext.tsx`, adicione o import:

```ts
import { createEmptyCharacter, normalizeBuffs } from '../utils/calculations';
```

(substitua a linha existente `import { createEmptyCharacter } from '../utils/calculations';`)

Localize `loadCharacter` (hoje):

```ts
  const loadCharacter = useCallback(async (id: string) => {
    const data = await apiLoadCharacter(id);
    if (data) {
      setCharacter(data);
      setCharacterOriginalId(data._id);
```

Substitua por:

```ts
  const loadCharacter = useCallback(async (id: string) => {
    const data = await apiLoadCharacter(id);
    if (data) {
      const normalized = { ...data, buffs: normalizeBuffs(data.buffs) };
      setCharacter(normalized);
      setCharacterOriginalId(data._id);
```

(a linha seguinte, `lastBroadcastRef.current = { hp: {...data.hp}, ... }`, continua
igual — ainda usa `data`, não precisa mudar.)

Localize `setCharacterDirect` (hoje):

```ts
  const setCharacterDirect = useCallback((char: Character) => {
    setCharacter(char);
    setCharacterOriginalId(char._id);
  }, []);
```

Substitua por:

```ts
  const setCharacterDirect = useCallback((char: Character) => {
    setCharacter({ ...char, buffs: normalizeBuffs(char.buffs) });
    setCharacterOriginalId(char._id);
  }, []);
```

- [ ] **Step 2: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: sem novos erros nesse arquivo.

- [ ] **Step 3: Commit**

```bash
git add client/src/contexts/CharacterContext.tsx
git commit -m "feat(buffs): normalize legacy buff shape on character load"
```

---

## Task 4: `ConditionChip` — exibir efeitos múltiplos e origem

**Files:**
- Modify: `client/src/components/sheet/ConditionChip/ConditionChip.tsx`

- [ ] **Step 1: Reescrever `inferVariant`/`buildLabel`**

Substitua o conteúdo de `client/src/components/sheet/ConditionChip/ConditionChip.tsx`
inteiro por:

```tsx
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { toggleBuffState } from '../../../utils/calculations';
import type { Buff } from '../../../types/character';
import Chip from '../../ui/Chip/Chip';

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

function formatEffectValue(raw: string): string | null {
  const trimmed = (raw ?? '').toString().trim();
  if (!trimmed || trimmed === '0') return null;
  return /^[+-]/.test(trimmed) ? trimmed : `+${trimmed}`;
}

function buildLabel(buff: Buff): string {
  const values = (buff.effects || [])
    .map((eff) => formatEffectValue(eff.value))
    .filter((v): v is string => v != null);
  const summary = values.length > 0 ? ` ${values.join('/')}` : '';
  const sourceSuffix = buff.source ? ` (${buff.source})` : '';
  return `${buff.name}${summary}${sourceSuffix}`;
}

function ConditionChip({ buff, index }: ConditionChipProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();

  if (!character) return null;

  const handleToggle = () => updateCharacter((f) => toggleBuffState(f, index));

  return (
    <Chip
      label={buildLabel(buff)}
      active={buff.active}
      variant={inferVariant(buff)}
      onToggle={readOnly ? undefined : handleToggle}
    />
  );
}

ConditionChip.displayName = 'ConditionChip';

export default ConditionChip;
```

- [ ] **Step 2: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: erros restantes só em `entityForms.ts` e `BuffsList.tsx`.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/sheet/ConditionChip/ConditionChip.tsx
git commit -m "feat(buffs): show multi-effect summary and source on condition chip"
```

---

## Task 5: Componente legado `BuffsList.tsx` (visão do mestre)

**Files:**
- Modify: `client/src/components/character/BuffsList/BuffsList.tsx`

Esse componente só é usado por `ViewCharacterPage` (visão somente-leitura de outro
personagem do grupo). A edição já não tem efeito lá (o contexto é `readOnly`, então
`updateCharacter` vira no-op), mas o componente precisa continuar exibindo os buffs
corretamente em vez de campos em branco.

- [ ] **Step 1: Reescrever para iterar `effects`**

Substitua o conteúdo de
`client/src/components/character/BuffsList/BuffsList.tsx` inteiro por:

```tsx
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Section from '../../ui/Section/Section';
import Button from '../../ui/Button/Button';
import { toggleBuffState } from '../../../utils/calculations';
import { BUFF_TYPES } from '../../../data/constants';
import { SKILLS_CONFIG } from '../../../data/pericias';
import { ATTRIBUTE_LABELS } from '../../../data/atributos';
import type { Buff, BuffEffect, BuffType, AttributeId } from '../../../types/character';
import NumericInput from '../../ui/NumericInput/NumericInput';
import ConfirmModal from '../../ui/ConfirmModal/ConfirmModal';
import styles from './BuffsList.module.css';

export default function BuffsList() {
  const { character, updateCharacter } = useCharacterContext();
  const [removeIdx, setRemoveIdx] = useState<number | null>(null);

  if (!character) return null;

  const updateBuff = (idx: number, updates: Partial<Buff>) => {
    updateCharacter((f) => {
      const buffs = [...f.buffs];
      buffs[idx] = { ...buffs[idx], ...updates };
      return { ...f, buffs };
    });
  };

  const updateEffect = (idx: number, effIdx: number, updates: Partial<BuffEffect>) => {
    updateCharacter((f) => {
      const buffs = [...f.buffs];
      const effects = [...(buffs[idx].effects || [])];
      effects[effIdx] = { ...effects[effIdx], ...updates };
      buffs[idx] = { ...buffs[idx], effects };
      return { ...f, buffs };
    });
  };

  const addBuff = () => {
    updateCharacter((f) => ({
      ...f,
      buffs: [
        ...f.buffs,
        { name: '', effects: [{ type: 'attack_roll' as BuffType, value: '' }], mp: 0, active: false },
      ],
    }));
  };

  const removeBuff = (idx: number) => {
    updateCharacter((f) => ({ ...f, buffs: f.buffs.filter((_, i) => i !== idx) }));
  };

  const toggleBuff = (idx: number) => {
    updateCharacter((f) => toggleBuffState(f, idx));
  };

  const buffToRemove = removeIdx != null ? character.buffs[removeIdx] : null;

  return (
    <Section id="secBuffs" title="Buffs">
      {character.buffs.map((buff, idx) => (
        <div
          key={idx}
          className={[styles.card, buff.active && styles.active].filter(Boolean).join(' ')}
        >
          <input
            className={styles.name}
            value={buff.name}
            onChange={(e) => updateBuff(idx, { name: e.target.value })}
            placeholder="Nome"
          />
          {(buff.effects || []).map((eff, effIdx) => (
            <div key={effIdx} className={styles.effectRow}>
              <select
                className={styles.tipoSel}
                value={eff.type}
                onChange={(e) => updateEffect(idx, effIdx, { type: e.target.value as BuffType })}
              >
                {Object.entries(BUFF_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {eff.type === 'skill' && (
                <select
                  className={styles.extraSel}
                  value={eff.skillId || ''}
                  onChange={(e) => updateEffect(idx, effIdx, { skillId: e.target.value })}
                >
                  <option value="">-</option>
                  {SKILLS_CONFIG.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              {eff.type === 'attribute' && (
                <select
                  className={styles.extraSel}
                  value={eff.attributeId || ''}
                  onChange={(e) => updateEffect(idx, effIdx, { attributeId: e.target.value as AttributeId })}
                >
                  <option value="">-</option>
                  {(Object.entries(ATTRIBUTE_LABELS) as [AttributeId, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              )}
              <input
                className={styles.valor}
                value={eff.value}
                onChange={(e) => updateEffect(idx, effIdx, { value: e.target.value })}
                placeholder="Valor"
              />
            </div>
          ))}
          <div className={styles.pmField}>
            <span className={styles.pmLabel}>PM</span>
            <NumericInput
              className={styles.pmInput}
              value={buff.mp}
              onChange={(n) => updateBuff(idx, { mp: n })}
            />
          </div>
          <button
            className={[styles.toggle, buff.active && styles.toggleOn].filter(Boolean).join(' ')}
            onClick={() => toggleBuff(idx)}
            aria-label={buff.active ? 'Desativar buff' : 'Ativar buff'}
          >
            <span aria-hidden="true">●</span>
          </button>
          <button className={styles.removeSm} onClick={() => setRemoveIdx(idx)} aria-label="Remover buff">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <Button variant="add" onClick={addBuff}>+ Buff</Button>

      <ConfirmModal
        open={removeIdx != null}
        onClose={() => setRemoveIdx(null)}
        onConfirm={() => {
          if (removeIdx != null) removeBuff(removeIdx);
        }}
        title="Remover buff?"
        message={`Isso apaga "${buffToRemove?.name || 'Buff'}" da ficha.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </Section>
  );
}
```

- [ ] **Step 2: Adicionar CSS de `.effectRow` (reaproveita as classes existentes)**

Abra `client/src/components/character/BuffsList/BuffsList.module.css` e adicione, se
não houver algo equivalente:

```css
.effectRow {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}
```

- [ ] **Step 3: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: erros restantes só em `entityForms.ts`.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/character/BuffsList/
git commit -m "feat(buffs): render multi-effect buffs in legacy read-only view"
```

---

## Task 6: Motor de formulário — listas aninhadas + `showIf` por linha

**Files:**
- Modify: `client/src/components/sheet/SheetForm/SheetForm.tsx`

- [ ] **Step 1: Ampliar os tipos de valor de lista para aceitar sub-listas**

Localize, no topo de `SheetForm.tsx`:

```ts
export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'list';
export type ScalarValue = string | number;
export type ListValue = Array<Record<string, ScalarValue>>;
export type FieldValue = ScalarValue | ListValue;
export type FormValues = Record<string, FieldValue>;
```

Substitua por:

```ts
export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'list';
export type ScalarValue = string | number;
export interface ListRow {
  [key: string]: ScalarValue | ListValue;
}
export type ListValue = ListRow[];
export type FieldValue = ScalarValue | ListValue;
export type FormValues = Record<string, FieldValue>;
```

- [ ] **Step 2: Extrair `renderListField` para um componente recursivo `ListField`**

Localize a função `renderListField` inteira dentro de `SheetForm` (do
`const renderListField = (f: FieldDescriptor) => {` até o `};` que a fecha, logo antes
do `return (` do componente principal). Substitua **essa função inteira** por:

```tsx
  const renderListField = (f: FieldDescriptor) => (
    <ListField
      key={f.key}
      field={f}
      items={(Array.isArray(values[f.key]) ? values[f.key] : []) as ListValue}
      onChange={(next) => setValue(f.key, next)}
    />
  );
```

Depois, **fora** e **acima** da função `SheetForm` (junto com `ScalarField`, no topo do
arquivo), adicione o novo componente recursivo:

```tsx
interface ListFieldProps {
  field: FieldDescriptor;
  items: ListValue;
  onChange: (items: ListValue) => void;
}

/** Editor de lista genérico e recursivo — um sub-campo pode ele mesmo ser `type: 'list'`. */
function ListField({ field, items, onChange }: ListFieldProps) {
  const subFields = field.itemFields ?? [];

  const blankRow = (): ListRow => {
    const blank: ListRow = {};
    subFields.forEach((sf) => {
      blank[sf.key] = sf.type === 'list' ? [] : sf.type === 'number' ? 0 : '';
    });
    return blank;
  };

  const addRow = () => onChange([...items, blankRow()]);
  const updateRow = (i: number, key: string, v: ScalarValue | ListValue) => {
    onChange(items.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));
  };
  const removeRow = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className={styles.full}>
      <div className={styles.listHead}>
        <span className={styles.listLabel}>{field.label}</span>
        <button type="button" className={styles.listAdd} onClick={addRow}>
          + {field.addLabel ?? 'Adicionar'}
        </button>
      </div>
      {items.length === 0 ? (
        <p className={styles.listEmpty}>Nenhum item.</p>
      ) : (
        items.map((row, i) => {
          const rowValues = row as FormValues;
          const visible = subFields.filter((sf) => !sf.showIf || sf.showIf(rowValues));
          const inlineFields = visible.filter((sf) => sf.type !== 'textarea' && sf.type !== 'list');
          const blockFields = visible.filter((sf) => sf.type === 'textarea');
          const listFields = visible.filter((sf) => sf.type === 'list');
          return (
            <div key={i} className={styles.listItem}>
              <div className={styles.listRow}>
                {inlineFields.map((sf) => (
                  <div key={sf.key} className={styles.listCell}>
                    <ScalarField
                      field={sf}
                      value={(row[sf.key] as ScalarValue) ?? (sf.type === 'number' ? 0 : '')}
                      onChange={(v) => updateRow(i, sf.key, v)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.listRemove}
                  onClick={() => removeRow(i)}
                  aria-label="Remover"
                >
                  ×
                </button>
              </div>
              {blockFields.map((sf) => (
                <Textarea
                  key={sf.key}
                  label={sf.label}
                  placeholder={sf.placeholder}
                  value={String(row[sf.key] ?? '')}
                  onChange={(v) => updateRow(i, sf.key, v)}
                  compact
                />
              ))}
              {listFields.map((sf) => (
                <ListField
                  key={sf.key}
                  field={sf}
                  items={(Array.isArray(row[sf.key]) ? (row[sf.key] as ListValue) : [])}
                  onChange={(next) => updateRow(i, sf.key, next)}
                />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: sem erros novos neste arquivo (os erros restantes continuam só em
`entityForms.ts`, que ainda usa o `Buff` no formato antigo).

- [ ] **Step 4: Commit**

```bash
git add client/src/components/sheet/SheetForm/SheetForm.tsx
git commit -m "feat(sheetform): support nested list fields and per-row showIf"
```

---

## Task 7: Campo de efeitos reutilizável + formulário de Buff manual

**Files:**
- Modify: `client/src/components/sheet/SheetForm/entityForms.ts`

- [ ] **Step 1: Adicionar `BUFF_EFFECT_ITEM_FIELDS` (reutilizado por buff manual, magia e poder)**

Abra `client/src/components/sheet/SheetForm/entityForms.ts`. Logo depois da linha:

```ts
const buffTypeOptions = Object.entries(BUFF_TYPES).map(([value, label]) => ({ value, label }));
```

adicione:

```ts
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
```

- [ ] **Step 2: Reescrever `buffConfig`**

Localize o bloco inteiro (da seção `/* ─────────────────────────────── Buff ──────────────────────────────────── */`
até o fechamento de `buffConfig`, hoje):

```ts
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
```

Substitua por:

```ts
/* ─────────────────────────────── Buff ──────────────────────────────────── */

const buffFields: FieldDescriptor[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do buff/condição' },
  { key: 'mp', label: 'Custo (PM)', type: 'number', half: true },
  {
    key: 'effects', label: 'Efeitos', type: 'list', addLabel: 'Efeito',
    itemFields: BUFF_EFFECT_ITEM_FIELDS,
  },
];

function effectsFromValues(raw: unknown): { type: string; attributeId?: string; skillId?: string; value: string }[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((row) => ({
    type: s(row.type) || 'attack_roll',
    attributeId: row.type === 'attribute' ? (s(row.attributeId) || 'str') : undefined,
    skillId: row.type === 'skill' ? s(row.skillId) : undefined,
    value: s(row.value),
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
      effects: (b.effects || []).map((eff) => ({
        type: eff.type, attributeId: eff.attributeId ?? 'str', skillId: eff.skillId ?? '', value: eff.value,
      })),
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
```

Repare que `BuffType`/`AttributeId` deixam de ser usados neste bloco — se o import no
topo do arquivo (`import type { Character, AttributeId, BuffType, AbilityKind,
InventoryCategory } from '../../../types/character';`) ficar com `AttributeId`/
`BuffType` não usados em outro lugar do arquivo, o TypeScript vai reclamar de import
não utilizado — **não remova o import ainda**, as próximas tasks (7 e 8) voltam a usar
esses tipos no formulário de magia/poder.

- [ ] **Step 3: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: erros restantes só nas partes de `entityForms.ts` referentes a `magiaConfig`
e `abilidadeConfig` (que ainda não usam `buffs`/`buffTargetScope` — isso é esperado,
essas partes não quebram porque `Spell.buffs`/`Ability.buffs` são opcionais; o typecheck
deve passar limpo neste ponto). Se passar limpo, ótimo — siga.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/sheet/SheetForm/entityForms.ts
git commit -m "feat(buffs): rewrite manual buff form for multi-effect list"
```

---

## Task 8: Buffs na Magia (base + aprimoramentos)

**Files:**
- Modify: `client/src/components/sheet/SheetForm/entityForms.ts`

- [ ] **Step 1: Adicionar campos de buff na magia**

Localize `spellFields` (hoje):

```ts
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
  {
    key: 'enhancements', label: 'Aprimoramentos', type: 'list', addLabel: 'Aprimoramento',
    itemFields: [
      { key: 'mpCost', label: 'PM extra', type: 'number' },
      { key: 'description', label: 'Efeito', type: 'textarea', placeholder: 'Ex.: +1d6 de dano' },
    ],
  },
];
```

Substitua por (`buffTargetScopeOptions` já foi definido na Task 7 — não redeclare aqui):

```ts
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
```

- [ ] **Step 2: Atualizar `magiaConfig` para ler/gravar os novos campos**

Localize `magiaConfig` (hoje):

```ts
const magiaConfig: EntityConfig = {
  title: 'Magia',
  fields: spellFields,
  empty: () => ({
    name: '', school: '', spellLevel: 1, mpCost: 1, castingTime: '', range: '',
    area: '', duration: '', resistance: '', description: '', enhancements: [],
  }),
  fromEntry: (c, i) => {
    const sp = c.spells[i];
    return {
      name: sp.name, school: sp.school, spellLevel: sp.spellLevel, mpCost: sp.mpCost,
      castingTime: sp.castingTime, range: sp.range, area: sp.area, duration: sp.duration,
      resistance: sp.resistance, description: sp.description,
      enhancements: (sp.enhancements ?? []).map((e) => ({ mpCost: e.mpCost, description: e.description })),
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
      enhancements: rawEnhancements.map((e) => ({ mpCost: n(e.mpCost), description: s(e.description) })),
    } as Character['spells'][number];
    return { ...c, spells: upsert(c.spells, entry, i) };
  },
  remove: (c, i) => ({ ...c, spells: c.spells.filter((_, idx) => idx !== i) }),
};
```

Substitua por:

```ts
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
      buffs: (sp.buffs ?? []).map((eff) => ({
        type: eff.type, attributeId: eff.attributeId ?? 'str', skillId: eff.skillId ?? '', value: eff.value,
      })),
      enhancements: (sp.enhancements ?? []).map((e) => ({
        mpCost: e.mpCost,
        description: e.description,
        buffs: (e.buffs ?? []).map((eff) => ({
          type: eff.type, attributeId: eff.attributeId ?? 'str', skillId: eff.skillId ?? '', value: eff.value,
        })),
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
```

Note que `effectsFromValues` (criado na Task 7) devolve objetos com `type` tipado como
`string`, mas `Character['spells'][number]['buffs']` espera `BuffEffect[]` (com `type:
BuffType`). Como `apply` já faz `as Character['spells'][number]` no `entry` inteiro, o
TypeScript aceita — é o mesmo padrão já usado pelos outros `apply()` deste arquivo
(ex.: `ataqueConfig`).

- [ ] **Step 3: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: limpo (ou erros restantes só em `abilidadeConfig`, tratado na próxima task).

- [ ] **Step 4: Commit**

```bash
git add client/src/components/sheet/SheetForm/entityForms.ts
git commit -m "feat(buffs): add buff effects + target scope to spell base and enhancements"
```

---

## Task 9: Buffs no Poder/Habilidade + checkbox "Conjurável"

**Files:**
- Modify: `client/src/components/sheet/SheetForm/entityForms.ts`

- [ ] **Step 1: Adicionar campos ao formulário de Poder/Habilidade**

Localize `abilityFields` (hoje):

```ts
const abilityFields: FieldDescriptor[] = [
  { key: 'kind', label: 'Tipo', type: 'select', options: kindOptions, half: true },
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome', half: true },
  { key: 'source', label: 'Fonte', type: 'text', placeholder: 'Classe, raça, origem…', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
  { key: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Efeito / regras' },
];
```

Substitua por:

```ts
const castableOptions = [
  { value: 'false', label: 'Não' },
  { value: 'true', label: 'Sim' },
];

const abilityFields: FieldDescriptor[] = [
  { key: 'kind', label: 'Tipo', type: 'select', options: kindOptions, half: true },
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome', half: true },
  { key: 'source', label: 'Fonte', type: 'text', placeholder: 'Classe, raça, origem…', half: true },
  { key: 'mpCost', label: 'Custo (PM)', type: 'number', half: true },
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
];
```

- [ ] **Step 2: Atualizar `abilidadeConfig`**

Localize `abilidadeConfig` (hoje):

```ts
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
```

Substitua por:

```ts
const abilidadeConfig: EntityConfig = {
  title: 'Poder / Habilidade',
  fields: abilityFields,
  empty: () => ({
    kind: 'Poder', name: '', source: '', mpCost: 0, description: '',
    castable: 'false', buffTargetScope: 'self', buffs: [],
  }),
  fromEntry: (c, i) => {
    const a = c.abilities[i];
    return {
      kind: a.kind ?? 'Poder', name: a.name, source: a.source, mpCost: a.mpCost, description: a.description,
      castable: a.castable ? 'true' : 'false',
      buffTargetScope: a.buffTargetScope ?? 'self',
      buffs: (a.buffs ?? []).map((eff) => ({
        type: eff.type, attributeId: eff.attributeId ?? 'str', skillId: eff.skillId ?? '', value: eff.value,
      })),
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
      description: s(v.description),
      castable: s(v.castable) === 'true',
      buffTargetScope: s(v.buffTargetScope) || 'self',
      buffs: effectsFromValues(v.buffs),
    };
    return { ...c, abilities: upsert(c.abilities, entry, i) };
  },
  remove: (c, i) => ({ ...c, abilities: c.abilities.filter((_, idx) => idx !== i) }),
};
```

- [ ] **Step 3: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: limpo, sem erros em todo o projeto client.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/sheet/SheetForm/entityForms.ts
git commit -m "feat(buffs): add castable flag + buff effects to abilities"
```

---

## Task 10: Cliente de API para aplicar buff em grupo

**Files:**
- Modify: `client/src/api/parties.ts`

- [ ] **Step 1: Adicionar `apiApplyBuffToParty`**

No fim de `client/src/api/parties.ts`, adicione o import necessário no topo do arquivo:

```ts
import type { BuffEffect } from '../types/character';
```

E, no fim do arquivo, adicione:

```ts
export interface ApplyBuffPayload {
  targetCharacterIds: string[];
  buff: {
    name: string;
    effects: BuffEffect[];
    source: string;
  };
}

export async function apiApplyBuffToParty(partyId: string, payload: ApplyBuffPayload): Promise<void> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/apply-buff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await assertOk(res);
}
```

- [ ] **Step 2: Reexportar em `client/src/api/index.ts`**

Abra `client/src/api/index.ts`. Localize o bloco:

```ts
export {
  apiFetchParties,
  apiCreateParty,
  apiUpdateParty,
  apiDeleteParty,
  apiJoinParty,
  apiAddCharacterToParty,
  apiRemoveCharacterFromParty,
  apiLeaveParty,
  apiRemovePartyMember,
  apiRegenerateInviteCode,
  apiFetchPartyCharacters,
  apiLoadPartyCharacter,
  apiLoadCombat,
  apiSaveCombat,
} from './parties';
```

Substitua por:

```ts
export {
  apiFetchParties,
  apiCreateParty,
  apiUpdateParty,
  apiDeleteParty,
  apiJoinParty,
  apiAddCharacterToParty,
  apiRemoveCharacterFromParty,
  apiLeaveParty,
  apiRemovePartyMember,
  apiRegenerateInviteCode,
  apiFetchPartyCharacters,
  apiLoadPartyCharacter,
  apiLoadCombat,
  apiSaveCombat,
  apiApplyBuffToParty,
} from './parties';
export type { PartyCharacter, ApplyBuffPayload } from './parties';
```

(`PartyCharacter` não estava reexportado antes — passa a ficar disponível para o
`CastActionSheet`, criado na Task 13.)

- [ ] **Step 3: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: limpo.

- [ ] **Step 4: Commit**

```bash
git add client/src/api/parties.ts client/src/api/index.ts
git commit -m "feat(buffs): add client API to apply a buff to party members"
```

---

## Task 11: Servidor — endpoint `apply-buff` + broadcast WS

**Files:**
- Modify: `server/db/models/Party.js` (nenhuma mudança de schema — só referência)
- Modify: `server/src/repositories/character.repository.js`
- Modify: `server/src/services/party.service.js`
- Modify: `server/src/controllers/party.controller.js`
- Modify: `server/src/routes/parties.routes.js`
- Modify: `server/websocket.js`
- Modify: `server/index.js`

- [ ] **Step 1: Repositório — `pushBuffs`**

Em `server/src/repositories/character.repository.js`, adicione a função (antes do
`module.exports`):

```js
async function pushBuffs(id, buffs, tempDelta) {
  const update = { $push: { buffs: { $each: buffs } } };
  if (tempDelta.hp || tempDelta.mp) {
    update.$inc = {};
    if (tempDelta.hp) update.$inc.temporaryHp = tempDelta.hp;
    if (tempDelta.mp) update.$inc.temporaryMp = tempDelta.mp;
  }
  return Character.findByIdAndUpdate(id, update, { new: true }).select('_id').lean();
}
```

Localize o `module.exports` no fim do arquivo (hoje):

```js
module.exports = {
  findIdsByOwner,
  findSummaryByOwner,
  findOwnedById,
  findOwnedAvatarDataById,
  findOwnerById,
  countByOwner,
  upsertById,
  updateAvatar,
  findOwnedJutsuImageData,
  updateJutsuImage,
  softDeleteOwnedById,
  restoreOwnedById,
  hardDeleteById,
  findExpiredSoftDeletes,
  findByIds,
  findOwnedCharacterById,
  findActiveById,
};
```

Substitua por:

```js
module.exports = {
  findIdsByOwner,
  findSummaryByOwner,
  findOwnedById,
  findOwnedAvatarDataById,
  findOwnerById,
  countByOwner,
  upsertById,
  updateAvatar,
  findOwnedJutsuImageData,
  updateJutsuImage,
  softDeleteOwnedById,
  restoreOwnedById,
  hardDeleteById,
  findExpiredSoftDeletes,
  findByIds,
  findOwnedCharacterById,
  findActiveById,
  pushBuffs,
};
```

- [ ] **Step 2: Serviço — `applyBuff`**

Em `server/src/services/party.service.js`, adicione a função dentro de
`createPartyService(refs)` (antes do `return { ... }` final):

```js
  function sumEffectsByType(effects, type) {
    return (effects || [])
      .filter((eff) => eff && eff.type === type)
      .reduce((sum, eff) => sum + (Number(eff.value) || 0), 0);
  }

  async function applyBuff(partyId, body, uid) {
    const { targetCharacterIds, buff } = body || {};
    if (!Array.isArray(targetCharacterIds) || targetCharacterIds.length === 0) {
      throw new AppError(400, 'targetCharacterIds é obrigatório');
    }
    if (!buff || typeof buff !== 'object' || !Array.isArray(buff.effects)) {
      throw new AppError(400, 'buff inválido');
    }

    const party = await partyRepository.findMemberPartyLean(partyId, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

    const validIds = new Set(party.members.flatMap((m) => m.characterIds || []));
    const targets = targetCharacterIds.filter((id) => validIds.has(id));
    if (targets.length === 0) throw new AppError(400, 'Nenhum alvo válido neste grupo');

    const entry = {
      name: String(buff.name || ''),
      effects: buff.effects.map((eff) => ({
        type: String(eff.type || ''),
        attributeId: eff.attributeId ? String(eff.attributeId) : undefined,
        skillId: eff.skillId ? String(eff.skillId) : undefined,
        value: String(eff.value ?? ''),
      })),
      mp: 0,
      active: true,
      source: buff.source ? String(buff.source) : undefined,
    };

    const tempDelta = {
      hp: sumEffectsByType(entry.effects, 'hp'),
      mp: sumEffectsByType(entry.effects, 'mp'),
    };

    await Promise.all(targets.map((id) => characterRepository.pushBuffs(id, [entry], tempDelta)));

    targets.forEach((characterId) => {
      refs.broadcastBuffApplied(partyId, { characterId, buff: entry });
    });

    return { ok: true, appliedTo: targets };
  }
```

Localize o `return { ... }` no fim de `createPartyService` (hoje):

```js
  return {
    listParties,
    createParty,
    updateParty,
    deleteParty,
    joinParty,
    addCharacterToParty,
    removeCharacterFromParty,
    leaveParty,
    removeMember,
    regenerateCode,
    listPartyCharacters,
    getPartyCharacter,
  };
```

Substitua por:

```js
  return {
    listParties,
    createParty,
    updateParty,
    deleteParty,
    joinParty,
    addCharacterToParty,
    removeCharacterFromParty,
    leaveParty,
    removeMember,
    regenerateCode,
    listPartyCharacters,
    getPartyCharacter,
    applyBuff,
  };
```

- [ ] **Step 3: Controller**

Em `server/src/controllers/party.controller.js`, adicione, dentro do objeto retornado
por `createPartyController`:

```js
    async applyBuff(req, res) {
      res.json(await partyService.applyBuff(req.params.id, req.body, req.user.uid));
    },
```

- [ ] **Step 4: Rota**

Em `server/src/routes/parties.routes.js`, adicione a linha (junto com as outras rotas
de `:id`):

```js
  router.post('/api/parties/:id/apply-buff', asyncHandler(partyController.applyBuff));
```

- [ ] **Step 5: WebSocket — broadcast**

Em `server/websocket.js`, localize a função `broadcastPartyRoster` (dentro de
`attachWebSocket`):

```js
  refs.broadcastPartyRoster = function broadcastPartyRoster(partyId) {
    const msg = JSON.stringify({ type: 'party_roster_sync', partyId });
    wss.clients.forEach((client) => {
      if (client.readyState === 1 && client.partyIds?.has(partyId)) {
        client.send(msg);
      }
    });
  };
```

Logo abaixo, adicione:

```js
  refs.broadcastBuffApplied = function broadcastBuffApplied(partyId, payload) {
    const msg = JSON.stringify({ type: 'buff_applied', partyId, ...payload });
    wss.clients.forEach((client) => {
      if (client.readyState === 1 && client.partyIds?.has(partyId)) {
        client.send(msg);
      }
    });
  };
```

- [ ] **Step 6: Registrar o stub em `server/index.js`**

Em `server/index.js`, localize:

```js
  const refs = {
    broadcastCombat() {
      /* filled by attachWebSocket */
    },
    broadcastPartyRoster() {
      /* filled by attachWebSocket */
    },
  };
```

Substitua por:

```js
  const refs = {
    broadcastCombat() {
      /* filled by attachWebSocket */
    },
    broadcastPartyRoster() {
      /* filled by attachWebSocket */
    },
    broadcastBuffApplied() {
      /* filled by attachWebSocket */
    },
  };
```

- [ ] **Step 7: Testar o endpoint manualmente**

Servidor não tem suíte de testes automatizada — verificar rodando o servidor de dev
(`npm run dev` na raiz do projeto, se ainda não estiver rodando) e checando que ele
sobe sem erro:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3001/health
```

Esperado: `HTTP 200`. O teste funcional completo do endpoint (com autenticação real)
acontece na Task 15, via navegador.

- [ ] **Step 8: Commit**

```bash
git add server/src/repositories/character.repository.js server/src/services/party.service.js server/src/controllers/party.controller.js server/src/routes/parties.routes.js server/websocket.js server/index.js
git commit -m "feat(buffs): add apply-buff endpoint scoped to shared party membership"
```

---

## Task 12: Notificação em tempo real no `CharacterContext`

**Files:**
- Modify: `client/src/contexts/CharacterContext.tsx`

- [ ] **Step 1: Tratar a mensagem `buff_applied`**

Adicione o import (junto aos demais de `utils/calculations`):

```ts
import { createEmptyCharacter, normalizeBuffs, applyBuffToCharacter } from '../utils/calculations';
```

Localize, dentro do callback passado a `useWebSocket`, o bloco do
`character_spell_cast_sync` (hoje, é o último `if` antes do fechamento do callback):

```ts
    if (msg.type === 'character_spell_cast_sync' && msg.characterId === characterRef.current._id) {
      const spellName = (msg.spellName as string) || 'Jutsu';
      const mpCost = Number(msg.mpCost) || 0;
      const casterName = (msg.name as string) || characterRef.current.name;
      showToast?.(`${casterName} usou ${spellName}!`, 'attack', mpCost);
    }
  });
```

Adicione, logo antes do `});` que fecha o callback:

```ts
    if (msg.type === 'buff_applied' && msg.characterId === characterRef.current._id) {
      const buff = msg.buff as Character['buffs'][number];
      setCharacter((prev) => (prev ? applyBuffToCharacter(prev, buff) : prev));
      showToast?.(`Você recebeu o buff "${buff.name}"${buff.source ? ` ${buff.source}` : ''}!`, 'info');
    }
  });
```

- [ ] **Step 2: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: limpo.

- [ ] **Step 3: Commit**

```bash
git add client/src/contexts/CharacterContext.tsx
git commit -m "feat(buffs): apply and notify buffs received in real time via websocket"
```

---

## Task 13: Componente de conjuração compartilhado com seletor de alvos

**Files:**
- Delete: `client/src/components/sheet/CastSpellSheet/CastSpellSheet.tsx`
- Delete: `client/src/components/sheet/CastSpellSheet/CastSpellSheet.module.css`
- Create: `client/src/components/sheet/CastActionSheet/CastActionSheet.module.css`
- Create: `client/src/components/sheet/CastActionSheet/CastActionSheet.tsx`
- Modify: `client/src/components/sheet/MagiasPanel/MagiasPanel.tsx`

Este componente substitui o `CastSpellSheet` criado numa sessão anterior, generalizando
para também servir Poderes, e adicionando o passo de seleção de alvos quando a
magia/poder concede buff e permite escolher outros personagens.

- [ ] **Step 1: CSS (copiado do `CastSpellSheet` existente + estilos do seletor de alvos)**

Crie `client/src/components/sheet/CastActionSheet/CastActionSheet.module.css`:

```css
.baseCost {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 12px;
  border-bottom: 1px solid var(--line-2);
  margin-bottom: 12px;
}

.baseLabel {
  font-size: 12px;
  color: var(--ink-3);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.baseVal {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
}

.enhHeader {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 8px;
}

.enhList {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.enhItem {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 9px 12px;
  cursor: pointer;
}

.enhDesc {
  flex: 1;
  font-size: 13px;
}

.enhPm {
  flex: 0 0 auto;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--accent-ink);
  background: var(--accent-soft);
  padding: 3px 8px;
  border-radius: 7px;
}

.empty {
  font-size: 12px;
  color: var(--ink-3);
  font-weight: 600;
  margin-bottom: 12px;
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

.warn {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #f87171;
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

Adicione, no mesmo arquivo, ao final (estilos do seletor de alvos):

```css
.targetList {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.targetRow {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 9px 12px;
  cursor: pointer;
}

.targetAvatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--accent-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  flex: 0 0 auto;
  overflow: hidden;
}

.targetAvatarImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.targetName {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
}

.targetEmpty {
  font-size: 12px;
  color: var(--ink-3);
  font-weight: 600;
  margin-bottom: 12px;
}
```

- [ ] **Step 2: Componente `CastActionSheet`**

Crie `client/src/components/sheet/CastActionSheet/CastActionSheet.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getTotalLevel, applyBuffToCharacter } from '../../../utils/calculations';
import { playMagicSound } from '../../../utils/sounds';
import { triggerAttackAnim } from '../../../utils/animations';
import { apiFetchParties, apiFetchPartyCharacters, apiApplyBuffToParty, type PartyCharacter } from '../../../api';
import type { BuffEffect } from '../../../types/character';
import { getInitials } from '../../../utils/formatters';
import Sheet from '../../ui/Sheet/Sheet';
import styles from './CastActionSheet.module.css';

export interface CastActionEnhancement {
  description: string;
  mpCost: number;
  buffs?: BuffEffect[];
}

export interface CastActionSpec {
  name: string;
  mpCost: number;
  buffs?: BuffEffect[];
  buffTargetScope?: 'self' | 'party';
  enhancements?: CastActionEnhancement[];
}

interface CastActionSheetProps {
  action: CastActionSpec | null;
  onClose: () => void;
}

type Step = 'config' | 'targets';

function CastActionSheet({ action, onClose }: CastActionSheetProps) {
  const { character, updateCharacter, sendSpellCast } = useCharacterContext();
  const [selectedEnh, setSelectedEnh] = useState<boolean[]>([]);
  const [step, setStep] = useState<Step>('config');
  const [candidates, setCandidates] = useState<PartyCharacter[]>([]);
  const [candidatePartyId, setCandidatePartyId] = useState<Record<string, string>>({});
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [lastAction, setLastAction] = useState<CastActionSpec | null>(null);

  const activeAction = action ?? lastAction;
  const enhancements = activeAction?.enhancements ?? [];

  useEffect(() => {
    if (action) {
      setLastAction(action);
      setSelectedEnh(new Array((action.enhancements ?? []).length).fill(false));
      setStep('config');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  if (!character || !activeAction) return null;

  const baseCost = Number(activeAction.mpCost) || 0;
  const enhCost = enhancements.reduce(
    (sum, enh, i) => (selectedEnh[i] ? sum + (Number(enh.mpCost) || 0) : sum),
    0,
  );
  const totalCost = baseCost + enhCost;
  const level = getTotalLevel(character);

  const combinedBuffs: BuffEffect[] = [
    ...(activeAction.buffs ?? []),
    ...enhancements.flatMap((enh, i) => (selectedEnh[i] ? (enh.buffs ?? []) : [])),
  ];

  const toggleEnhancement = (i: number) => {
    setSelectedEnh((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const finish = () => {
    updateCharacter((f) => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - totalCost) },
      logs: [
        ...f.logs,
        {
          type: 'spell',
          name: activeAction.name || 'Ação',
          mpSpent: totalCost,
          timestamp: Date.now(),
          details: { baseMpCost: baseCost, totalCost },
        },
      ],
    }));
    sendSpellCast(activeAction.name || 'Ação', totalCost);
    playMagicSound();
    triggerAttackAnim('toast', { type: 'magic', name: activeAction.name || 'Ação', mpCost: totalCost });
  };

  const goToTargetsOrFinish = async () => {
    if (combinedBuffs.length === 0 || activeAction.buffTargetScope !== 'party') {
      // Sem alvo a escolher: se há buff, aplica só no próprio conjurador.
      if (combinedBuffs.length > 0) {
        const buff = { name: activeAction.name, effects: combinedBuffs, mp: 0, active: true };
        updateCharacter((f) => applyBuffToCharacter(f, buff));
      }
      finish();
      onClose();
      return;
    }

    const parties = await apiFetchParties();
    const mine = parties.filter((p) => p.members.some((m) => m.characterIds.includes(character._id)));
    if (mine.length === 0) {
      const buff = { name: activeAction.name, effects: combinedBuffs, mp: 0, active: true };
      updateCharacter((f) => applyBuffToCharacter(f, buff));
      finish();
      onClose();
      return;
    }

    const rosters = await Promise.all(mine.map((p) => apiFetchPartyCharacters(p.id)));
    const seen = new Set<string>();
    const merged: PartyCharacter[] = [];
    const partyOf: Record<string, string> = {};
    rosters.forEach((roster, idx) => {
      roster.forEach((c) => {
        if (!seen.has(c._id)) {
          seen.add(c._id);
          merged.push(c);
          partyOf[c._id] = mine[idx].id;
        }
      });
    });

    setCandidates(merged);
    setCandidatePartyId(partyOf);
    setSelectedTargets(new Set([character._id]));
    setStep('targets');
  };

  const toggleTarget = (id: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmTargets = async () => {
    const buffPayload = { name: activeAction.name, effects: combinedBuffs, source: `de ${character.name}` };
    const others = [...selectedTargets].filter((id) => id !== character._id);
    const includesSelf = selectedTargets.has(character._id);

    if (includesSelf) {
      const buff = { ...buffPayload, mp: 0, active: true };
      updateCharacter((f) => applyBuffToCharacter(f, buff));
    }

    if (others.length > 0) {
      const byParty = new Map<string, string[]>();
      others.forEach((id) => {
        const pid = candidatePartyId[id];
        if (!pid) return;
        byParty.set(pid, [...(byParty.get(pid) ?? []), id]);
      });
      await Promise.all(
        [...byParty.entries()].map(([partyId, targetCharacterIds]) =>
          apiApplyBuffToParty(partyId, { targetCharacterIds, buff: buffPayload }),
        ),
      );
    }

    finish();
    onClose();
  };

  if (step === 'targets') {
    const footer = (
      <>
        <button type="button" className={styles.btnCancel} onClick={() => setStep('config')}>
          Voltar
        </button>
        <button type="button" className={styles.btnConfirm} onClick={confirmTargets}>
          ✦ Aplicar
        </button>
      </>
    );
    return (
      <Sheet open={Boolean(action)} onClose={onClose} title={`Aplicar "${activeAction.name}" em`} footer={footer}>
        {candidates.length === 0 ? (
          <p className={styles.targetEmpty}>Nenhum outro personagem no grupo.</p>
        ) : (
          <div className={styles.targetList}>
            {candidates.map((c) => (
              <label key={c._id} className={styles.targetRow}>
                <input
                  type="checkbox"
                  checked={selectedTargets.has(c._id)}
                  onChange={() => toggleTarget(c._id)}
                />
                <span className={styles.targetAvatar}>
                  {c.avatar ? <img className={styles.targetAvatarImg} src={c.avatar} alt="" /> : getInitials(c.name)}
                </span>
                <span className={styles.targetName}>{c.name || 'Sem nome'}</span>
              </label>
            ))}
          </div>
        )}
      </Sheet>
    );
  }

  const footer = (
    <>
      <button type="button" className={styles.btnCancel} onClick={onClose}>
        Cancelar
      </button>
      <button type="button" className={styles.btnConfirm} onClick={() => { void goToTargetsOrFinish(); }}>
        ✦ Conjurar
      </button>
    </>
  );

  return (
    <Sheet open={Boolean(action)} onClose={onClose} title={activeAction.name || 'Ação'} footer={footer}>
      <div className={styles.baseCost}>
        <span className={styles.baseLabel}>Custo Base</span>
        <span className={styles.baseVal}>{baseCost} PM</span>
      </div>

      {enhancements.length > 0 && <div className={styles.enhHeader}>Aprimoramentos</div>}

      {enhancements.length > 0 ? (
        <div className={styles.enhList}>
          {enhancements.map((enh, i) => (
            <label key={i} className={styles.enhItem}>
              <input
                type="checkbox"
                checked={selectedEnh[i] || false}
                onChange={() => toggleEnhancement(i)}
              />
              <span className={styles.enhDesc}>{enh.description || `Aprimoramento ${i + 1}`}</span>
              <span className={styles.enhPm}>+{Number(enh.mpCost) || 0} PM</span>
            </label>
          ))}
        </div>
      ) : (
        action?.enhancements !== undefined && <p className={styles.empty}>Nenhum aprimoramento cadastrado.</p>
      )}

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Custo Total</span>
        <span className={styles.totalVal}>{totalCost} PM</span>
      </div>

      {totalCost > level && (
        <div className={styles.warn}>Custo excede o nível do personagem ({level})</div>
      )}
    </Sheet>
  );
}

CastActionSheet.displayName = 'CastActionSheet';

export default CastActionSheet;
```

- [ ] **Step 3: Apagar o `CastSpellSheet` antigo**

```bash
rm -rf client/src/components/sheet/CastSpellSheet
```

- [ ] **Step 4: Atualizar `MagiasPanel` para usar `CastActionSheet`**

Abra `client/src/components/sheet/MagiasPanel/MagiasPanel.tsx`. Troque o import:

```ts
import CastSpellSheet from '../CastSpellSheet/CastSpellSheet';
```

por:

```ts
import CastActionSheet from '../CastActionSheet/CastActionSheet';
import type { CastActionSpec } from '../CastActionSheet/CastActionSheet';
```

Troque o estado `castIdx` por um estado que guarda a spec inteira (mais simples do que
re-derivar toda vez):

```ts
  const [castIdx, setCastIdx] = useState<number | null>(null);
```

por:

```ts
  const [castAction, setCastAction] = useState<CastActionSpec | null>(null);
```

Troque o `onCast={setCastIdx}` do `<SpellCard>` por:

```tsx
              onCast={(index) => {
                const sp = spells[index];
                setCastAction({
                  name: sp.name,
                  mpCost: sp.mpCost,
                  buffs: sp.buffs,
                  buffTargetScope: sp.buffTargetScope,
                  enhancements: sp.enhancements,
                });
              }}
```

E troque o fim do arquivo:

```tsx
      <CastSpellSheet spellIndex={castIdx} onClose={() => setCastIdx(null)} />
```

por:

```tsx
      <CastActionSheet action={castAction} onClose={() => setCastAction(null)} />
```

- [ ] **Step 5: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: limpo. Se `SpellCard`'s `onCast` prop tiver assinatura `(index: number) =>
void`, o novo `onCast` inline acima já respeita isso (recebe `index`, usa para montar a
spec).

- [ ] **Step 6: Commit**

```bash
git add client/src/components/sheet/CastActionSheet/ client/src/components/sheet/MagiasPanel/MagiasPanel.tsx
git rm -r client/src/components/sheet/CastSpellSheet
git commit -m "feat(buffs): generalize cast sheet with party target picker"
```

---

## Task 14: "Usar" em Poderes + aba de Ações combinada

**Files:**
- Modify: `client/src/components/sheet/AbilityCard/AbilityCard.tsx`
- Modify: `client/src/components/sheet/AbilityCard/AbilityCard.module.css`
- Modify: `client/src/components/sheet/PoderesPanel/PoderesPanel.tsx`
- Modify: `client/src/components/sheet/AcoesPanel/AcoesPanel.tsx`

- [ ] **Step 1: Botão "Usar" no `AbilityCard`**

Abra `client/src/components/sheet/AbilityCard/AbilityCard.tsx`. Adicione a prop
`onUse` e o botão condicional. Substitua o conteúdo inteiro por:

```tsx
import Card from '../../ui/Card/Card';
import Chip from '../../ui/Chip/Chip';
import type { Ability } from '../../../types/character';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import styles from './AbilityCard.module.css';

interface AbilityCardProps {
  ability: Ability;
  index: number;
  onEdit?: (index: number) => void;
  onUse?: (index: number) => void;
}

function AbilityCard({ ability, index, onEdit, onUse }: AbilityCardProps) {
  const { readOnly } = useCharacterContext();

  const kind = ability.kind ?? 'Poder';
  const chipVariant = kind === 'Habilidade' ? 'warn' : 'buff';
  const mpCost = Number(ability.mpCost) || 0;
  const hasBuffs = (ability.buffs ?? []).length > 0;
  const showUse = onUse && (mpCost > 0 || hasBuffs);

  return (
    <Card className={styles.pow}>
      <div
        className={`${styles.txt} ${!readOnly ? styles.tappable : ''}`.trim()}
        onClick={!readOnly ? () => onEdit?.(index) : undefined}
        role={!readOnly ? 'button' : undefined}
        tabIndex={!readOnly ? 0 : undefined}
      >
        <div className={styles.head}>
          <h3 className={styles.name}>{ability.name || 'Sem nome'}</h3>
          <Chip label={kind} variant={chipVariant} active className={styles.tag} />
        </div>
        {(ability.source || mpCost > 0) && (
          <div className={styles.metaRow}>
            {ability.source && <span className={styles.source}>{ability.source}</span>}
            {mpCost > 0 && <span className={styles.pm}>{mpCost} PM</span>}
          </div>
        )}
        {ability.description && <p className={styles.desc}>{ability.description}</p>}
      </div>
      {!readOnly && showUse && (
        <button type="button" className={styles.btnUse} onClick={() => onUse?.(index)}>
          ▶ Usar
        </button>
      )}
    </Card>
  );
}

AbilityCard.displayName = 'AbilityCard';

export default AbilityCard;
```

Note que o `onClick`/`role`/`tabIndex` de edição saíram do `<Card>` e foram para uma
`<div className={styles.txt}>` interna — isso evita que clicar no botão "Usar" também
dispare a edição (o botão já teria `stopPropagation` implícito por estar fora da área
clicável de edição agora).

- [ ] **Step 2: CSS do botão "Usar"**

Abra `client/src/components/sheet/AbilityCard/AbilityCard.module.css`. Leia o arquivo
primeiro para conferir os tokens de cor já usados (`var(--accent)` etc., mesmo padrão
do `.btnCast` em `SpellCard.module.css`). Adicione ao final:

```css
.btnUse {
  width: 100%;
  padding: 10px;
  border: none;
  border-top: 1px solid var(--line);
  border-radius: 0 0 var(--r-lg, 14px) var(--r-lg, 14px);
  background: var(--accent);
  color: #04130d;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
```

Se `.pow` (classe raiz do Card) já tiver `overflow: hidden` ou algo que corte o
`border-radius` do botão, não precisa mudar nada — senão, adicione `overflow: hidden;`
em `.pow` para o botão não vazar dos cantos arredondados do card.

- [ ] **Step 3: `PoderesPanel` — conjuração**

Abra `client/src/components/sheet/PoderesPanel/PoderesPanel.tsx`. Substitua o conteúdo
inteiro por:

```tsx
import { useState } from 'react';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import AbilityCard from '../AbilityCard/AbilityCard';
import AddButton from '../AddButton/AddButton';
import CastActionSheet from '../CastActionSheet/CastActionSheet';
import type { CastActionSpec } from '../CastActionSheet/CastActionSheet';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import styles from './PoderesPanel.module.css';

function PoderesPanel() {
  const { character, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();
  const [castAction, setCastAction] = useState<CastActionSpec | null>(null);

  if (!character) return null;

  const abilities = character.abilities ?? [];

  const handleEdit = (index: number) =>
    openEdit(abilities[index]?.kind === 'Habilidade' ? 'habilidade' : 'poder', index);

  const handleUse = (index: number) => {
    const ab = abilities[index];
    if (!ab) return;
    setCastAction({
      name: ab.name,
      mpCost: ab.mpCost,
      buffs: ab.buffs,
      buffTargetScope: ab.buffTargetScope,
    });
  };

  return (
    <section>
      <SectionHeader
        title="Poderes & Habilidades"
        action={!readOnly && <AddButton label="Poder / Hab." onClick={() => openCreate('poder')} />}
      />
      {abilities.length === 0 ? (
        <p className={styles.empty}>Nenhum poder ou habilidade cadastrado.</p>
      ) : (
        <div className={styles.list}>
          {abilities.map((ability, index) => (
            <AbilityCard
              key={index}
              ability={ability}
              index={index}
              onEdit={handleEdit}
              onUse={handleUse}
            />
          ))}
        </div>
      )}

      <CastActionSheet action={castAction} onClose={() => setCastAction(null)} />
    </section>
  );
}

PoderesPanel.displayName = 'PoderesPanel';

export default PoderesPanel;
```

- [ ] **Step 4: Aba de Ações combinada**

Abra `client/src/components/sheet/AcoesPanel/AcoesPanel.tsx`. Substitua o conteúdo
inteiro por:

```tsx
import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import SectionHeader from '../../ui/SectionHeader/SectionHeader';
import ActionCard from '../ActionCard/ActionCard';
import SpellCard from '../SpellCard/SpellCard';
import AbilityCard from '../AbilityCard/AbilityCard';
import AddButton from '../AddButton/AddButton';
import CastActionSheet from '../CastActionSheet/CastActionSheet';
import type { CastActionSpec } from '../CastActionSheet/CastActionSheet';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import styles from './AcoesPanel.module.css';

/**
 * Combat actions (rollable attacks, spells, castable powers) — lives in the main
 * "Atributos" tab, so a player doesn't need to switch tabs mid-combat.
 */
function AcoesPanel() {
  const { character, readOnly } = useCharacterContext();
  const { openEdit, openCreate } = useSheetForm();
  const [castAction, setCastAction] = useState<CastActionSpec | null>(null);

  if (!character) return null;

  const attacks = character.attacks ?? [];
  const spells = character.spells ?? [];
  const castableAbilities = (character.abilities ?? [])
    .map((ability, index) => ({ ability, index }))
    .filter(({ ability }) => ability.castable);

  const castSpell = (index: number) => {
    const sp = spells[index];
    setCastAction({
      name: sp.name, mpCost: sp.mpCost, buffs: sp.buffs,
      buffTargetScope: sp.buffTargetScope, enhancements: sp.enhancements,
    });
  };

  const castAbility = (index: number) => {
    const ab = character.abilities[index];
    setCastAction({ name: ab.name, mpCost: ab.mpCost, buffs: ab.buffs, buffTargetScope: ab.buffTargetScope });
  };

  return (
    <div className={styles.panel}>
      <SectionHeader
        title="Ataques"
        action={!readOnly && <AddButton label="Ataque" onClick={() => openCreate('ataque')} />}
      />
      {attacks.length > 0 ? (
        <div className={styles.grid}>
          {attacks.map((attack, idx) => (
            <ActionCard key={idx} attack={attack} index={idx} onEdit={(i) => openEdit('ataque', i)} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Nenhum ataque cadastrado.</p>
      )}

      <SectionHeader title="Magias" className={styles.gap} />
      {spells.length > 0 ? (
        <div className={styles.grid}>
          {spells.map((spell, index) => (
            <SpellCard
              key={index}
              spell={spell}
              index={index}
              onCast={castSpell}
              onEdit={(i) => openEdit('magia', i)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Nenhuma magia conhecida.</p>
      )}

      <SectionHeader title="Poderes" className={styles.gap} />
      {castableAbilities.length > 0 ? (
        <div className={styles.grid}>
          {castableAbilities.map(({ ability, index }) => (
            <AbilityCard
              key={index}
              ability={ability}
              index={index}
              onEdit={() => openEdit(ability.kind === 'Habilidade' ? 'habilidade' : 'poder', index)}
              onUse={castAbility}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Nenhum poder conjurável.</p>
      )}

      <CastActionSheet action={castAction} onClose={() => setCastAction(null)} />
    </div>
  );
}

AcoesPanel.displayName = 'AcoesPanel';

export default AcoesPanel;
```

- [ ] **Step 5: CSS `.gap` no `AcoesPanel.module.css`**

Abra `client/src/components/sheet/AcoesPanel/AcoesPanel.module.css`. Se não existir
uma classe `.gap`, adicione:

```css
.gap {
  margin-top: 20px;
}
```

- [ ] **Step 6: Typecheck**

```bash
cd client && npx tsc -b --force
```

Esperado: limpo.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/sheet/AbilityCard/ client/src/components/sheet/PoderesPanel/ client/src/components/sheet/AcoesPanel/
git commit -m "feat(buffs): add usable powers and combined actions tab (attacks/spells/powers)"
```

---

## Task 15: Teste end-to-end no navegador

**Files:** nenhum (só verificação manual)

- [ ] **Step 1: Subir o app localmente**

Se o dev server não estiver rodando:

```bash
npm run dev
```

Abrir `http://localhost:5173` no Chrome (via claude-in-chrome), logar, abrir um
personagem de teste que pertença a um grupo com pelo menos mais um personagem (ou
criar um grupo de teste com 2 personagens antes de continuar).

- [ ] **Step 2: Criar a magia "Bênção" com buff multi-alvo**

Na aba Magias, criar uma magia:
- Nome: "Bênção"
- Custo (PM): 1
- Alvo do buff: "Posso escolher outros"
- Efeitos de Buff (base): adicionar um efeito `Tipo: Teste de Ataque, Valor: 2`
- Aprimoramentos: adicionar um aprimoramento (PM extra: 1, Efeito: "+2 de dano") e,
  dentro dele, um efeito de buff `Tipo: Dano Fixo, Valor: 2`

Confirmar visualmente que os campos aninhados (efeito dentro do aprimoramento)
aparecem e salvam corretamente (reabrir o formulário depois de salvar e conferir que
os valores persistiram).

- [ ] **Step 3: Conjurar com seleção de alvos**

Na aba Ações (Atributos) ou na aba Magias, clicar "✦ Lançar" em "Bênção", marcar o
aprimoramento, clicar "Conjurar" — confirmar que aparece a tela de seleção de alvos
com o próprio personagem pré-marcado e o outro personagem do grupo na lista. Marcar
ambos, clicar "Aplicar".

Confirmar:
- PM foi descontado só do personagem conjurador (não do alvo).
- O buff "Bênção" aparece ativo na lista de Buffs & Condições do PRÓPRIO conjurador,
  com os dois efeitos (+2 ataque, +2 dano fixo).
- Histórico (menu "⋯" → Histórico) mostra a entrada de conjuração.

- [ ] **Step 4: Confirmar aplicação no outro personagem + notificação em tempo real**

Abrir o OUTRO personagem (o alvo) numa aba separada do navegador, **antes** de repetir
a conjuração (para testar o caminho "online"). Repetir a conjuração no personagem A
selecionando o personagem B como alvo. Na aba do personagem B, confirmar:
- Toast aparece: `Você recebeu o buff "Bênção" (de <nome do conjurador>)!`
- O buff aparece na lista de Buffs & Condições do personagem B, já ativo, sem
  precisar recarregar a página.

Depois, recarregar a aba do personagem B e confirmar que o buff continua lá (persistiu
no banco).

- [ ] **Step 5: Poder conjurável**

Criar um Poder marcado "Conjurável: Sim", "Alvo do buff: Posso escolher outros", com um
efeito de buff (ex.: Tipo: Defesa, Valor: 2). Confirmar que aparece na aba Ações sob
"Poderes" com o botão "▶ Usar", e que o fluxo de conjuração/seleção de alvo funciona
igual ao de magia.

- [ ] **Step 6: Compatibilidade com buff antigo**

Se houver algum personagem de teste com um buff criado ANTES desta implementação
(formato antigo, sem `effects`), abrir a ficha dele e confirmar que o buff aparece
corretamente na lista (não em branco, não quebra a página).

- [ ] **Step 7: Reportar resultado**

Ao final, relatar ao usuário: o que funcionou, qualquer ajuste visual/de texto que
tenha sido necessário durante o teste, e perguntar se quer publicar (rebuild + restart
do container Docker) como nas vezes anteriores.
