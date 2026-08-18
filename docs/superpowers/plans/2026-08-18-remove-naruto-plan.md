# Remoção completa do sistema Naruto d20 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover por completo o suporte a Naruto d20 do ArcanaForge (client + server), mantendo só Tormenta 20, sem tocar nos dados já existentes no MongoDB.

**Architecture:** Duas camadas de mudança: (1) apagar todo arquivo dedicado a Naruto (rotas, controllers, services, repositories, models, páginas, componentes, dados); (2) editar cada arquivo compartilhado que hoje ramifica em `system === 'naruto'` pra remover só essa ramificação, preservando o caminho Tormenta byte a byte. Nenhuma migração de banco — os documentos `system: 'naruto'` continuam no Mongo, só sem UI/API para servi-los.

**Tech Stack:** Node 22 / Express 4 (CommonJS) no server; React 19 + TypeScript + Vite no client. Sem framework de teste no projeto — verificação é `tsc -b --force` + `node -e "require(...)"` para módulos server + teste manual no navegador (padrão já estabelecido no projeto).

**Spec:** `docs/superpowers/specs/2026-08-18-remove-naruto-design.md`

## Global Constraints

- Nenhum script de migração/limpeza roda contra o MongoDB. Documentos com `system: 'naruto'` não são lidos, escritos ou apagados por nenhuma mudança deste plano.
- Nenhuma rota nova é criada para tratar `/naruto/*` — o catch-all `path="*"` que já existe em `client/src/App.tsx` cobre essas URLs.
- `client/src/types/character.ts` → `RPGSystem` vira união de um valor só (`'tormenta'`), nunca é eliminado como conceito — outros arquivos que dependem desse tipo (`data/constants.ts`, `SelectGrid.tsx`, `PartySelectPage.tsx`) continuam compilando sem edição adicional além da já prevista.
- `design-mockups/PLANO-DETALHADO.md`, `PLANO-IMPLEMENTACAO.md` e `naruto_pdf_text.txt` na raiz do repo **não são tocados** — são registro histórico, fora de escopo.
- Depois de cada task: rodar a verificação descrita nela antes de seguir pra próxima.

## Desvios do spec encontrados durante a leitura do código

A leitura exata dos arquivos antes de escrever este plano corrigiu duas suposições do spec original:

1. **`server/src/dto/character.dto.js` não precisa de edição funcional.** O spec supunha um enum de `system` validado ali; na prática esse arquivo só tem comentários mencionando "Naruto SNS" (linhas 4, 11, 60) — a validação de sistema real vive em `server/src/services/party.service.js` (`VALID_SYSTEMS`) e no schema de `server/db/models/Party.js`. `server/db/models/Character.js:8` também não tem enum (`system: { type: String, default: 'tormenta' }`, schema `strict:false`). Não há task pra `character.dto.js` neste plano — os comentários stale ali são inofensivos e ficam de fora por não estarem no escopo de "remover código", só de "atualizar comentário".
2. **Só `ViewCharacterPage.tsx` precisa da guarda de "sistema não suportado".** O spec previa a guarda em `GameMasterPage`, `PartyMembersPage` e `ViewCharacterPage`. Na leitura do código, `GameMasterPage`/`PartyMembersPage` não têm nenhuma ramificação por sistema além de repassar `systemBrand` pro `Topbar` (só o logo ao lado do título) — o combat tracker e a lista de membros já são agnósticos de sistema (`CombatRow`/`CombatCard` funcionam com qualquer `classes`/`hp`/`mp`). Só `ViewCharacterPage` renderiza conteúdo *estruturalmente* diferente por sistema (`TormentaSheetBody` vs. seções inteiras de Naruto), então é o único lugar onde "renderizar Tormenta sobre dado de Naruto" seria um problema real.

---

## File Structure

**Server — apagar:**
- `server/src/routes/naruto.routes.js`
- `server/src/controllers/naruto.controller.js`
- `server/src/services/naruto.service.js`
- `server/src/repositories/naruto.repository.js`
- `server/src/dto/naruto.dto.js`
- `server/db/models/NarutoClan.js`
- `server/db/models/NarutoTechTemplate.js`
- `server/db/migrateNarutoClans.js`
- `server/db/migrateNarutoTechTemplates.js`

**Server — editar:**
- `server/index.js` (remove chamadas de migração de Naruto no boot)
- `server/src/routes/index.js` (remove mount da rota)
- `server/src/services/party.service.js` (remove `'naruto'` de `VALID_SYSTEMS`)
- `server/db/models/Party.js` (remove `'naruto'` do enum de `system`)

**Client — apagar:**
- `client/src/features/naruto/` (pasta inteira)
- `client/src/pages/NarutoSheetPage/`
- `client/src/pages/NarutoViewPage/`
- `client/src/types/narutoCharacter.ts`
- `client/src/api/naruto.ts`
- `client/src/components/ui/SystemFilter/`

**Client — editar:**
- `client/src/App.tsx`
- `client/src/api/index.ts`
- `client/src/data/constants.ts`
- `client/src/types/character.ts`
- `client/src/types/combat.ts`
- `client/src/utils/calculations.ts`
- `client/src/contexts/CombatContext.tsx`
- `client/src/components/layout/Topbar/Topbar.tsx`
- `client/src/components/combat/CombatCard/CombatCard.tsx`
- `client/src/components/select/SelectGrid/SelectGrid.tsx`
- `client/src/pages/SelectPage/SelectPage.tsx`
- `client/src/pages/PartySelectPage/PartySelectPage.tsx`
- `client/src/pages/ViewCharacterPage/ViewCharacterPage.tsx`
- `client/src/pages/GameMasterPage/GameMasterPage.tsx`
- `client/src/pages/PartyMembersPage/PartyMembersPage.tsx`

**Docs — editar:**
- `README.md`
- `openapi.yaml`

---

### Task 1: Remover o Naruto do servidor

