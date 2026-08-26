# Vitais, dano com RD e ciclo de dia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PV/PM temporários virarem sobrevida (consumidos antes, nunca curados), com botão "Tomar dano" que aplica RDs, e um ciclo de dia ("Desligar todos", "Novo dia", usos por dia) — na ficha, no servidor e na visão do mestre.

**Architecture:** Toda a aritmética nasce pura em `client/src/utils/vitals.ts` sobre um `VitalState { current, max, temp }`, com wrappers que leem/escrevem `Character`. UI (`VitalBar`, `TakeDamageSheet`, `BuffsDrawer`), `CharacterContext` (migração de leitura + websocket), `CombatContext` (mestre) e o espelho do servidor (`buffMerge.js`, `websocket.js`, DTO) só chamam essas funções. Cada história do backlog é uma ou duas tarefas com teste primeiro.

**Tech Stack:** React 19 + TypeScript strict (Vite, vitest, CSS Modules); Node/Express + `node:test` no servidor.

**Spec:** `docs/backlog-ficha-2026-08-26.md` — épicos **E4** (H4.1–H4.3), **E5** (H5.1, H5.2), **E1** (H1.1–H1.4).

## Global Constraints

- Invariante: `0 ≤ hp.current ≤ getEffectiveMaxHp(c)` e `temporaryHp ≥ 0`; idem PM. O temporário **nunca** entra no teto do atual.
- Decisões da mesa (26/08): **RDs somam**; **PV/PM temporários de fontes diferentes somam**; **"Novo dia" cura tudo e desliga todos os buffs** (sem tabela de descanso).
- Campo numérico: nunca `<input type="number">` controlado — draft string + `select()` no foco + normaliza no blur (`NumericInput`/`NumberField` já fazem isso).
- Cores/temas por token CSS (`var(--…)`), nunca hex novo solto; conferir dark e light.
- Servidor e cliente espelham a mesma regra em `applyBuffToCharacter` ⇄ `mergeBuffIntoCharacter` (o cabeçalho de ambos diz "mudou aqui, muda lá").
- Testes: cliente `npm --prefix client run test`; servidor `npm run test:server`; tipagem `npx --prefix client tsc -b client`. Um commit por tarefa, mensagens em português no padrão do repo.
- Não commitar em `claude-code/react-migrate`; trabalhar em `feature/saas`.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `client/src/utils/vitals.ts` (novo) + `vitals.test.ts` | matemática pura de PV/PM/temp, RD, novo dia |
| `client/src/utils/calculations.ts` (+ test) | `applyBuffToCharacter` sem cura por temp; `deactivateAllBuffs`, `removeInactiveBuffs` |
| `client/src/components/ui/Stepper/Stepper.tsx` | prop opcional `onStep(delta)` |
| `client/src/components/sheet/VitalBar/VitalBar.tsx` (+ css) | barra com segmento de temp, popover, botões "Tomar dano"/"Curar tudo", menu "Novo dia" |
| `client/src/components/sheet/TakeDamageSheet/` (novo) | sheet de dano com tipo, RDs, prévia |
| `client/src/components/sheet/BuffsDrawer/BuffsDrawer.tsx` (+ css) | "Desligar todos", "Limpar desligados" |
| `client/src/components/sheet/LogsSheet/LogsSheet.tsx` · `data/constants.ts` | log `damage`/`rest` |
| `client/src/contexts/CharacterContext.tsx` | `normalizeVitals` na leitura; temp no websocket |
| `client/src/contexts/CombatContext.tsx` · `types/combat.ts` · `utils/combatRows.ts` · `components/combat/{CombatCard,DamagePopover}/` · `pages/GameMasterPage/` | mestre vê temp e aplica dano/RD com as mesmas funções |
| `client/src/api/parties.ts` | `PartyCharacter` com `temporaryHp`, `temporaryMp`, `damageReductions` |
| `client/src/types/character.ts` · `SheetForm/entityForms.ts` · `components/sheet/{AbilityCard,PoderesPanel,AcoesPanel,CastActionSheet}/` | usos por dia (H1.3); duração (H1.4) |
| `server/src/utils/buffMerge.js` (+ test) · `server/websocket.js` · `server/src/dto/party.dto.js` | espelho do modelo, payloads, DTO |
| `client/src/components/character/HpMp/` | **remover** (painel legado não montado) |

---

### Task 1: `utils/vitals.ts` — matemática pura de PV/PM com temporário separado (H4.1)

**Files:**
- Create: `client/src/utils/vitals.ts`, `client/src/utils/vitals.test.ts`

**Interfaces:**
- Produces:
  - `type VitalPool = 'hp' | 'mp'`; `interface VitalState { current: number; max: number; temp: number }`; `interface DamageSplit { fromTemp: number; fromCurrent: number }`
  - `damageVital(v: VitalState, amount: number): { state: VitalState; split: DamageSplit }`
  - `healVital(v: VitalState, amount: number): VitalState` (aceita `Infinity`)
  - `clampVital(v: VitalState): VitalState`
  - `getVital(c: Character, pool): VitalState` (usa `getEffectiveMaxHp/Mp`) · `setVital(c, pool, v): Character`
  - `applyDamage(c, amount, pool): Character` · `splitDamage(c, amount, pool): DamageSplit` · `applyHeal(c, amount, pool): Character` · `normalizeVitals(c): Character` (devolve a mesma referência se nada muda)

- [ ] **Step 1: Testes (falham: módulo não existe)**

`client/src/utils/vitals.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Character } from '../types/character';
import { createEmptyCharacter } from './calculations';
import {
  damageVital, healVital, clampVital, getVital, applyDamage, splitDamage, applyHeal, normalizeVitals,
} from './vitals';

function char(overrides: Partial<Character> = {}): Character {
  return { ...createEmptyCharacter('T'), hp: { max: 30, current: 20 }, mp: { max: 10, current: 4 }, temporaryHp: 5, ...overrides };
}

describe('damageVital', () => {
  it('consome o temporário antes do atual', () => {
    const { state, split } = damageVital({ current: 20, max: 30, temp: 5 }, 3);
    expect(state).toEqual({ current: 20, max: 30, temp: 2 });
    expect(split).toEqual({ fromTemp: 3, fromCurrent: 0 });
  });
  it('o excedente sai do atual, nunca abaixo de zero', () => {
    const { state, split } = damageVital({ current: 20, max: 30, temp: 5 }, 40);
    expect(state).toEqual({ current: 0, max: 30, temp: 0 });
    expect(split).toEqual({ fromTemp: 5, fromCurrent: 20 });
  });
  it('dano zero, negativo ou NaN não muda nada', () => {
    const v = { current: 20, max: 30, temp: 5 };
    expect(damageVital(v, 0).state).toEqual(v);
    expect(damageVital(v, -4).state).toEqual(v);
    expect(damageVital(v, Number.NaN).state).toEqual(v);
  });
});

describe('healVital', () => {
  it('sobe o atual até o máximo e não toca o temporário', () => {
    expect(healVital({ current: 20, max: 30, temp: 5 }, 100)).toEqual({ current: 30, max: 30, temp: 5 });
    expect(healVital({ current: 20, max: 30, temp: 5 }, 3)).toEqual({ current: 23, max: 30, temp: 5 });
  });
  it('aceita Infinity como "curar tudo"', () => {
    expect(healVital({ current: 1, max: 30, temp: 0 }, Infinity).current).toBe(30);
  });
});

describe('clampVital / normalizeVitals', () => {
  it('clampa atual acima do máximo (o excesso era o temporário do modelo antigo) e temp negativo', () => {
    expect(clampVital({ current: 38, max: 30, temp: -2 })).toEqual({ current: 30, max: 30, temp: 0 });
  });
  it('normalizeVitals devolve a mesma referência quando nada muda', () => {
    const c = char();
    expect(normalizeVitals(c)).toBe(c);
  });
  it('normalizeVitals clampa PV e PM contra o máximo EFETIVO (bônus fixo conta)', () => {
    const c = char({
      hp: { max: 30, current: 45 },
      abilities: [{ name: 'Vigor', source: '', type: '', mpCost: 0, description: '', alwaysActive: true,
        buffs: [{ type: 'max_hp', value: '10' }] }],
    });
    expect(normalizeVitals(c).hp.current).toBe(40);
  });
});

describe('wrappers de Character', () => {
  it('getVital usa o máximo efetivo e o temporário do pool certo', () => {
    expect(getVital(char({ temporaryMp: 2 }), 'mp')).toEqual({ current: 4, max: 10, temp: 2 });
  });
  it('applyDamage / splitDamage / applyHeal escrevem no pool certo e só nele', () => {
    const c = char();
    const hit = applyDamage(c, 7, 'hp');
    expect(hit.temporaryHp).toBe(0);
    expect(hit.hp.current).toBe(18);
    expect(hit.mp).toEqual(c.mp);
    expect(splitDamage(c, 7, 'hp')).toEqual({ fromTemp: 5, fromCurrent: 2 });
    expect(applyHeal(hit, Infinity, 'hp').hp.current).toBe(30);
    expect(applyHeal(hit, Infinity, 'hp').temporaryHp).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar** — `npm --prefix client run test -- vitals` → FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

`client/src/utils/vitals.ts`:

```ts
import type { Character } from '../types/character';
import { getEffectiveMaxHp, getEffectiveMaxMp } from './calculations';

