# Remoção completa do sistema Naruto d20

## Objetivo

O ArcanaForge hoje suporta dois sistemas de RPG (Tormenta 20 e Naruto d20).
Decisão do usuário: descontinuar Naruto por completo e manter só Tormenta 20,
reduzindo a superfície de código e foco de manutenção a um único sistema.

## Contexto importante

Existem personagens e grupos de Naruto reais de outras contas no banco (ex.:
grupo "Continente do Sol", mestrado por outra conta, com combate em andamento).
Decisão explícita do usuário sobre o que fazer com isso:

- **Não apagar nada do MongoDB.** Nenhum script de migração/limpeza roda contra
  as coleções existentes. Os documentos com `system: 'naruto'` continuam no
  banco, intactos, apenas sem UI/API viva para servi-los daqui pra frente.
- **Não é necessário avisar os outros usuários antes.** As rotas `/naruto/*`
  saem do ar como parte natural da remoção; ninguém precisa ser notificado
  antes da mudança ir ao ar.
- Se algum dia quiser reverter, os dados continuam recuperáveis (estão no
  Mongo) e o código continua no histórico do git — só não fica ativo no app.

## Escopo

**Dentro do escopo:**
- Apagar todo arquivo dedicado a Naruto (client e server).
- Editar todo arquivo compartilhado que hoje ramifica em `if (system ===
  'naruto')` para remover só essa ramificação, preservando o caminho Tormenta.
- Remover as chamadas de migração de Naruto do boot do servidor
  (`migrateNarutoClans`/`migrateNarutoTechTemplates`) — não apagam dado
  existente, só param de rodar de novo (idempotentes hoje via sentinela, mas
  não fazem mais sentido rodar para um sistema descontinuado).
- Simplificar `SystemFilter` (abas "Todos/Tormenta/Naruto") — com um único
  sistema restando, "Todos" e "Tormenta" são idênticos. Remove o componente e
  o filtro nas telas que o usam.
- Guardar as rotas genéricas `/:system/party/...` contra dado não-Tormenta
  (ver seção "Caso-limite" abaixo) para falhar de forma limpa em vez de
  renderizar dado de Naruto com componentes de Tormenta.
- Atualizar `README.md` e `openapi.yaml` para refletir só Tormenta.

**Fora do escopo (não fazer agora):**
- Nenhuma migração, exportação ou limpeza de dados no MongoDB.
- Não reescrever `design-mockups/PLANO-DETALHADO.md`/`PLANO-IMPLEMENTACAO.md`
  — são registro histórico de decisão, não documentação viva.
- `naruto_pdf_text.txt` na raiz do repo (texto extraído de PDF, usado só como
  matéria-prima de pesquisa quando o catálogo de Naruto foi criado) — pode
  ficar ou sair, é irrelevante pro funcionamento do app; remover só por
  higiene se for conveniente, não é um requisito.
- Nenhuma migração automática de personagens/grupos Naruto existentes para o
  formato Tormenta — os dois modelos de dados são incompatíveis (atributos,
  perícias, jutsus vs. magias/poderes T20) e não faz sentido converter.

## 1. Inventário — apagar por completo

**Client:**
- `client/src/features/naruto/` (pasta inteira — components, data, utils, `index.ts`)
- `client/src/pages/NarutoSheetPage/`
- `client/src/pages/NarutoViewPage/`
- `client/src/types/narutoCharacter.ts`
- `client/src/api/naruto.ts`
- `client/src/components/ui/SystemFilter/` (ver seção 3)

**Server:**
- `server/db/models/NarutoClan.js`
- `server/db/models/NarutoTechTemplate.js`
- `server/db/migrateNarutoClans.js`
- `server/db/migrateNarutoTechTemplates.js`
- `server/src/routes/naruto.routes.js`
- `server/src/controllers/naruto.controller.js`
- `server/src/services/naruto.service.js`
- `server/src/repositories/naruto.repository.js`
- `server/src/dto/naruto.dto.js`

## 2. Inventário — editar (remover só a ramificação Naruto)