**Files:**
- Delete: `server/src/routes/naruto.routes.js`, `server/src/controllers/naruto.controller.js`, `server/src/services/naruto.service.js`, `server/src/repositories/naruto.repository.js`, `server/src/dto/naruto.dto.js`
- Delete: `server/db/models/NarutoClan.js`, `server/db/models/NarutoTechTemplate.js`, `server/db/migrateNarutoClans.js`, `server/db/migrateNarutoTechTemplates.js`
- Modify: `server/index.js:35-38`
- Modify: `server/src/routes/index.js:5,17`
- Modify: `server/src/services/party.service.js:13`
- Modify: `server/db/models/Party.js:17`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: servidor sobe sem nenhuma rota/model/migração de Naruto. `registerRoutes(app, opts)` (server/src/routes/index.js) continua exportando a mesma assinatura, só sem montar `createNarutoRoutes()`. `party.service.js` continua exportando as mesmas funções, só com `VALID_SYSTEMS` restrito.

- [ ] **Step 1: Apagar os 9 arquivos dedicados a Naruto no server**

```bash
rm server/src/routes/naruto.routes.js
rm server/src/controllers/naruto.controller.js
rm server/src/services/naruto.service.js
rm server/src/repositories/naruto.repository.js
rm server/src/dto/naruto.dto.js
rm server/db/models/NarutoClan.js
rm server/db/models/NarutoTechTemplate.js
rm server/db/migrateNarutoClans.js
rm server/db/migrateNarutoTechTemplates.js
```

- [ ] **Step 2: Remover o mount da rota em `server/src/routes/index.js`**

Arquivo atual:
```js
const fs = require('fs');
const path = require('path');
const paths = require('../../paths');
const { errorHandler } = require('../middlewares/errorHandler');
const { createNarutoRoutes } = require('./naruto.routes');
const { createCharacterRoutes } = require('./characters.routes');
const { createPartyRoutes } = require('./parties.routes');
const { createCombatRoutes } = require('./combat.routes');

/**
 * @param {import('express').Express} app
 * @param {{ refs: { broadcastCombat: (partyId?: string) => void, broadcastPartyRoster: (partyId: string) => void } }} opts
 */
function registerRoutes(app, opts) {
  const { refs } = opts;
  app.use(createCharacterRoutes());
  app.use(createNarutoRoutes());
  app.use(createPartyRoutes(refs));
  app.use(createCombatRoutes(refs));

  if (fs.existsSync(paths.DIST_DIR)) {
    app.get('*', (_req, res) => {
      res.sendFile(path.join(paths.DIST_DIR, 'index.html'));
    });
  }

  app.use(errorHandler);
}

module.exports = { registerRoutes };
```

Trocar por:
```js
const fs = require('fs');
const path = require('path');
const paths = require('../../paths');
const { errorHandler } = require('../middlewares/errorHandler');
const { createCharacterRoutes } = require('./characters.routes');
const { createPartyRoutes } = require('./parties.routes');
const { createCombatRoutes } = require('./combat.routes');

/**
 * @param {import('express').Express} app
 * @param {{ refs: { broadcastCombat: (partyId?: string) => void, broadcastPartyRoster: (partyId: string) => void } }} opts
 */
function registerRoutes(app, opts) {
  const { refs } = opts;
  app.use(createCharacterRoutes());
  app.use(createPartyRoutes(refs));
  app.use(createCombatRoutes(refs));

  if (fs.existsSync(paths.DIST_DIR)) {
    app.get('*', (_req, res) => {
      res.sendFile(path.join(paths.DIST_DIR, 'index.html'));
    });
  }

  app.use(errorHandler);
}

module.exports = { registerRoutes };
```

- [ ] **Step 3: Remover as migrações de Naruto do boot em `server/index.js`**

Linhas 30-40 atuais:
```js
async function start() {
  await connectMongo();

  const { run: runMigrateToMongo } = require('./db/migrateToMongo');
  await runMigrateToMongo();
  const { run: runMigrateNarutoClans } = require('./db/migrateNarutoClans');
  await runMigrateNarutoClans();
  const { run: runMigrateNarutoTechTemplates } = require('./db/migrateNarutoTechTemplates');
  await runMigrateNarutoTechTemplates();

  const app = express();
```

Trocar por:
```js
async function start() {
  await connectMongo();

  const { run: runMigrateToMongo } = require('./db/migrateToMongo');
  await runMigrateToMongo();

  const app = express();
```

- [ ] **Step 4: Restringir `VALID_SYSTEMS` em `server/src/services/party.service.js:13`**

```js
const VALID_SYSTEMS = ['tormenta', 'naruto'];
```
→
```js
const VALID_SYSTEMS = ['tormenta'];
```

- [ ] **Step 5: Restringir o enum de `system` em `server/db/models/Party.js:17`**

```js
system: { type: String, enum: ['tormenta', 'naruto'], default: 'tormenta' },
```
→
```js
system: { type: String, enum: ['tormenta'], default: 'tormenta' },
```

- [ ] **Step 6: Verificar que não sobrou nenhuma referência a Naruto no server**

Run: `grep -ril naruto server/ || echo "OK: nenhuma referência"`
Expected: `OK: nenhuma referência` (o comando `grep` não encontra nada, `||` cai no `echo`).

- [ ] **Step 7: Verificar que os módulos editados carregam sem erro de require**

Run:
```bash
node -e "require('./server/src/routes/index.js'); console.log('routes/index OK')"
node -e "require('./server/db/models/Party.js'); console.log('Party model OK')"
node -e "require('./server/src/services/party.service.js'); console.log('party.service OK')"
```
Expected: as três linhas `OK` impressas, sem stack trace.

- [ ] **Step 8: Subir o servidor e confirmar boot limpo**