export type VitalPool = 'hp' | 'mp';

/** Um pool (PV ou PM): `current` nunca passa de `max`; `temp` é a sobrevida — separada,
 * consumida antes do atual e nunca reposta por cura. */
export interface VitalState {
  current: number;
  max: number;
  temp: number;
}

export interface DamageSplit {
  fromTemp: number;
  fromCurrent: number;
}

/** Quantidade válida de dano/cura: número finito positivo (ou Infinity, na cura). */
const positive = (n: number): number => (Number.isNaN(n) || n <= 0 ? 0 : n);

export function damageVital(v: VitalState, amount: number): { state: VitalState; split: DamageSplit } {
  const dmg = positive(amount);
  const fromTemp = Math.min(v.temp, dmg);
  const fromCurrent = Math.min(v.current, dmg - fromTemp);
  return {
    state: { ...v, temp: v.temp - fromTemp, current: v.current - fromCurrent },
    split: { fromTemp, fromCurrent },
  };
}

export function healVital(v: VitalState, amount: number): VitalState {
  return { ...v, current: Math.min(v.max, v.current + positive(amount)) };
}

export function clampVital(v: VitalState): VitalState {
  const max = Math.max(0, v.max || 0);
  return { max, current: Math.max(0, Math.min(max, v.current || 0)), temp: Math.max(0, v.temp || 0) };
}

export function getVital(c: Character, pool: VitalPool): VitalState {
  return pool === 'hp'
    ? { current: c.hp.current || 0, max: getEffectiveMaxHp(c), temp: c.temporaryHp || 0 }
    : { current: c.mp.current || 0, max: getEffectiveMaxMp(c), temp: c.temporaryMp || 0 };
}

export function setVital(c: Character, pool: VitalPool, v: VitalState): Character {
  return pool === 'hp'
    ? { ...c, hp: { ...c.hp, current: v.current }, temporaryHp: v.temp }
    : { ...c, mp: { ...c.mp, current: v.current }, temporaryMp: v.temp };
}

export function splitDamage(c: Character, amount: number, pool: VitalPool): DamageSplit {
  return damageVital(getVital(c, pool), amount).split;
}

export function applyDamage(c: Character, amount: number, pool: VitalPool): Character {
  return setVital(c, pool, damageVital(getVital(c, pool), amount).state);
}

export function applyHeal(c: Character, amount: number, pool: VitalPool): Character {
  return setVital(c, pool, healVital(getVital(c, pool), amount));
}

/**
 * Migração de leitura: fichas do modelo antigo guardavam o temporário DENTRO de
 * `hp.current` (o teto era máximo + temp). Clampa o atual no máximo efetivo — o
 * excesso já está em `temporaryHp`. Idempotente; devolve a mesma referência se
 * nada muda, pra não disparar autosave à toa.
 */
export function normalizeVitals(c: Character): Character {
  const hp = clampVital(getVital(c, 'hp'));
  const mp = clampVital(getVital(c, 'mp'));
  const same =
    hp.current === (c.hp.current || 0) && hp.temp === (c.temporaryHp || 0)
    && mp.current === (c.mp.current || 0) && mp.temp === (c.temporaryMp || 0);
  return same ? c : setVital(setVital(c, 'hp', hp), 'mp', mp);
}
```

- [ ] **Step 4: Rodar** — `npm --prefix client run test -- vitals` → PASS.
- [ ] **Step 5: Commit** — `git add client/src/utils/vitals.ts client/src/utils/vitals.test.ts && git commit -m "feat(vitais): matemática pura de PV/PM com temporário como sobrevida"`

---

### Task 2: `applyBuffToCharacter` deixa de curar por temporário (H4.1)

**Files:**
- Modify: `client/src/utils/calculations.ts:526-548`
- Modify: `client/src/utils/calculations.test.ts` (describe `applyBuffToCharacter`)

- [ ] **Step 1: Ajustar os testes primeiro**

No `describe('applyBuffToCharacter')`, substituir o teste `heals current HP/MP by the temp amounts received…` por:

```ts
  it('NÃO cura o atual por temp_hp/temp_mp — o temporário é pool separado', () => {
    const c = baseCharacter({ hp: { max: 30, current: 12 }, mp: { max: 10, current: 3 } });
    const next = applyBuffToCharacter(c, activeBuff({ name: 'Bênção', effects: [
      { type: 'temp_hp', value: '10' }, { type: 'temp_mp', value: '2' },
    ] }));
    expect(next.temporaryHp).toBe(10);
    expect(next.temporaryMp).toBe(2);
    expect(next.hp.current).toBe(12);
    expect(next.mp.current).toBe(3);
  });
```

E no teste `heals for max_hp effects and clamps at the effective ceiling on recast`, garantir que o teto esperado seja **sem** temporário: se o caso somava `temporaryHp` ao teto, corrigir a expectativa para `getEffectiveMaxHp(next)`.

- [ ] **Step 2: Rodar** — `npm --prefix client run test -- calculations` → o teste novo FALHA (atual foi curado).

- [ ] **Step 3: Implementar** — em `applyBuffToCharacter`:

```ts
  // Só max_hp/max_mp curam: subir o máximo sobe o atual junto (regra do T20).
  // temp_hp/temp_mp são sobrevida separada (utils/vitals.ts) — não mexem no atual.
  let healHp = 0;
  let healMp = 0;
  buff.effects.forEach((eff) => {
    const val = Number(eff.value) || 0;
    const type = normalizeEffectType(eff.type);
    if (type === 'max_hp') healHp += val;
    if (type === 'max_mp') healMp += val;
  });
  // …
  if (healHp > 0) {
    const ceiling = getEffectiveMaxHp(next);
    next.hp = { ...next.hp, current: Math.min(next.hp.current + healHp, ceiling) };
  }
  if (healMp > 0) {
    const ceiling = getEffectiveMaxMp(next);
    next.mp = { ...next.mp, current: Math.min(next.mp.current + healMp, ceiling) };
  }