| Arquivo | O que muda |
|---|---|
| `client/src/App.tsx` | Remove rotas `/naruto/char` e `/naruto/view` e os imports de `NarutoSheetPage`/`NarutoViewPage`. O catch-all `path="*"` já existente cobre essas URLs a partir de agora — nenhuma rota nova precisa ser criada. |
| `client/src/data/constants.ts` | `SYSTEM_ROUTES` fica só com `tormenta`. |
| `client/src/types/character.ts` | `RPGSystem` vira `'tormenta'` (união de um valor só, mantém o tipo existente em vez de eliminar o conceito). Remove os campos opcionais comentados como "Naruto SNS fields". |
| `client/src/utils/calculations.ts` | Remove qualquer import/uso de `createEmptyNarutoCharacter` ou equivalente vindo de `features/naruto`. |
| `client/src/api/index.ts` | Remove re-export de `api/naruto.ts`. |
| `client/src/pages/SelectPage/SelectPage.tsx` | Remove opção "Naruto: SnS" do modal "Novo Personagem"; remove uso de `SystemFilter` (ver seção 3). |
| `client/src/pages/PartySelectPage/PartySelectPage.tsx` | Mesmo tratamento — remove opção Naruto do modal de criação de grupo e uso de `SystemFilter`. |
| `client/src/components/select/SelectGrid/SelectGrid.tsx` | Remove badge/ícone condicional por sistema, se só sobrar Tormenta. |
| `client/src/components/layout/Topbar/Topbar.tsx` | Remove `SystemBrand`/`SYSTEM_LOGO` de Naruto e a ramificação em `systemParamToBrand`; Topbar sempre mostra a marca Tormenta. |
| `client/src/components/combat/CombatCard/CombatCard.tsx` | Remove ícone/lógica condicional de Naruto. |
| `client/src/pages/ViewCharacterPage/ViewCharacterPage.tsx` | Remove a ramificação que renderizava `NarutoViewPage`; passa a sempre renderizar o corpo Tormenta — **com a guarda da seção 4 abaixo**. |
| `client/src/types/combat.ts` | Remove qualquer campo/tipo exclusivo de Naruto, se houver. |
| `client/src/styles/tokens.css` | Remove tokens exclusivos de Naruto, se houver. |
| `server/index.js` | Remove as duas chamadas `runMigrateNarutoClans()`/`runMigrateNarutoTechTemplates()` no boot. |
| `server/src/routes/index.js` | Remove o require/mount de `naruto.routes.js`. |
| `server/src/dto/character.dto.js` | Remove `'naruto'` do enum de `system` aceito em criação/edição (não afeta leitura de documentos já existentes). |
| `server/db/models/Party.js` | Remove `'naruto'` do enum de `system`, se existir validação desse tipo no schema — Mongoose só valida em escrita, documentos antigos com `system: 'naruto'` continuam legíveis. |
| `server/src/services/party.service.js` | Remove qualquer ramificação específica de Naruto. |
| `README.md` | Remove menções a Naruto d20, rotas `/naruto/*` e endpoints relacionados das tabelas de features/rotas/API. |
| `openapi.yaml` | Remove os paths de API de Naruto. |

## 3. SystemFilter — remoção e simplificação das telas

Com um único sistema, as abas "Todos / ⚔️ Tormenta / 🍥 Naruto" perdem sentido
(as duas primeiras ficam idênticas). Apaga
`client/src/components/ui/SystemFilter/` e, em `SelectPage.tsx` e
`PartySelectPage.tsx`, remove o estado de aba e a filtragem por sistema —
a listagem passa a mostrar direto todos os personagens/grupos do usuário
(que agora só podem ser Tormenta).

## 4. Caso-limite: rotas genéricas `/:system/party/...`

`GameMasterPage`, `PartyMembersPage` e `ViewCharacterPage` são montadas pela
rota parametrizada `/:system/party/:partyId(...)`, usada hoje pelos dois
sistemas. Uma party antiga de Naruto (como "Continente do Sol") continua
acessível por essa rota com `:system = "naruto"` mesmo depois da remoção,
porque a rota em si não distingue o valor do parâmetro.