Run: `npm run dev:server` (roda em background, porta 3001) — deixe rodando ~5s, depois:
```bash
curl -s http://localhost:3001/health
```
Expected: `{"ok":true}`. Confirme no log do `dev:server` que **não aparece** nenhuma linha mencionando Naruto (as duas migrações não rodam mais). Pare o processo (Ctrl+C ou matando a porta) depois de confirmar.

- [ ] **Step 9: Commit**

```bash
git add server/
git commit -m "feat: remove Naruto system from the server"
```

---

### Task 2: Remover o Naruto do cliente

**Files:**
- Delete: `client/src/features/naruto/`, `client/src/pages/NarutoSheetPage/`, `client/src/pages/NarutoViewPage/`, `client/src/types/narutoCharacter.ts`, `client/src/api/naruto.ts`, `client/src/components/ui/SystemFilter/`
- Modify: `client/src/App.tsx`, `client/src/api/index.ts`, `client/src/data/constants.ts`, `client/src/types/character.ts`, `client/src/types/combat.ts`, `client/src/utils/calculations.ts`, `client/src/contexts/CombatContext.tsx`, `client/src/components/layout/Topbar/Topbar.tsx`, `client/src/components/combat/CombatCard/CombatCard.tsx`, `client/src/components/select/SelectGrid/SelectGrid.tsx`, `client/src/pages/SelectPage/SelectPage.tsx`, `client/src/pages/PartySelectPage/PartySelectPage.tsx`, `client/src/pages/ViewCharacterPage/ViewCharacterPage.tsx`, `client/src/pages/GameMasterPage/GameMasterPage.tsx`, `client/src/pages/PartyMembersPage/PartyMembersPage.tsx`

**Interfaces:**
- Consumes: nada do server (client e server só se conectam via HTTP/API real, não via import) — esta task pode rodar independente da Task 1 ter sido "verificada" no navegador, mas assume que a Task 1 já foi commitada.
- Produces: `RPGSystem` (client/src/types/character.ts) vira `'tormenta'`. `SYSTEM_ROUTES` (client/src/data/constants.ts) só tem a chave `tormenta`. `Topbar` (client/src/components/layout/Topbar/Topbar.tsx) não tem mais prop `systemBrand` nem exporta `SystemBrand`/`systemParamToBrand`.

- [ ] **Step 1: Apagar os diretórios e arquivos dedicados a Naruto no client**

```bash
rm -rf client/src/features/naruto
rm -rf client/src/pages/NarutoSheetPage
rm -rf client/src/pages/NarutoViewPage
rm client/src/types/narutoCharacter.ts
rm client/src/api/naruto.ts
rm -rf client/src/components/ui/SystemFilter
```

- [ ] **Step 2: Remover as rotas de Naruto em `client/src/App.tsx`**

Arquivo atual:
```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import CharacterSheetPage from './pages/CharacterSheetPage/CharacterSheetPage';
import { AuthPage, RequireAuth } from './features/auth';
import NarutoSheetPage from './pages/NarutoSheetPage/NarutoSheetPage';
import NarutoViewPage from './pages/NarutoViewPage/NarutoViewPage';
import GameMasterPage from './pages/GameMasterPage/GameMasterPage';
import SelectPage from './pages/SelectPage/SelectPage';
import PartySelectPage from './pages/PartySelectPage/PartySelectPage';
import PartyMembersPage from './pages/PartyMembersPage/PartyMembersPage';
import ViewCharacterPage from './pages/ViewCharacterPage/ViewCharacterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/characters" element={<RequireAuth><SelectPage /></RequireAuth>} />
      <Route path="/parties" element={<RequireAuth><PartySelectPage /></RequireAuth>} />
      <Route path="/tormenta/char" element={<RequireAuth><CharacterSheetPage /></RequireAuth>} />
      <Route path="/naruto/char" element={<RequireAuth><NarutoSheetPage /></RequireAuth>} />
      <Route path="/naruto/view" element={<RequireAuth><NarutoViewPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId" element={<RequireAuth><GameMasterPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId/members" element={<RequireAuth><PartyMembersPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId/char/:characterId" element={<RequireAuth><ViewCharacterPage /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
```

Trocar por:
```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import CharacterSheetPage from './pages/CharacterSheetPage/CharacterSheetPage';
import { AuthPage, RequireAuth } from './features/auth';
import GameMasterPage from './pages/GameMasterPage/GameMasterPage';
import SelectPage from './pages/SelectPage/SelectPage';
import PartySelectPage from './pages/PartySelectPage/PartySelectPage';
import PartyMembersPage from './pages/PartyMembersPage/PartyMembersPage';
import ViewCharacterPage from './pages/ViewCharacterPage/ViewCharacterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/characters" element={<RequireAuth><SelectPage /></RequireAuth>} />
      <Route path="/parties" element={<RequireAuth><PartySelectPage /></RequireAuth>} />
      <Route path="/tormenta/char" element={<RequireAuth><CharacterSheetPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId" element={<RequireAuth><GameMasterPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId/members" element={<RequireAuth><PartyMembersPage /></RequireAuth>} />
      <Route path="/:system/party/:partyId/char/:characterId" element={<RequireAuth><ViewCharacterPage /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
```

Nota: `/:system/party/...` continua genérica de propósito — uma party antiga de Naruto ainda bate nessa rota; o tratamento é feito dentro de `ViewCharacterPage` (Step 10), não na definição da rota.

- [ ] **Step 3: Remover o re-export de Naruto em `client/src/api/index.ts`**

Remover as duas últimas linhas do arquivo:
```ts
export { apiFetchNarutoClans, apiFetchNarutoTechTemplates } from './naruto';
export type { NarutoClanOption, NarutoTechTemplateOption } from './naruto';
```

- [ ] **Step 4: Restringir `SYSTEM_ROUTES` em `client/src/data/constants.ts:3-6`**

```ts
export const SYSTEM_ROUTES: Record<RPGSystem, string> = {
  tormenta: '/tormenta/char',
  naruto: '/naruto/char',
};
```
→
```ts
export const SYSTEM_ROUTES: Record<RPGSystem, string> = {
  tormenta: '/tormenta/char',
};
```