```

Atualizar o comentário do cabeçalho da função (remover a frase sobre curar pelo temporário).

- [ ] **Step 4: Rodar** — `npm --prefix client run test` → PASS.
- [ ] **Step 5: Commit** — `git commit -am "fix(buffs): receber PV/PM temporário não cura o atual (pool separado)"`

---

### Task 3: `VitalBar` no modelo novo + segmento de temporário + leitura/websocket (H4.1, H4.2, H4.3-cliente)

**Files:**
- Modify: `client/src/components/ui/Stepper/Stepper.tsx` (prop `onStep`)
- Modify: `client/src/components/sheet/VitalBar/VitalBar.tsx`, `VitalBar.module.css`
- Modify: `client/src/contexts/CharacterContext.tsx`
- Delete: `client/src/components/character/HpMp/` (não é importado por ninguém — conferir com `grep -rn "HpMp" client/src --include=*.tsx | grep import`)

**Interfaces:**
- Consumes: Task 1
- Produces: `Stepper` aceita `onStep?: (delta: number) => void` — quando presente, os botões −/+ chamam `onStep(±step)` em vez de `onChange`.

- [ ] **Step 1: `Stepper.onStep`**

```ts
interface StepperProps {
  // …
  /** Quando presente, os botões −/+ chamam isto (com ±step) em vez de `onChange` —
   * permite que "−1" vire dano (consome temporário) e "+1" vire cura. Arrastar e
   * digitar continuam usando `onChange`. */
  onStep?: (delta: number) => void;
}
// botões:
onClick={() => (onStep ? onStep(-step) : onChange(clamp(value - step)))}
onClick={() => (onStep ? onStep(step) : onChange(clamp(value + step)))}
```

- [ ] **Step 2: `VitalBar` — estado e handlers**

Substituir o bloco de `tempHp…setTempMp` (linhas 66–99) por:

```ts
  const effectiveMaxHp = getEffectiveMaxHp(character);
  const effectiveMaxMp = getEffectiveMaxMp(character);
  const tempHp = character.temporaryHp || 0;
  const tempMp = character.temporaryMp || 0;
  const fixedHpBonus = effectiveMaxHp - hp.max;
  const fixedMpBonus = effectiveMaxMp - mp.max;

  const afterVitals = () => setTimeout(sendHpUpdate, 50);

  /** Digitar/arrastar define o atual (clampado no máximo efetivo, sem o temporário). */
  const setCurrent = (pool: VitalPool) => (next: number) => {
    updateCharacter((f) => setVital(f, pool, clampVital({ ...getVital(f, pool), current: next })));
    afterVitals();
  };
  /** −/+ são dano/cura de 1: dano consome o temporário primeiro, cura nunca o repõe. */
  const stepVital = (pool: VitalPool) => (delta: number) => {
    updateCharacter((f) => (delta < 0 ? applyDamage(f, -delta, pool) : applyHeal(f, delta, pool)));
    afterVitals();
  };
  const healAll = (pool: VitalPool) => () => {
    updateCharacter((f) => applyHeal(f, Infinity, pool));
    afterVitals();
  };
  const setMax = (pool: VitalPool) => (next: number) => {
    updateCharacter((f) => normalizeVitals(pool === 'hp'
      ? { ...f, hp: { ...f.hp, max: Math.max(0, next) } }
      : { ...f, mp: { ...f.mp, max: Math.max(0, next) } }));
    afterVitals();
  };
  const setTemp = (pool: VitalPool) => (next: number) => {
    updateCharacter((f) => setVital(f, pool, { ...getVital(f, pool), temp: Math.max(0, next) }));
    afterVitals();
  };
  /** Buffs ativos que concedem temporário — pra mostrar a origem no popover. */
  const tempSources = (pool: VitalPool) => getActiveBuffs(character)
    .filter((b) => (b.effects || []).some((e) => normalizeEffectType(e.type) === (pool === 'hp' ? 'temp_hp' : 'temp_mp')))
    .map((b) => b.name).filter(Boolean).join(', ');
```

Imports: `getActiveBuffs` de `calculations`, `normalizeEffectType` de `utils/buffEffects`, e `applyDamage, applyHeal, clampVital, getVital, setVital, normalizeVitals, type VitalPool` de `utils/vitals`. Remover `hpMax`/`mpMax`.

- [ ] **Step 3: `VitalBar` — barra com segmento de temporário**

Nos dois `<div className={styles.track}>`:

```tsx
        <div className={styles.track}>
          <i
            className={styles.fill}
            style={{ width: `${hpPercent(hp.current, effectiveMaxHp + tempHp)}%`, background: '#ef4444' }}
          />
          {tempHp > 0 && (
            <i
              className={styles.tempSeg}
              style={{
                left: `${hpPercent(effectiveMaxHp, effectiveMaxHp + tempHp)}%`,
                width: `${hpPercent(tempHp, effectiveMaxHp + tempHp)}%`,
              }}
              aria-hidden="true"
            />
          )}
        </div>
```

(idem para PM com `mp.current`, `effectiveMaxMp`, `tempMp`, `#3b82f6`). CSS em `VitalBar.module.css`:

```css
.track {
  position: relative;
}

/* Sobrevida: segmento hachurado DEPOIS do máximo — não "preenche" o vazio até o máximo. */
.tempSeg {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 3px;
  background: repeating-linear-gradient(135deg, var(--accent-ink) 0 3px, transparent 3px 6px);
  opacity: 0.9;
}

.popHint {
  margin-top: 4px;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--ink-3);
}
```

- [ ] **Step 4: `VitalBar` — popovers**

Stepper: `<Stepper value={hp.current} onChange={setCurrent('hp')} onStep={stepVital('hp')} min={0} max={effectiveMaxHp} barColor="#ef4444" />`. Máximo: `onChange={setMax('hp')}`. Temporário: `onChange={setTemp('hp')}` e, logo abaixo da linha, `<div className={styles.popHint}>Sobrevida: é consumida antes do PV e não é curada.{tempSources('hp') && ` Origem: ${tempSources('hp')}.`}</div>`. "Curar tudo": `onClick={healAll('hp')}`. Mesmo para PM. A legenda `{hp.current} (+{tempHp}) /{effectiveMaxHp}` já existe e fica.

- [ ] **Step 5: `CharacterContext` — migração de leitura + websocket**

- `loadCharacter` e `setCharacterDirect`: envolver o objeto normalizado com `normalizeVitals(...)` (import de `../utils/vitals`).
- `BroadcastSnapshot` ganha `temporaryHp: number; temporaryMp: number`; `sendHpUpdate` envia `temporaryHp: c.temporaryHp || 0, temporaryMp: c.temporaryMp || 0`; a comparação `changed` do autosave inclui os dois.
- Handler `character_hp_sync`: `if (typeof msg.temporaryHp === 'number') next.temporaryHp = msg.temporaryHp; if (typeof msg.temporaryMp === 'number') next.temporaryMp = msg.temporaryMp;` e, ao final, `return normalizeVitals(next)`.
- Handler `master_hp_sync`: além de `currentHp`, aplicar `temporaryHp` se vier número; `normalizeVitals`.

- [ ] **Step 6: Remover o painel legado** — `git rm -r client/src/components/character/HpMp` (só depois de confirmar que o grep de imports está vazio).

- [ ] **Step 7: Tipagem + testes + conferência visual** — `npx --prefix client tsc -b client`; `npm --prefix client run test`; `npm run dev` e conferir: ficha com temp 5 mostra segmento hachurado após o máximo, "−" com temp>0 reduz o temp e não o PV, "Curar tudo" não passa do máximo, dark/light.

- [ ] **Step 8: Commit** — `git add -A client/src && git commit -m "feat(vitais): PV/PM temporário como sobrevida na VitalBar, migração de leitura e temp no websocket"`

---