Sem nenhuma guarda, isso renderizaria componentes Tormenta-only sobre dado
com formato de personagem Naruto (atributos, jutsus, etc. em vez de perícias
e magias T20) — risco de comportamento incorreto silencioso ou de estourar
uma exceção não tratada (o projeto não tem Error Boundary hoje, então uma
exceção aqui derruba a tela inteira).

**Tratamento:** nas três páginas acima, checar o `system` retornado pela API
(do personagem ou da party) assim que carregar; se não for `'tormenta'`,
mostrar uma mensagem simples ("Este grupo usa um sistema que não é mais
suportado") em vez de tentar renderizar a ficha. Não é uma feature nova nem
mantém Naruto vivo — é só a diferença entre falhar alto e limpo versus falhar
silencioso e confuso.

## Compatibilidade

- Nenhuma migração de dados. Documentos `system: 'naruto'` no MongoDB não são
  tocados, lidos ou escritos por nenhum código novo — ficam exatamente onde
  estão.
- Quem tinha um link salvo para `/naruto/char?id=...` ou `/naruto/view?...`
  cai no catch-all da rota e é redirecionado para `/auth` (mesmo
  comportamento que qualquer URL inválida já tem hoje).
- Quem tinha link salvo para `/naruto/party/:id` (ou `/members`, `/char/:id`)
  vê a mensagem de sistema não suportado descrita na seção 4, em vez de tela
  quebrada ou branca.
- `RPGSystem` continua existindo como tipo (só com um valor), então nenhum
  outro ponto do código que já lida com "o sistema do personagem" precisa
  saber que Naruto deixou de existir — só os pontos listados nas seções 1-3.

## Ordem de execução recomendada

1. Server primeiro: apagar os arquivos de `server/src/*/naruto.*` e os
   models/migrations, depois editar `server/index.js` e
   `server/src/routes/index.js`. Confirmar que o servidor sobe limpo.
2. Client: apagar `features/naruto/`, `pages/NarutoSheetPage`,
   `pages/NarutoViewPage`, `types/narutoCharacter.ts`, `api/naruto.ts`,
   `components/ui/SystemFilter/`.
3. Client: editar as costuras (`App.tsx`, `constants.ts`, `character.ts`,
   `calculations.ts`, `api/index.ts`, `SelectPage.tsx`,
   `PartySelectPage.tsx`, `SelectGrid.tsx`, `Topbar.tsx`, `CombatCard.tsx`,
   `ViewCharacterPage.tsx` com a guarda da seção 4, `combat.ts`,
   `tokens.css`).
4. `npx tsc -b --force` até compilar limpo nos dois lados.
5. Documentação: `README.md`, `openapi.yaml`.
6. Verificação manual (seção seguinte) antes de build/deploy.

## Plano de teste (navegador)

- Fluxos Tormenta continuam intactos: criar personagem, abrir ficha, atacar,
  conjurar magia, criar grupo, abrir combat tracker, ver ficha de outro
  membro do grupo (`ViewCharacterPage`).
- Modal "Novo Personagem" e "Novo Grupo" não oferecem mais opção Naruto —
  só Tormenta 20, sem seletor de sistema (só um sistema existe).
- Lista de personagens e de grupos não mostram mais abas de filtro por
  sistema.
- Acessar uma URL antiga `/naruto/char?id=<id real do banco>` redireciona
  para `/auth` (ou `/characters`, se já logado, via lógica de auth
  existente) em vez de crashar.
- Acessar a URL de uma party Naruto real existente (`/naruto/party/<id
  real>`) mostra a mensagem de "sistema não suportado" da seção 4, sem tela
  branca.
- Confirmar via uma consulta direta ao Mongo (`db.characters.find({system:
  'naruto'})`, sem escrever nada) que os documentos de Naruto continuam lá,
  inalterados, depois do deploy.