- [ ] **Step 5: Restringir `RPGSystem` e remover os campos de Naruto em `client/src/types/character.ts`**

Linha 1:
```ts
export type RPGSystem = 'tormenta' | 'naruto';
```
→
```ts
export type RPGSystem = 'tormenta';
```

Apagar o bloco de campos entre `level?: number;` e o fechamento da interface (linhas 262-298 no arquivo atual — do comentário `/* ─── Naruto SNS fields ... ─── */` até `halfDamageGrade?: string;`, inclusive):
```ts
  /* ─── Naruto SNS fields (optional, only present when system === 'naruto') ─── */
  narpiAttributes?: import('./narutoCharacter').NarutoAttributes;
  combatSkills?: import('./narutoCharacter').NarutoCombatSkills;
  social?: import('./narutoCharacter').NarutoSocialAttributes;
  narpiSkills?: Record<string, import('./narutoCharacter').NarutoSkillData>;
  powers?: import('./narutoCharacter').NarutoPower[];
  aptitudes?: import('./narutoCharacter').NarutoAptitude[];
  jutsus?: import('./narutoCharacter').Jutsu[];
  damageEntries?: import('./narutoCharacter').DamageEntry[];
  weapons?: import('./narutoCharacter').NarutoWeapon[];
  weaponAttacks?: import('./narutoCharacter').NarutoWeaponAttack[];
  armor?: import('./narutoCharacter').NarutoArmor;
  narpiItems?: import('./narutoCharacter').NarutoItem[];
  storedItems?: import('./narutoCharacter').NarutoItem[];
  narpiConfig?: import('./narutoCharacter').NarutoConfig;
  recursoExtra?: import('./narutoCharacter').NarutoRecursoExtra;
  clan?: string;
  campaignLevel?: number;
  shinobiRank?: string;
  gender?: string;
  sexuality?: string;
  tendency?: string;
  villageOrigin?: string;
  villageActive?: string;
  ryos?: number;
  ryosStored?: number;
  biography?: string;
  motto?: string;
  curiosities?: string;
  sensorType?: string;
  sensorRange?: string;
  bleedingGrades?: number;
  weaponReachCC?: number;
  targetHardness?: number;
  extraDamageCC?: string;
  extraDamageCD?: string;
  halfDamageGrade?: string;
```

Depois de apagar, `level?: number;` deve ser o último campo antes do `}` que fecha a interface `Character`.

- [ ] **Step 6: Remover os campos de Naruto em `client/src/types/combat.ts`**

Em `CombatPlayer` (linhas 23-35), remover:
```ts
  system?: 'tormenta' | 'naruto';
  clan?: string;
```

Em `CombatRow` (linhas 37-55), remover:
```ts
  system?: 'tormenta' | 'naruto';
  clan?: string;
```

- [ ] **Step 7: Remover o re-export de `createEmptyNarutoCharacter` em `client/src/utils/calculations.ts:54`**

Apagar a linha:
```ts
export { createEmptyNarutoCharacter } from '../features/naruto/utils/narutoCalculations';
```
(e uma das duas linhas em branco ao redor, pra não sobrar linha dupla).

- [ ] **Step 8: Remover a fonte de dados de clã em `client/src/contexts/CombatContext.tsx`**

Dentro de `mapPartyToPlayers` (por volta da linha 184-200), remover as duas linhas:
```ts
        system: r.system,
        clan: r.clan,
```

Trecho final esperado:
```ts
  const mapPartyToPlayers = useCallback(
    (partyChars: Awaited<ReturnType<typeof apiFetchPartyCharacters>>): CombatPlayer[] =>
      partyChars.map((r) => ({
        _id: r._id,
        name: r.name,
        avatar: r.avatar || '',
        classes: r.classes,
        ownerUid: r.ownerUid,
        maxHp: r.hp?.max ?? 0,
        currentHp: r.hp?.current ?? 0,
        maxMp: r.mp?.max ?? 0,
        currentMp: r.mp?.current ?? 0,
      })),
    [],
  );
```

- [ ] **Step 9: Simplificar `client/src/components/layout/Topbar/Topbar.tsx` pra um único sistema**

Remover (linhas 6-19 do arquivo atual):
```tsx
/** Marca do sistema RPG ao lado da logo Arcana Forge (ficha ou grupo). */
export type SystemBrand = 'naruto' | 'tormenta';

interface TopbarProps {
  title?: string;
  right?: ReactNode;
  /** Quando definido, exibe a logo do sistema (SNS ou Tormenta) ao lado da logo do app. */
  systemBrand?: SystemBrand;
}

const SYSTEM_LOGO: Record<SystemBrand, { src: string; alt: string }> = {
  naruto: { src: '/assets/sns_logo.png', alt: 'Shinobi no Sentou' },
  tormenta: { src: '/assets/tormenta_logo.png', alt: 'Tormenta RPG' },
};

/** Parâmetro de rota `:system/...` → marca exibida na topbar. */
export function systemParamToBrand(system: string | undefined): SystemBrand | undefined {
  if (system === 'naruto') return 'naruto';
  if (system === 'tormenta') return 'tormenta';
  return undefined;
}
```

Trocar por:
```tsx
interface TopbarProps {
  title?: string;
  right?: ReactNode;
}
```

Trocar a assinatura do componente (linha 28 atual):
```tsx
export default function Topbar({ title, right, systemBrand }: TopbarProps) {
```
→
```tsx
export default function Topbar({ title, right }: TopbarProps) {
```

Remover o bloco condicional da logo de sistema (linhas 93-100 atuais, dentro de `topLeft`):
```tsx
          {systemBrand && (
            <img
              src={SYSTEM_LOGO[systemBrand].src}
              alt={SYSTEM_LOGO[systemBrand].alt}
              className={styles.systemLogoImage}
              loading="eager"
            />
          )}
```