### Task 4: Espelho no servidor — `buffMerge`, websocket e DTO (H4.3)

**Files:**
- Modify: `server/src/utils/buffMerge.js`, `server/src/utils/buffMerge.test.js`
- Modify: `server/websocket.js:119-145`
- Modify: `server/src/dto/party.dto.js` (`toPartyCharacterDTO`)

- [ ] **Step 1: Ajustar testes de `buffMerge`** — o caso que espera cura por `temp_hp` passa a esperar `hp.current` inalterado; acrescentar:

```js
  it('não cura o atual por temp_hp (temporário é pool separado); max_hp continua curando', () => {
    const next = mergeBuffIntoCharacter(
      { buffs: [], temporaryHp: 0, temporaryMp: 0, hp: { max: 30, current: 12 }, mp: { max: 10, current: 3 } },
      buff({ effects: [{ type: 'temp_hp', value: '10' }, { type: 'max_hp', value: '5' }] }),
    );
    assert.equal(next.temporaryHp, 10);
    assert.equal(next.hp.current, 17);   // só o max_hp (teto 30+5=35)
  });
```

- [ ] **Step 2: Rodar** — `npm run test:server` → FAIL no teste novo.

- [ ] **Step 3: Implementar** — em `buffMerge.js`: `healHp = sumEffectsByType(entry.effects, isMaxHpType)` (sem `isTempHpType`), idem PM; `ceiling = (Number(hp.max) || 0) + activeMaxBonus(isMaxHpType)` (sem `hpTemp`), idem PM. Atualizar o comentário do cabeçalho.

- [ ] **Step 4: websocket** — em `character_hp_update → character_hp_sync` acrescentar `temporaryHp: msg.temporaryHp, temporaryMp: msg.temporaryMp`; em `master_hp_update → master_hp_sync` acrescentar `temporaryHp: msg.temporaryHp`.

- [ ] **Step 5: DTO** — `toPartyCharacterDTO` ganha `temporaryHp: Number(doc.temporaryHp) || 0, temporaryMp: Number(doc.temporaryMp) || 0, damageReductions: Array.isArray(doc.damageReductions) ? doc.damageReductions : []`.

- [ ] **Step 6: Rodar** — `npm run test:server` → PASS.
- [ ] **Step 7: Commit** — `git add server && git commit -m "fix(server): espelho do PV temporário como sobrevida; temp no websocket e no DTO de party"`

---

### Task 5: Mestre vê e aplica o modelo novo (H4.3)

**Files:**
- Modify: `client/src/api/parties.ts` (`PartyCharacter`), `client/src/types/combat.ts` (`CombatPlayer`, `CombatRow`), `client/src/utils/combatRows.ts`, `client/src/contexts/CombatContext.tsx`, `client/src/pages/GameMasterPage/GameMasterPage.tsx` (mapa de `inactiveRows`), `client/src/components/combat/CombatCard/CombatCard.tsx`

- [ ] **Step 1: Tipos** — `PartyCharacter` ganha `temporaryHp?: number; temporaryMp?: number; damageReductions?: DamageReduction[]`. `CombatPlayer` e `CombatRow` ganham `temporaryHp?: number; damageReductions?: DamageReduction[]`.

- [ ] **Step 2: Propagar** — onde `CombatContext` monta `CombatPlayer` a partir de `PartyCharacter` (`grep -n "maxHp:" client/src/contexts/CombatContext.tsx`), acrescentar `temporaryHp: c.temporaryHp ?? 0, damageReductions: c.damageReductions ?? []`. Em `buildCombatRows` (`utils/combatRows.ts`) e no mapa de `inactiveRows` da `GameMasterPage`, copiar `temporaryHp` e `damageReductions` para a row. No handler `character_hp_sync` do `CombatContext`, aplicar `temporaryHp` quando vier número (e considerá-lo em `changed`).

- [ ] **Step 3: `applyHpChange` (jogador) usa as funções puras**

```ts
      if (rowType === 'player') {
        const loaded = await apiLoadCharacter(characterId);
        if (!loaded) return;
        const character = normalizeVitals({
          ...loaded,
          buffs: normalizeBuffs(loaded.buffs),
          damageReductions: normalizeDamageReductions(loaded.damageReductions, loaded.damageReduction),
        });
        const next = delta < 0 ? applyDamage(character, -delta, 'hp') : applyHeal(character, delta, 'hp');
        await apiSaveCharacter(characterId, next);
        send({ type: 'master_hp_update', characterId, name: next.name, currentHp: next.hp.current, temporaryHp: next.temporaryHp });
        setPlayers((prev) => {
          const list = prev.map((p) => (p._id === characterId ? { ...p, currentHp: next.hp.current, temporaryHp: next.temporaryHp } : p));
          queueMicrotask(() => { if (combatDataRef.current.ordered) buildOrdered(combatDataRef.current, list); });
          return list;
        });
      }
```

(imports de `normalizeBuffs`, `normalizeDamageReductions` em `utils/calculations` e `applyDamage`, `applyHeal`, `normalizeVitals` em `utils/vitals`).

- [ ] **Step 4: `CombatCard`** — `const tempHp = row.temporaryHp || 0;` e nas duas legendas da barra de PV: `{showEnemyBars ? `${currentHp}${tempHp > 0 ? ` (+${tempHp})` : ''} / ${maxHp}` : ''}`.

- [ ] **Step 5: Tipagem + testes** — `npx --prefix client tsc -b client && npm --prefix client run test` → PASS. Teste manual: mestre aplica −3 num jogador com temp 5 → temp cai para 2, PV igual; jogador vê o toast e a barra.

- [ ] **Step 6: Commit** — `git commit -am "feat(mestre): dano/cura do mestre usa o modelo de sobrevida e mostra PV temporário"`

---

### Task 6: RD — `applicableRds`, `reduceDamage`, `computeDamageTaken` (H5.1 núcleo)

**Files:**
- Modify: `client/src/utils/vitals.ts`, `client/src/utils/vitals.test.ts`

**Interfaces:**
- Produces:
  - `isGeneralRd(rd: DamageReduction): boolean` — nome vazio ou "Geral" (sem acento/caixa)
  - `applicableRds(rds: DamageReduction[], damageType?: string): boolean[]` — pré-seleção: Geral sempre; RD cujo nome contém o tipo como palavra; RD com valor ≤ 0 nunca
  - `reduceDamage(amount: number, rds: DamageReduction[]): { rdTotal: number; net: number }` — **soma** as RDs
  - `interface DamageTakenInput { amount: number; damageType?: string; selected: boolean[]; ignoreRd?: boolean }`
  - `computeDamageTaken(c: Character, input): { gross; rdApplied: DamageReduction[]; rdTotal; net; split: DamageSplit; character: Character }`

- [ ] **Step 1: Testes**