- [ ] **Step 10: Atualizar os dois call sites de `Topbar` que usavam `systemBrand`**

Em `client/src/pages/GameMasterPage/GameMasterPage.tsx`:
```tsx
import Topbar, { systemParamToBrand } from '../../components/layout/Topbar/Topbar';
```
→
```tsx
import Topbar from '../../components/layout/Topbar/Topbar';
```

```tsx
      <Topbar
        title={party.name ? `Grupo - ${party.name}` : 'Grupo'}
        systemBrand={systemParamToBrand(system)}
      />
```
→
```tsx
      <Topbar title={party.name ? `Grupo - ${party.name}` : 'Grupo'} />
```

Em `client/src/pages/PartyMembersPage/PartyMembersPage.tsx`:
```tsx
import Topbar, { systemParamToBrand } from '../../components/layout/Topbar/Topbar';
```
→
```tsx
import Topbar from '../../components/layout/Topbar/Topbar';
```

```tsx
      <Topbar title={`Grupo - ${party.name}`} systemBrand={systemParamToBrand(system)} />
```
→
```tsx
      <Topbar title={`Grupo - ${party.name}`} />
```

- [ ] **Step 11: Simplificar `client/src/components/combat/CombatCard/CombatCard.tsx`**

Remover do bloco de imports (linhas 7-8 atuais):
```tsx
import { apiFetchNarutoClans } from '../../../api';
import type { NarutoClanOption } from '../../../api';
```

Remover (linhas 13-25 atuais):
```tsx
let cachedClans: NarutoClanOption[] | null = null;
let clanFetchPromise: Promise<NarutoClanOption[]> | null = null;

function fetchClansOnce(): Promise<NarutoClanOption[]> {
  if (cachedClans) return Promise.resolve(cachedClans);
  if (!clanFetchPromise) {
    clanFetchPromise = apiFetchNarutoClans().then((clans) => {
      cachedClans = clans;
      return clans;
    });
  }
  return clanFetchPromise;
}

```

Trocar (linhas 74-94 atuais):
```tsx
  const isNaruto = row.system === 'naruto';
  const firstClassName = row.classes?.[0]?.name;
  const classIconSrc = firstClassName ? getClassIconUrl(firstClassName) : '';

  const [clanIconSrc, setClanIconSrc] = useState('');
  useEffect(() => {
    if (!isNaruto || !row.clan?.trim()) {
      setClanIconSrc('');
      return;
    }
    const want = row.clan.trim().toLowerCase();
    fetchClansOnce()
      .then((clans) => {
        const match = clans.find((c) => c.name.toLowerCase() === want);
        setClanIconSrc(match?.icon ?? '');
      })
      .catch(() => setClanIconSrc(''));
  }, [isNaruto, row.clan]);

  const stripIconSrc = isNaruto ? clanIconSrc : classIconSrc;
  const hasAllyStripIcon = isPartyCharacter && !showAsEnemyCard && (isNaruto ? !!clanIconSrc : !!firstClassName);
```

por:
```tsx
  const firstClassName = row.classes?.[0]?.name;
  const classIconSrc = firstClassName ? getClassIconUrl(firstClassName) : '';

  const stripIconSrc = classIconSrc;
  const hasAllyStripIcon = isPartyCharacter && !showAsEnemyCard && !!firstClassName;
```

(o resto do arquivo — `stripIconSrc`/`hasAllyStripIcon` usados no JSX mais abaixo — não muda, os nomes continuam iguais.)

- [ ] **Step 12: Restringir `SISTEMA_BADGE` em `client/src/components/select/SelectGrid/SelectGrid.tsx:15-18`**

```tsx
const SISTEMA_BADGE: Record<RPGSystem, string> = {
  tormenta: '⚔️',
  naruto: '🍥',
};
```
→
```tsx
const SISTEMA_BADGE: Record<RPGSystem, string> = {
  tormenta: '⚔️',
};
```

E o `title` condicional logo abaixo (linha ~45):
```tsx
            <span className={styles.systemBadge} title={r.system === 'naruto' ? 'Naruto: Shinobi no Sho' : 'Tormenta 20'}>
```
→
```tsx
            <span className={styles.systemBadge} title="Tormenta 20">
```

- [ ] **Step 13: Remover o filtro por sistema e a opção Naruto do modal em `client/src/pages/SelectPage/SelectPage.tsx`**

Imports (linhas 9-13 atuais):
```tsx
import { createEmptyCharacter, createEmptyNarutoCharacter } from '../../utils/calculations';
import type { RPGSystem, CharacterSummary } from '../../types/character';
import { SYSTEM_ROUTES } from '../../data/constants';
import Topbar from '../../components/layout/Topbar/Topbar';
import SystemFilter from '../../components/ui/SystemFilter/SystemFilter';
```
→
```tsx
import { createEmptyCharacter } from '../../utils/calculations';
import type { CharacterSummary } from '../../types/character';
import { SYSTEM_ROUTES } from '../../data/constants';
import Topbar from '../../components/layout/Topbar/Topbar';
```

Remover a linha 21: `type TabFilter = 'todos' | 'tormenta' | 'naruto';`