```ts
import { applicableRds, reduceDamage, computeDamageTaken } from './vitals';

describe('applicableRds', () => {
  const rds = [{ name: 'Geral', value: 5 }, { name: 'fogo', value: 2 }, { name: 'Frio e Ácido', value: 3 }, { name: 'corte', value: 0 }];
  it('liga Geral sempre e a RD do tipo escolhido (sem acento/caixa, como palavra)', () => {
    expect(applicableRds(rds, 'Fogo')).toEqual([true, true, false, false]);
    expect(applicableRds(rds, 'Ácido')).toEqual([true, false, true, false]);
  });
  it('sem tipo, só Geral', () => {
    expect(applicableRds(rds, undefined)).toEqual([true, false, false, false]);
  });
  it('nome vazio conta como Geral; valor zero nunca liga', () => {
    expect(applicableRds([{ name: '', value: 4 }, { name: 'Geral', value: 0 }], 'fogo')).toEqual([true, false]);
  });
});

describe('reduceDamage', () => {
  it('soma as RDs e nunca fica negativo', () => {
    expect(reduceDamage(12, [{ name: 'Geral', value: 5 }, { name: 'fogo', value: 2 }])).toEqual({ rdTotal: 7, net: 5 });
    expect(reduceDamage(3, [{ name: 'Geral', value: 5 }])).toEqual({ rdTotal: 5, net: 0 });
  });
});

describe('computeDamageTaken', () => {
  const c = char({ damageReductions: [{ name: 'Geral', value: 5 }, { name: 'fogo', value: 2 }] }); // hp 20/30, temp 5
  it('aplica as RDs selecionadas, consome temporário primeiro e devolve o personagem', () => {
    const r = computeDamageTaken(c, { amount: 12, damageType: 'fogo', selected: [true, true] });
    expect(r).toMatchObject({ gross: 12, rdTotal: 7, net: 5, split: { fromTemp: 5, fromCurrent: 0 } });
    expect(r.character.temporaryHp).toBe(0);
    expect(r.character.hp.current).toBe(20);
  });
  it('ignoreRd zera a redução; RD não selecionada não conta', () => {
    expect(computeDamageTaken(c, { amount: 12, selected: [true, true], ignoreRd: true }).net).toBe(12);
    expect(computeDamageTaken(c, { amount: 12, selected: [true, false] }).net).toBe(7);
  });
  it('dano menor que a RD dá líquido 0 e não muda nada', () => {
    const r = computeDamageTaken(c, { amount: 4, selected: [true, false] });
    expect(r.net).toBe(0);
    expect(r.character.hp.current).toBe(20);
    expect(r.character.temporaryHp).toBe(5);
  });
});
```

- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar** (acrescentar em `vitals.ts`; `import type { DamageReduction }` e `normalizeSearch` de `./formatters`):

```ts
export function isGeneralRd(rd: DamageReduction): boolean {
  const key = normalizeSearch(rd.name ?? '');
  return key === '' || key === 'geral';
}

/** Pré-seleção das RDs para um tipo de dano: Geral sempre; RD cujo nome contém o tipo como
 * palavra ("Frio e Ácido" casa "Ácido"); RD com valor ≤ 0 nunca. O jogador pode ligar/desligar depois. */
export function applicableRds(rds: DamageReduction[], damageType?: string): boolean[] {
  const type = normalizeSearch(damageType ?? '');
  return rds.map((rd) => {
    if ((Number(rd.value) || 0) <= 0) return false;
    if (isGeneralRd(rd)) return true;
    if (!type) return false;
    const words = normalizeSearch(rd.name).split(/[^a-z0-9]+/).filter(Boolean);
    return words.includes(type);
  });
}

/** Decisão da mesa (26/08): RDs SOMAM (o T20 oficial usaria só a maior). */
export function reduceDamage(amount: number, rds: DamageReduction[]): { rdTotal: number; net: number } {
  const rdTotal = rds.reduce((sum, rd) => sum + Math.max(0, Number(rd.value) || 0), 0);
  return { rdTotal, net: Math.max(0, positive(amount) - rdTotal) };
}

export interface DamageTakenInput {
  amount: number;
  damageType?: string;
  /** Uma flag por entrada de `character.damageReductions`, na mesma ordem. */
  selected: boolean[];
  ignoreRd?: boolean;
}

export interface DamageTakenResult {
  gross: number;
  rdApplied: DamageReduction[];
  rdTotal: number;
  net: number;
  split: DamageSplit;
  character: Character;
}

export function computeDamageTaken(c: Character, input: DamageTakenInput): DamageTakenResult {
  const rds = c.damageReductions ?? [];
  const rdApplied = input.ignoreRd ? [] : rds.filter((_, i) => input.selected[i]);
  const { rdTotal, net } = reduceDamage(input.amount, rdApplied);
  const { state, split } = damageVital(getVital(c, 'hp'), net);
  return { gross: positive(input.amount), rdApplied, rdTotal, net, split, character: setVital(c, 'hp', state) };
}
```

- [ ] **Step 4: Rodar** → PASS. **Step 5: Commit** — `git commit -am "feat(vitais): cálculo de dano recebido com RDs (somadas) e prévia"`

---

### Task 7: `TakeDamageSheet` + botão na `VitalBar` + log (H5.1 UI)

**Files:**
- Create: `client/src/components/sheet/TakeDamageSheet/TakeDamageSheet.tsx`, `TakeDamageSheet.module.css`
- Modify: `client/src/components/sheet/VitalBar/VitalBar.tsx`, `client/src/data/constants.ts` (`LOG_ICONS`), `client/src/components/sheet/LogsSheet/LogsSheet.tsx`

- [ ] **Step 1: Componente**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { DAMAGE_TYPES } from '../../../data/constants';
import { applicableRds, computeDamageTaken } from '../../../utils/vitals';
import { showToast } from '../../../services/toastService';
import Sheet from '../../ui/Sheet/Sheet';
import Switch from '../../ui/Switch/Switch';
import styles from './TakeDamageSheet.module.css';

interface TakeDamageSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Tomar dano": valor + tipo → RDs pré-selecionadas (Geral sempre; a do tipo) → prévia
 * "12 − RD 7 (Geral 5 + Fogo 2) = 5 → 3 do temporário, 2 do PV" → aplica, loga e avisa o grupo.
 * Regra da mesa: RDs somam. Toda a conta é `computeDamageTaken` (utils/vitals.ts).
 */
function TakeDamageSheet({ open, onClose }: TakeDamageSheetProps) {
  const { character, updateCharacter, sendHpUpdate } = useCharacterContext();
  const [draft, setDraft] = useState('');
  const [damageType, setDamageType] = useState('');
  const [selected, setSelected] = useState<boolean[]>([]);
  const [ignoreRd, setIgnoreRd] = useState(false);

  const rds = character?.damageReductions ?? [];

  useEffect(() => {
    if (!open) return;
    setDraft('');
    setDamageType('');
    setIgnoreRd(false);
    setSelected(applicableRds(rds, undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!character) return null;

  const amount = Number(draft);
  const valid = draft.trim() !== '' && Number.isFinite(amount) && amount > 0;

  const pickType = (type: string) => {
    const next = type === damageType ? '' : type;
    setDamageType(next);
    setSelected(applicableRds(rds, next || undefined));
  };
  const toggleRd = (i: number) => setSelected((prev) => prev.map((on, idx) => (idx === i ? !on : on)));

  const input = { amount, damageType: damageType || undefined, selected, ignoreRd };
  const preview = valid ? computeDamageTaken(character, input) : null;

  const confirm = () => {
    if (!preview) return;
    updateCharacter((f) => {
      const r = computeDamageTaken(f, input);
      return {
        ...r.character,
        logs: [...f.logs, {
          type: 'damage',
          name: 'Dano recebido',
          mpSpent: 0,
          timestamp: Date.now(),
          details: {
            amount: r.gross,
            damageType: damageType || undefined,
            rdApplied: r.rdApplied.map((rd) => `${rd.name} ${rd.value}`),
            rdTotal: r.rdTotal,
            net: r.net,
            fromTemp: r.split.fromTemp,
            fromCurrent: r.split.fromCurrent,
          },
        }],
      };
    });
    setTimeout(sendHpUpdate, 50);
    showToast(
      `−${preview.net} PV${preview.split.fromTemp > 0 ? ` (${preview.split.fromTemp} do temporário)` : ''}`,
      'default',
    );
    onClose();
  };

  const footer = (
    <>
      <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
      <button type="button" className={styles.btnConfirm} onClick={confirm} disabled={!preview}>💥 Aplicar</button>
    </>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Tomar dano" footer={footer}>
      <label className={styles.label} htmlFor="take-damage-amount">Dano</label>
      <input
        id="take-damage-amount"
        className={styles.amount}
        type="text"
        inputMode="numeric"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirm(); } }}
        placeholder="0"
      />

      <div className={styles.label}>Tipo</div>
      <div className={styles.chips}>
        {DAMAGE_TYPES.map((t) => (
          <button key={t} type="button" className={`${styles.chip} ${damageType === t ? styles.chipOn : ''}`} aria-pressed={damageType === t} onClick={() => pickType(t)}>{t}</button>
        ))}
      </div>

      {rds.length > 0 && (
        <>
          <div className={styles.rdHead}>
            <span className={styles.label}>Redução de dano</span>
            <label className={styles.ignore}><Switch checked={ignoreRd} onChange={setIgnoreRd} /> Ignora RD</label>
          </div>
          <div className={styles.chips}>
            {rds.map((rd, i) => (
              <button key={i} type="button" disabled={ignoreRd} className={`${styles.chip} ${selected[i] && !ignoreRd ? styles.chipOn : ''}`} aria-pressed={selected[i]} onClick={() => toggleRd(i)}>
                {rd.name || 'Geral'} {rd.value}
              </button>
            ))}
          </div>
        </>
      )}

      <div className={styles.preview}>
        {preview ? (
          <>
            <b>{preview.gross}</b>
            {preview.rdTotal > 0 && <> − RD {preview.rdTotal} ({preview.rdApplied.map((rd) => `${rd.name || 'Geral'} ${rd.value}`).join(' + ')})</>}
            {' = '}<b>{preview.net}</b>
            {preview.net > 0 && (
              <span className={styles.split}>
                {preview.split.fromTemp > 0 && ` · ${preview.split.fromTemp} do PV temporário`}
                {preview.split.fromCurrent > 0 && ` · ${preview.split.fromCurrent} do PV`}
              </span>
            )}
          </>
        ) : (
          <span className={styles.hint}>Digite o dano recebido.</span>
        )}
      </div>
    </Sheet>
  );
}

TakeDamageSheet.displayName = 'TakeDamageSheet';
export default TakeDamageSheet;
```

CSS (`TakeDamageSheet.module.css`): `.label` (10px uppercase, `var(--ink-3)`), `.amount` (input largo, `font-family: var(--font-display)`, 28px, `background: var(--surface-2)`, `border: 1px solid var(--line-2)`), `.chips` (flex wrap gap 6px), `.chip`/`.chipOn` (pílula; ligada usa `var(--accent-soft)` + `var(--accent-ink)`), `.rdHead` (flex space-between), `.ignore` (flex gap 6px, 12px), `.preview` (`margin-top: 14px; padding: 10px 12px; border-radius: 10px; background: var(--surface-2); font-size: 14px`), `.split`, `.hint` (`var(--ink-3)`), `.btnCancel`/`.btnConfirm` copiados de `CastActionSheet.module.css`.

- [ ] **Step 2: Botão na `VitalBar`** — estado `const [damageOpen, setDamageOpen] = useState(false);`; no popover de PV, antes de "Curar tudo": `<button type="button" className={styles.healAllBtn} onClick={() => { setOpenPop(null); setDamageOpen(true); }}>💥 Tomar dano</button>`; no fim do JSX: `<TakeDamageSheet open={damageOpen} onClose={() => setDamageOpen(false)} />`.

- [ ] **Step 3: Log** — `LOG_ICONS` ganha `damage: '💥', rest: '🌅'`. Em `LogsSheet.formatDetails`, antes do bloco genérico:

```ts
    if (d.net != null) {
      const parts = [`Dano ${d.amount}${d.damageType ? ` de ${String(d.damageType).toLowerCase()}` : ''}`];
      if (Number(d.rdTotal) > 0) parts.push(`RD ${d.rdTotal}`);
      parts.push(`Líquido ${d.net}`);
      if (Number(d.fromTemp) > 0) parts.push(`${d.fromTemp} do temporário`);
      return parts.join(' · ');
    }
```

e `typeClass`: `damage` → `styles.typeAttack`, `rest` → `styles.typeBuffOn`.

- [ ] **Step 4: Tipagem + testes + manual** — `tsc`, `vitest`; na ficha: 12 de fogo com RD Geral 5 + fogo 2 e temp 3 → prévia `12 − RD 7 (Geral 5 + fogo 2) = 5 · 3 do PV temporário · 2 do PV`; Enter aplica; histórico mostra a linha; undo reverte.

- [ ] **Step 5: Commit** — `git add -A client/src && git commit -m "feat(vitais): botão 'Tomar dano' com tipo, RDs somadas, prévia e histórico"`

---

### Task 8: "Desligar todos" e "Limpar desligados" (H1.1)

**Files:**
- Modify: `client/src/utils/calculations.ts` (ao lado de `toggleBuffState`), `calculations.test.ts`
- Modify: `client/src/components/sheet/BuffsDrawer/BuffsDrawer.tsx`, `BuffsDrawer.module.css`

- [ ] **Step 1: Testes**

```ts
describe('deactivateAllBuffs / removeInactiveBuffs', () => {
  it('desliga todos os ativos devolvendo o temporário de cada um, sem devolver PM', () => {
    const c = baseCharacter({
      mp: { max: 10, current: 4 }, temporaryHp: 12, temporaryMp: 0,
      buffs: [
        activeBuff({ name: 'A', mp: 2, effects: [{ type: 'temp_hp', value: '10' }] }),
        activeBuff({ name: 'B', effects: [{ type: 'attack_roll', value: '2' }] }),
        activeBuff({ name: 'C', active: false, effects: [{ type: 'temp_hp', value: '2' }] }),
      ],
    });
    const next = deactivateAllBuffs(c);
    expect(next.buffs.map((b) => b.active)).toEqual([false, false, false]);
    expect(next.temporaryHp).toBe(2);
    expect(next.mp.current).toBe(4);
  });
  it('removeInactiveBuffs apaga só os desligados', () => {
    const c = baseCharacter({ buffs: [activeBuff({ name: 'on' }), activeBuff({ name: 'off', active: false })] });
    expect(removeInactiveBuffs(c).buffs.map((b) => b.name)).toEqual(['on']);
  });
});
```

- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar**

```ts
/** Desliga todo buff ativo (H1.1) — reaproveita a aritmética de `toggleBuffState`, então o
 * temporário concedido por cada um é devolvido e o PM gasto NÃO volta (igual ao toggle). */
export function deactivateAllBuffs(character: Character): Character {
  return (character.buffs ?? []).reduce(
    (acc, b, i) => (b.active ? toggleBuffState(acc, i) : acc),
    character,
  );
}