No componente, trocar (linhas 28-63 atuais):
```tsx
export default function SelectPage() {
  const [resumos, setResumos] = useState<CharacterSummary[]>([]);
  const [tab, setTab] = useState<TabFilter>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSystem, setNewSystem] = useState<RPGSystem>('tormenta');
  const [deleteTarget, setDeleteTarget] = useState<CharacterSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetchCharacterSummaries()
      .then(setResumos)
      .catch(console.error);
  }, []);

  const activeChars = resumos.filter((r) => !r.deletedAt);
  const pendingDeleteChars = resumos.filter((r) => r.deletedAt);
  const filtered = tab === 'todos' ? activeChars : activeChars.filter((r) => r.system === tab);

  const openNewModal = () => {
    setNewName('');
    setNewSystem('tormenta');
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    const character =
      newSystem === 'naruto' ? createEmptyNarutoCharacter(name) : createEmptyCharacter(name);
    await apiSaveCharacter(character._id, character);
    setModalOpen(false);
    navigate(`${SYSTEM_ROUTES[newSystem]}?id=${encodeURIComponent(character._id)}`);
  };
```
por:
```tsx
export default function SelectPage() {
  const [resumos, setResumos] = useState<CharacterSummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CharacterSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetchCharacterSummaries()
      .then(setResumos)
      .catch(console.error);
  }, []);

  const activeChars = resumos.filter((r) => !r.deletedAt);
  const pendingDeleteChars = resumos.filter((r) => r.deletedAt);

  const openNewModal = () => {
    setNewName('');
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    const character = createEmptyCharacter(name);
    await apiSaveCharacter(character._id, character);
    setModalOpen(false);
    navigate(`${SYSTEM_ROUTES.tormenta}?id=${encodeURIComponent(character._id)}`);
  };
```

Mais abaixo, remover a linha `<SystemFilter value={tab} onChange={setTab} />` (e a linha em branco logo depois), e trocar `resumos={filtered}` por `resumos={activeChars}` na chamada de `<SelectGrid>`.

No modal "Novo Personagem", remover o seletor de sistema inteiro:
```tsx
          <span className={styles.newModalLabel}>Sistema de RPG</span>
          <div className={styles.systemSelector}>
            <button
              type="button"
              className={`${styles.systemOption} ${newSystem === 'tormenta' ? styles.systemActive : ''}`}
              onClick={() => setNewSystem('tormenta')}
            >
              <span className={styles.systemIcon}>⚔️</span>
              <span className={styles.systemName}>Tormenta 20</span>
            </button>
            <button
              type="button"
              className={`${styles.systemOption} ${newSystem === 'naruto' ? styles.systemActive : ''}`}
              onClick={() => setNewSystem('naruto')}
            >
              <span className={styles.systemIcon}>🍥</span>
              <span className={styles.systemName}>Naruto: SnS</span>
            </button>
          </div>

```

E trocar o placeholder do campo de nome:
```tsx
            placeholder="Ex: Aragorn, Naruto Uzumaki..."
```
→
```tsx
            placeholder="Ex: Aragorn, Kael..."
```

- [ ] **Step 14: Remover o filtro por sistema e a opção Naruto do modal em `client/src/pages/PartySelectPage/PartySelectPage.tsx`**

Import (linha 10 atual): remover
```tsx
import SystemFilter from '../../components/ui/SystemFilter/SystemFilter';
```

Remover a linha 17: `type TabFilter = 'todos' | 'tormenta' | 'naruto';`

Trocar (linhas 19-27 atuais):
```tsx
const SISTEMA_BADGE: Record<RPGSystem, string> = {
  tormenta: '⚔️',
  naruto: '🍥',
};

const SISTEMA_LABEL: Record<RPGSystem, string> = {
  tormenta: 'Tormenta 20',
  naruto: 'Naruto: SnS',
};
```
por:
```tsx
const SISTEMA_BADGE: Record<RPGSystem, string> = {
  tormenta: '⚔️',
};

const SISTEMA_LABEL: Record<RPGSystem, string> = {
  tormenta: 'Tormenta 20',
};
```

Remover a linha 32: `const [tab, setTab] = useState<TabFilter>('todos');`
Remover a linha 39: `const [newSystem, setNewSystem] = useState<RPGSystem>('tormenta');`

Em `openModal` (linhas 71-75 atuais), remover o reset de `newSystem`:
```tsx
  const openModal = () => {
    setNewName('');
    setNewSystem('tormenta');
    setModalOpen(true);
  };
```
→
```tsx
  const openModal = () => {
    setNewName('');
    setModalOpen(true);
  };
```

Em `handleCreate` (linha 88 atual), trocar:
```tsx
    const party = await apiCreateParty({ name, system: newSystem });
```
→
```tsx
    const party = await apiCreateParty({ name, system: 'tormenta' });
```

Remover a função `filterByTab` (linhas 68-69 atuais):
```tsx
  const filterByTab = (list: Party[]) =>
    tab === 'todos' ? list : list.filter((p) => p.system === tab);
```

Trocar (linhas 189-190 atuais):
```tsx
  const filteredMy = filterByTab(myParties);
  const filteredJoined = filterByTab(joinedParties);
```
por: (remover essas duas linhas — usar `myParties`/`joinedParties` direto)

E trocar os três usos de `filteredMy`/`filteredJoined` mais abaixo:
```tsx
          {filteredMy.map((p) => renderPartyCard(p, true))}
```
→
```tsx
          {myParties.map((p) => renderPartyCard(p, true))}
```
```tsx
          {filteredJoined.length === 0 ? (
```
→
```tsx
          {joinedParties.length === 0 ? (
```
```tsx
            filteredJoined.map((p) => renderPartyCard(p, false))
```
→
```tsx
            joinedParties.map((p) => renderPartyCard(p, false))
```

Remover a linha `<SystemFilter value={tab} onChange={setTab} />` (e a linha em branco logo depois) dentro do `return` principal.

No modal "Novo Grupo", remover o seletor de sistema inteiro (mesmo padrão do Step 13):
```tsx
          <span className={styles.newModalLabel}>Sistema de RPG</span>
          <div className={styles.systemSelector}>
            <button
              type="button"
              className={`${styles.systemOption} ${newSystem === 'tormenta' ? styles.systemActive : ''}`}
              onClick={() => setNewSystem('tormenta')}
            >
              <span className={styles.systemIcon}>⚔️</span>
              <span className={styles.systemName}>Tormenta 20</span>
            </button>
            <button
              type="button"
              className={`${styles.systemOption} ${newSystem === 'naruto' ? styles.systemActive : ''}`}
              onClick={() => setNewSystem('naruto')}
            >
              <span className={styles.systemIcon}>🍥</span>
              <span className={styles.systemName}>Naruto: SnS</span>
            </button>
          </div>

```

- [ ] **Step 15: Substituir a ramificação de Naruto por uma mensagem de sistema não suportado em `client/src/pages/ViewCharacterPage/ViewCharacterPage.tsx`**

Arquivo atual (completo):
```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import { apiLoadPartyCharacter } from '../../api';
import { isSectionHidden } from '../../data/constants';
import { NARUTO_SECTION_LABELS } from '../../features/naruto/data/narutoConstants';
import type { Character } from '../../types/character';
import Topbar, { systemParamToBrand } from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import TormentaSheetBody from '../../components/sheet/TormentaSheetBody/TormentaSheetBody';

import NarutoBasicInfo from '../../features/naruto/components/NarutoBasicInfo/NarutoBasicInfo';
import NarutoAttributes from '../../features/naruto/components/NarutoAttributes/NarutoAttributes';
import NarutoEnergies from '../../features/naruto/components/NarutoEnergies/NarutoEnergies';
import NarutoCombatStats from '../../features/naruto/components/NarutoCombatStats/NarutoCombatStats';
import NarutoSocial from '../../features/naruto/components/NarutoSocial/NarutoSocial';
import NarutoPowers from '../../features/naruto/components/NarutoPowers/NarutoPowers';
import NarutoAptitudes from '../../features/naruto/components/NarutoAptitudes/NarutoAptitudes';
import NarutoJutsus from '../../features/naruto/components/NarutoJutsus/NarutoJutsus';
import NarutoAttacks from '../../features/naruto/components/NarutoAttacks/NarutoAttacks';
import NarutoDamageCalc from '../../features/naruto/components/NarutoDamageCalc/NarutoDamageCalc';
import NarutoInventory from '../../features/naruto/components/NarutoInventory/NarutoInventory';

import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './ViewCharacterPage.module.css';

function ViewCharacterInner({ system }: { system: string }) {
  const { character } = useCharacterContext();

  if (!character) {
    return <div className={styles.loading}>Carregando ficha...</div>;
  }

  if (system === 'tormenta') {
    return (
      <TormentaSheetBody
        topBanner={
          <div className={styles.readOnlyBanner}>
            <Eye size={16} />
            MODO SOMENTE LEITURA
          </div>
        }
      />
    );
  }

  const sections = Object.entries(NARUTO_SECTION_LABELS).map(([id, label]) => ({
    id,
    label,
    hidden: isSectionHidden(character.hiddenSections, id),
  }));
  const isHidden = (id: string) => isSectionHidden(character.hiddenSections, id);

  return (
    <>
      <Topbar
        title={`Visualizando — ${character.name}`}
        systemBrand={systemParamToBrand(system)}
      />

      <SectionNav items={sections} useScrollObserver hiddenSections={character.hiddenSections} />

      <main className={styles.container}>
        <div className={styles.readOnlyBanner}>
          <Eye size={16} />
          MODO SOMENTE LEITURA
        </div>

        <div className="readOnlySheet">
          <NarutoSections isHidden={isHidden} />
        </div>
      </main>
    </>
  );
}

function NarutoSections({ isHidden }: { isHidden: (id: string) => boolean }) {
  return (
    <>
      {!isHidden('secHeader') && <NarutoBasicInfo />}
      <div className={styles.layoutTop}>
        <div className={styles.colLeft}>
          {!isHidden('secAttributes') && <NarutoAttributes />}
          {!isHidden('secCombat') && <NarutoCombatStats />}
        </div>
        <div className={styles.colRight}>
          {!isHidden('secEnergies') && <NarutoEnergies />}
          {!isHidden('secSocial') && <NarutoSocial />}
        </div>
      </div>
      {!isHidden('secJutsus') && <NarutoJutsus />}
      {!isHidden('secAttacks') && <NarutoAttacks />}
      {!isHidden('secPowers') && <NarutoPowers />}
      {!isHidden('secAptitudes') && <NarutoAptitudes />}
      {!isHidden('secDamage') && <NarutoDamageCalc />}
      {!isHidden('secInventory') && <NarutoInventory />}
    </>
  );
}

function ViewCharacterLoader({ system, partyId, characterId }: { system: string; partyId: string; characterId: string }) {
  const { setCharacterDirect } = useCharacterContext();
  const [loadDone, setLoadDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiLoadPartyCharacter(partyId, characterId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError(true);
        } else {
          setCharacterDirect(data as unknown as Character);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadDone(true);
      });
    return () => { cancelled = true; };
  }, [partyId, characterId, setCharacterDirect]);

  if (error) return <AccessDeniedPage />;
  if (!loadDone) return <div className={styles.loading}>Carregando ficha...</div>;

  return <ViewCharacterInner system={system} />;
}

export default function ViewCharacterPage() {
  const { system, partyId, characterId } = useParams<{ system: string; partyId: string; characterId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!partyId || !characterId) {
      navigate('/parties', { replace: true });
    }
  }, [partyId, characterId, navigate]);

  if (!system || !partyId || !characterId) return null;

  return (
    <CharacterProvider readOnly>
      <ViewCharacterLoader system={system} partyId={partyId} characterId={characterId} />
    </CharacterProvider>
  );
}
```