export function removeInactiveBuffs(character: Character): Character {
  return { ...character, buffs: (character.buffs ?? []).filter((b) => b.active) };
}
```

- [ ] **Step 4: `BuffsDrawer`** — rodapé vira um grupo:

```tsx
  const activeCount = buffs.filter((b) => b.active).length;
  const inactiveCount = buffs.length - activeCount;
  const [confirmClear, setConfirmClear] = useState(false);
  const footer = !readOnly ? (
    <div className={styles.footerGroup}>
      <div className={styles.footerRow}>
        <button type="button" className={styles.btnGhost} disabled={activeCount === 0}
          onClick={() => updateCharacter((f) => deactivateAllBuffs(f))}>
          Desligar todos{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
        <button type="button" className={styles.btnGhost} disabled={inactiveCount === 0}
          onClick={() => (inactiveCount > 3 ? setConfirmClear(true) : updateCharacter((f) => removeInactiveBuffs(f)))}>
          Limpar desligados{inactiveCount > 0 ? ` (${inactiveCount})` : ''}
        </button>
      </div>
      <button type="button" className={styles.btnAdd} onClick={() => openAfterClose(() => setShowPicker(true))}>+ Buff</button>
    </div>
  ) : undefined;
  // …e um <ConfirmModal open={confirmClear} onClose={() => setConfirmClear(false)}
  //   onConfirm={() => updateCharacter((f) => removeInactiveBuffs(f))}
  //   title="Limpar buffs desligados?" message={`${inactiveCount} buffs serão removidos da lista.`} confirmLabel="Limpar" />
```

CSS: `.footerGroup { display: flex; flex-direction: column; gap: 8px; width: 100%; }`, `.footerRow { display: flex; gap: 8px; }`, `.btnGhost { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid var(--line-2); background: var(--surface-2); color: var(--ink-2); font: inherit; font-weight: 700; font-size: 12.5px; cursor: pointer; } .btnGhost:disabled { opacity: .45; cursor: default; }`.

- [ ] **Step 5: Rodar + manual** (undo reverte "Desligar todos"). **Step 6: Commit** — `git commit -am "feat(buffs): desligar todos e limpar desligados no drawer de buffs"`

---

### Task 9: "Novo dia" (H1.2)

**Files:**
- Modify: `client/src/utils/vitals.ts`, `vitals.test.ts`
- Modify: `client/src/components/sheet/VitalBar/VitalBar.tsx`

**Interfaces:**
- Produces: `newDay(c: Character): Character`; `describeNewDay(c): { buffsOff: number; tempHp: number; tempMp: number; healHp: number; healMp: number }`

- [ ] **Step 1: Testes**

```ts
describe('newDay', () => {
  it('desliga todos os buffs, zera temporários (inclusive digitados) e cura PV/PM ao máximo efetivo', () => {
    const c = char({
      hp: { max: 30, current: 9 }, mp: { max: 10, current: 1 }, temporaryHp: 7, temporaryMp: 3,
      buffs: [{ name: 'A', effects: [{ type: 'temp_hp', value: '4' }], mp: 0, active: true }],
      abilities: [{ name: 'Vigor', source: '', type: '', mpCost: 0, description: '', alwaysActive: true, buffs: [{ type: 'max_hp', value: '10' }] }],
    });
    const d = newDay(c);
    expect(d.buffs[0].active).toBe(false);
    expect(d.temporaryHp).toBe(0);
    expect(d.temporaryMp).toBe(0);
    expect(d.hp.current).toBe(40);
    expect(d.mp.current).toBe(10);
  });
  it('describeNewDay resume o que vai acontecer', () => {
    const c = char({ hp: { max: 30, current: 9 }, mp: { max: 10, current: 1 }, temporaryHp: 7, temporaryMp: 0,
      buffs: [{ name: 'A', effects: [], mp: 0, active: true }, { name: 'B', effects: [], mp: 0, active: false }] });
    expect(describeNewDay(c)).toEqual({ buffsOff: 1, tempHp: 7, tempMp: 0, healHp: 21, healMp: 9 });
  });
});
```

- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** (em `vitals.ts`, importando `deactivateAllBuffs` de `./calculations`):

```ts
/** Decisão da mesa (26/08): "Novo dia" = todos os buffs desligados, temporários zerados,
 * PV e PM no máximo efetivo. Sem tabela de descanso. */
export function newDay(c: Character): Character {
  const off = deactivateAllBuffs(c);
  const zeroed = setVital(setVital(off, 'hp', { ...getVital(off, 'hp'), temp: 0 }), 'mp', { ...getVital(off, 'mp'), temp: 0 });
  return applyHeal(applyHeal(zeroed, Infinity, 'hp'), Infinity, 'mp');
}

export function describeNewDay(c: Character) {
  const hp = getVital(c, 'hp');
  const mp = getVital(c, 'mp');
  return {
    buffsOff: (c.buffs ?? []).filter((b) => b.active).length,
    tempHp: hp.temp,
    tempMp: mp.temp,
    healHp: Math.max(0, hp.max - hp.current),
    healMp: Math.max(0, mp.max - mp.current),
  };
}
```

- [ ] **Step 4: `VitalBar`** — item de menu `🌅 Novo dia` (após "Efeitos Temporários"), estado `newDayOpen`, e:

```tsx
      <ConfirmModal
        open={newDayOpen}
        onClose={() => setNewDayOpen(false)}
        icon="🌅"
        title="Novo dia"
        message={(() => { const d = describeNewDay(character); return `${d.buffsOff} buff(s) desligado(s) · PV temporário ${d.tempHp} e PM temporário ${d.tempMp} zerados · PV +${d.healHp}, PM +${d.healMp} (ao máximo).`; })()}
        confirmLabel="Virar o dia"
        onConfirm={() => {
          updateCharacter((f) => {
            const d = describeNewDay(f);
            return { ...newDay(f), logs: [...f.logs, { type: 'rest', name: 'Novo dia', mpSpent: 0, timestamp: Date.now(),
              details: `${d.buffsOff} buffs desligados · temp PV ${d.tempHp} / PM ${d.tempMp} zerados · PV +${d.healHp} · PM +${d.healMp}` }] };
          });
          setTimeout(sendHpUpdate, 50);
        }}
      />
```

- [ ] **Step 5: Rodar + manual** (undo reverte). **Step 6: Commit** — `git commit -am "feat(vitais): 'Novo dia' cura tudo, zera temporários e desliga todos os buffs"`

---

### Task 10: Usos por dia em poderes (H1.3)

**Files:**
- Modify: `client/src/types/character.ts` (`Ability`), `client/src/components/sheet/SheetForm/entityForms.ts` (`abilityFields`, `abilidadeConfig`), `client/src/components/sheet/AbilityCard/AbilityCard.tsx` (+ css), `client/src/components/sheet/CastActionSheet/CastActionSheet.tsx`, `client/src/components/sheet/PoderesPanel/PoderesPanel.tsx`, `client/src/components/sheet/AcoesPanel/AcoesPanel.tsx`, `client/src/utils/vitals.ts` (+ test)

**Interfaces:**
- `Ability.usesPerDay?: number` (0/ausente = ilimitado), `Ability.usesLeft?: number`
- `CastActionSpec.sourceAbilityIndex?: number` — quando presente, `finish()` decrementa `usesLeft` desse poder
- `newDay` também restaura `usesLeft = usesPerDay`

- [ ] **Step 1: Teste** (em `vitals.test.ts`):

```ts
  it('newDay renova os usos por dia dos poderes', () => {
    const c = char({ abilities: [
      { name: 'Golpe', source: '', type: '', mpCost: 0, description: '', usesPerDay: 3, usesLeft: 0 },
      { name: 'Sem limite', source: '', type: '', mpCost: 0, description: '' },
    ] });
    const d = newDay(c);
    expect(d.abilities[0].usesLeft).toBe(3);
    expect(d.abilities[1].usesLeft).toBeUndefined();
  });
```

- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar**
- Tipos: em `Ability`, após `favorite?`: `usesPerDay?: number; usesLeft?: number;` com doc.
- `newDay`: antes do `return`, `const renewed = { ...zeroed, abilities: (zeroed.abilities ?? []).map((a) => (a.usesPerDay ? { ...a, usesLeft: a.usesPerDay } : a)) };` e curar a partir de `renewed`.
- `abilityFields`: após `mpCost`: `{ key: 'usesPerDay', label: 'Usos por dia (0 = ilimitado)', type: 'number', half: true }`. `empty()` ganha `usesPerDay: 0`; `fromEntry` `usesPerDay: a.usesPerDay ?? 0`; `apply`: `usesPerDay: n(v.usesPerDay) || undefined, usesLeft: n(v.usesPerDay) ? Math.min((base as Ability).usesLeft ?? n(v.usesPerDay), n(v.usesPerDay)) : undefined`.
- `AbilityCard`: `const uses = ability.usesPerDay ? { left: ability.usesLeft ?? ability.usesPerDay, max: ability.usesPerDay } : null;` na `metaRow`: `{uses && <span className={styles.uses}>{uses.left}/{uses.max} usos</span>}`; botão Usar: `disabled={!!uses && uses.left <= 0}` e `title={uses && uses.left <= 0 ? 'Sem usos hoje' : undefined}`. CSS `.uses { color: var(--accent-ink); font-weight: 700; }`.
- `CastActionSpec` ganha `sourceAbilityIndex?: number`; em `finish()`: `abilities: activeAction.sourceAbilityIndex == null ? f.abilities : f.abilities.map((a, i) => i === activeAction.sourceAbilityIndex && a.usesPerDay ? { ...a, usesLeft: Math.max(0, (a.usesLeft ?? a.usesPerDay) - 1) } : a)`.
- `PoderesPanel.handleUse` e `AcoesPanel.castAbility` passam `sourceAbilityIndex: index`.

- [ ] **Step 4: Rodar + tipagem + manual** (poder 2/2 → usar → 1/2 → 0/2 desabilita → Novo dia → 2/2). **Step 5: Commit** — `git commit -am "feat(poderes): usos por dia com contador no card, consumo ao usar e renovação no novo dia"`

---

### Task 11: Mestre aplica dano com as RDs do jogador (H5.2)

**Files:**
- Modify: `client/src/components/combat/DamagePopover/DamagePopover.tsx` (+ css), `client/src/components/combat/CombatCard/CombatCard.tsx`

**Interfaces:**
- `DamagePopover` ganha props opcionais `damageReductions?: DamageReduction[]`, `temporaryHp?: number`, `currentHp?: number`. Com RDs, mostra chips de tipo e de RD (pré-seleção por `applicableRds`) e a prévia via `reduceDamage` + `damageVital`; "− Dano" aplica `-net`.

- [ ] **Step 1: Implementar no `DamagePopover`**

```tsx
  const rds = damageReductions ?? [];
  const [damageType, setDamageType] = useState('');
  const [selected, setSelected] = useState<boolean[]>(() => applicableRds(rds, undefined));
  const pickType = (t: string) => { const next = t === damageType ? '' : t; setDamageType(next); setSelected(applicableRds(rds, next || undefined)); };
  const gross = parseAmount();
  const { rdTotal, net } = reduceDamage(gross, rds.filter((_, i) => selected[i]));
  const split = damageVital({ current: currentHp ?? 0, max: Number.MAX_SAFE_INTEGER, temp: temporaryHp ?? 0 }, net).split;
  const applyDamage = () => onApply(-net);
```

JSX: abaixo do input, quando `rds.length > 0`: chips de `DAMAGE_TYPES` (compactos) + chips de RD ligáveis + linha `gross − RD rdTotal = net · fromTemp do temporário`. A largura do popover (`popW`) sobe para 280 quando há RDs. A cura (`+ Cura`) continua `onApply(parseAmount())`.

- [ ] **Step 2: `CombatCard`** passa `damageReductions={row.damageReductions} temporaryHp={row.temporaryHp} currentHp={row.currentHp}` para jogadores (`row.type === 'player'`).

- [ ] **Step 3: Tipagem + manual** (jogador com RD Geral 5: mestre digita 12 → prévia 7 → aplica → jogador recebe toast e barra). **Step 4: Commit** — `git commit -am "feat(mestre): dano no jogador desconta as RDs dele e consome o PV temporário primeiro"`

---

### Task 12: (Opcional, P3) Duração do buff + "Fim de cena" (H1.4)

**Files:**
- Modify: `client/src/types/character.ts` (`Buff.duration`), `client/src/utils/castAction.ts` (+ test), `client/src/components/sheet/CastActionSheet/CastActionSheet.tsx`, `MagiasPanel.tsx`, `AcoesPanel.tsx`, `SheetForm/entityForms.ts` (`buffFields`/`buffConfig`), `BuffsDrawer.tsx`, `client/src/utils/vitals.ts` (`endScene`, `newDay` poupa `'permanente'`), `VitalBar.tsx` (menu "⏱ Fim de cena")

- [ ] **Step 1: Testes** (`castAction.test.ts`):

```ts
describe('normalizeBuffDuration', () => {
  it.each([
    ['cena', 'cena'], ['sustentada', 'cena'], ['1 rodada', 'cena'], ['cena, até ser descarregada', 'cena'],
    ['1 dia', 'dia'], ['permanente', 'permanente'], ['permanente até ser descarregada', 'permanente'],
    ['instantânea', 'cena'], ['veja texto', 'cena'], [undefined, 'cena'],
  ])('%s → %s', (input, expected) => expect(normalizeBuffDuration(input)).toBe(expected));
});
```

- [ ] **Step 2: Implementar**
- `export type BuffDuration = 'cena' | 'dia' | 'permanente'; Buff.duration?: BuffDuration`.
- `normalizeBuffDuration(text?: string): BuffDuration` — `const t = normalizeSearch(text ?? ''); if (t.startsWith('permanente')) return 'permanente'; if (/\bdia\b/.test(t) && !t.startsWith('cena')) return 'dia'; return 'cena';`
- `CastActionSpec.duration?: string`; `MagiasPanel`/`AcoesPanel` passam `duration: sp.duration`; `buffPayload` ganha `duration: normalizeBuffDuration(activeAction.duration)`.
- `buffFields`: select "Duração" (`cena`/`dia`/`permanente`, padrão `cena`); `buffConfig` lê/grava. `BuffsDrawer` mostra `buff.duration` na linha de metadados.
- `endScene(c)`: desliga buffs com `(b.duration ?? 'cena') === 'cena'` (via `toggleBuffState` por índice) e zera temporários. `newDay` passa a poupar `'permanente'` (usar `deactivateBuffsWhere(c, (b) => b.duration !== 'permanente')` — generalizar `deactivateAllBuffs` com um predicado opcional).
- Menu da `VitalBar`: "⏱ Fim de cena" com `ConfirmModal` e log `rest`.

- [ ] **Step 3: Rodar + commit** — `git commit -am "feat(buffs): duração (cena/dia/permanente) propagada da magia e ação 'Fim de cena'"`

---

## Self-review

- **Cobertura:** H4.1 → T1–T3 (invariante, `applyDamage/applyHeal/normalizeVitals`, `applyBuffToCharacter`, Stepper −/+ como dano/cura, digitar clampa, Curar tudo, campo Temporário editável); H4.2 → T3 (segmento hachurado após o máximo, dica no popover com origem, tokens de tema); H4.3 → T4–T5 (buffMerge + testes, websocket com temp nos dois sentidos, `applyHpChange` no máximo efetivo, DTO e legenda do mestre); H5.1 → T6–T7 (chips de tipo, pré-seleção Geral+tipo, soma, ignora RD, prévia com split, log `damage`, toast, Enter/Esc, undo, funciona sem RD); H5.2 → T11; H1.1 → T8; H1.2 → T9; H1.3 → T10; H1.4 → T12.
- **Placeholders:** CSS de `TakeDamageSheet` descrito por classe com valores; `DamagePopover` com código do estado e regra de largura. Nenhum "TBD".
- **Consistência:** `VitalPool`, `getVital/setVital`, `applyDamage/applyHeal/normalizeVitals`, `computeDamageTaken({ amount, damageType, selected, ignoreRd })`, `deactivateAllBuffs/removeInactiveBuffs`, `newDay/describeNewDay`, `sourceAbilityIndex` — mesmos nomes em todas as tarefas.