Trocar por:
```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import { apiLoadPartyCharacter } from '../../api';
import type { Character } from '../../types/character';
import TormentaSheetBody from '../../components/sheet/TormentaSheetBody/TormentaSheetBody';

import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './ViewCharacterPage.module.css';

function ViewCharacterInner({ system }: { system: string }) {
  const { character } = useCharacterContext();

  if (!character) {
    return <div className={styles.loading}>Carregando ficha...</div>;
  }

  if (system !== 'tormenta') {
    return (
      <div className={styles.readOnlyBanner}>
        Este grupo usa um sistema que não é mais suportado.
      </div>
    );
  }

  return (
    <TormentaSheetBody
      topBanner={
        <div className={styles.readOnlyBanner}>
          <Eye size={16} />
          MODO SOMENTE LEITURA
        </div>
      }
    />
  );
}

function ViewCharacterLoader({ system, partyId, characterId }: { system: string; partyId: string; characterId: string }) {
  const { setCharacterDirect } = useCharacterContext();
  const [loadDone, setLoadDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiLoadPartyCharacter(partyId, characterId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError(true);
        } else {
          setCharacterDirect(data as unknown as Character);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadDone(true);
      });
    return () => { cancelled = true; };
  }, [partyId, characterId, setCharacterDirect]);

  if (error) return <AccessDeniedPage />;
  if (!loadDone) return <div className={styles.loading}>Carregando ficha...</div>;

  return <ViewCharacterInner system={system} />;
}

export default function ViewCharacterPage() {
  const { system, partyId, characterId } = useParams<{ system: string; partyId: string; characterId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!partyId || !characterId) {
      navigate('/parties', { replace: true });
    }
  }, [partyId, characterId, navigate]);

  if (!system || !partyId || !characterId) return null;

  return (
    <CharacterProvider readOnly>
      <ViewCharacterLoader system={system} partyId={partyId} characterId={characterId} />
    </CharacterProvider>
  );
}
```

- [ ] **Step 16: Verificar que não sobrou nenhuma referência a Naruto no client**

Run: `grep -ril naruto client/src/ || echo "OK: nenhuma referência"`
Expected: `OK: nenhuma referência`

- [ ] **Step 17: Rodar o type-check completo do client**

Run:
```bash
cd client && npx tsc -b --force
```
Expected: termina sem nenhuma linha de erro (exit code 0). Se aparecer erro apontando pra um arquivo fora desta lista, ele também depende de algo apagado — resolver antes de seguir (não deixar `tsc` vermelho entre tasks).

- [ ] **Step 18: Commit**

```bash
git add client/
git commit -m "feat: remove Naruto system from the client"
```

---

### Task 3: Documentação e verificação final

**Files:**
- Modify: `README.md`
- Modify: `openapi.yaml`

**Interfaces:**
- Consumes: build completo das Tasks 1 e 2 (server + client sem nenhuma referência a Naruto, `tsc -b --force` limpo).
- Produces: nada consumido por outra task — esta é a última.

- [ ] **Step 1: Atualizar `README.md`**

Remover a frase "Suporta **Tormenta 20** e **Naruto d20**" da introdução, deixando só Tormenta 20. Remover a linha `| Naruto d20 Sheet | \`/naruto/char?id=<id>\` |` e `| Combat Tracker (Naruto) | \`/naruto/party/:partyId\` |` da tabela de rotas. Remover qualquer menção a "Naruto" nas seções de Funcionalidades e Rotas da Aplicação (procurar por `naruto` case-insensitive no arquivo pra não deixar nenhuma sobrando).

- [ ] **Step 2: Atualizar `openapi.yaml`**

Remover todos os `paths` que começam com `/api/naruto` (ou equivalente) e qualquer schema exclusivo de Naruto referenciado só por eles.

- [ ] **Step 3: Verificação final — grep de sobras em todo o repo**

Run: `grep -ril naruto --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=design-mockups --exclude=naruto_pdf_text.txt . || echo "OK: nenhuma referência fora do escopo aceito"`
Expected: `OK: nenhuma referência fora do escopo aceito` (as únicas ocorrências restantes no repo devem ser os arquivos explicitamente fora de escopo: `design-mockups/PLANO-*.md` e `naruto_pdf_text.txt`).

- [ ] **Step 4: Teste manual completo no navegador (Tormenta)**

Suba o app (`npm run dev` ou o fluxo Docker de sempre) e confirme, logado com uma conta real:
- Lista de personagens (`/characters`) não mostra mais abas de filtro por sistema.
- "+ Novo Personagem" não oferece mais opção Naruto — cria direto um personagem Tormenta.
- Abrir a ficha, atacar com uma arma, conjurar uma magia — tudo funciona como antes.
- "Grupos" (`/parties`) não mostra mais abas de filtro por sistema; criar um grupo novo não oferece opção Naruto.
- Abrir o combat tracker de um grupo Tormenta, ver a ficha de outro membro do grupo (`ViewCharacterPage`) — funciona normalmente.

- [ ] **Step 5: Teste manual do caso-limite (dado antigo de Naruto)**

Com um `id` real de personagem Naruto que já existia no banco antes desta mudança:
- Acessar `/naruto/char?id=<id real>` → deve cair no catch-all e redirecionar (não deve dar tela branca nem erro no console).
- Com um `id` real de uma party Naruto que já existia: acessar `/naruto/party/<id real>/members/../char/<id de um personagem daquela party>` (rota `ViewCharacterPage`) → deve mostrar a mensagem "Este grupo usa um sistema que não é mais suportado." em vez de tela branca ou dado renderizado errado.

- [ ] **Step 6: Confirmar que os dados de Naruto continuam intactos no MongoDB**

Run (leitura, sem escrever nada):
```bash
docker compose exec mongo mongosh arcanaforge --eval "db.characters.countDocuments({system: 'naruto'})"
docker compose exec mongo mongosh arcanaforge --eval "db.parties.countDocuments({system: 'naruto'})"
```
Expected: os dois comandos retornam o mesmo número de documentos que existia antes de começar (maior que zero) — nenhum foi apagado.

- [ ] **Step 7: Commit e deploy**

```bash
git add README.md openapi.yaml
git commit -m "docs: remove Naruto system references from README and OpenAPI spec"
```

Build e deploy conforme o fluxo já usado neste projeto:
```bash
docker compose build app && docker compose up -d app
```

Depois do deploy, repetir rapidamente os checks do Step 4 e Step 6 contra o ambiente de produção.
