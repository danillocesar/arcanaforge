# Calendário de sessões do grupo

## Objetivo

O grupo de RPG tem 6 pessoas (5 jogadores + mestre) e hoje combina datas de
sessão fora do app (WhatsApp, conversa avulsa), o que frequentemente resulta
em marcar sem todo mundo confirmar. Esta feature adiciona, dentro da tela de
"Grupo" já existente, um jeito de propor uma data de sessão e cada membro
(incluindo o mestre) confirmar ou recusar. A sessão só é considerada marcada
quando todos confirmarem "sim"; enquanto isso, um aviso visual (vermelho)
mostra quem ainda falta confirmar ou quem recusou. Quando alguém propõe uma
data nova, os outros membros recebem um e-mail avisando que precisam ir
confirmar.

## Decisões já validadas com o usuário (brainstorm anterior)

- Qualquer membro do grupo pode propor uma data (não só o mestre).
- Pode haver várias propostas abertas em paralelo.
- Ao propor, os outros membros começam com resposta pendente — quem propôs
  também precisa confirmar explicitamente, não é automático.
- Proposta confirmada = todos os membros do grupo marcaram "sim". Se alguém
  marcar "não" ou ainda estiver pendente, a proposta mostra aviso vermelho
  listando quem falta/recusou.
- Notificação por e-mail (WhatsApp fica de fora por enquanto — exigiria API
  paga/aprovação de template, fora de escopo).
- Cada proposta tem data + horário.
- Quem propôs pode cancelar a própria proposta. Qualquer um pode trocar o
  próprio voto depois. Confirmar uma proposta não cancela as outras
  automaticamente — cancelamento das demais é manual.

## Escopo

**Dentro do escopo:**
- Schema novo (`sessionProposals`) embutido no documento `Party` existente.
- 3 endpoints REST: propor, responder, cancelar.
- E-mail via Resend disparado ao criar uma proposta (fire-and-forget, nunca
  bloqueia nem falha a criação da proposta).
- Nova aba "Calendário" ao lado de "Membros"/"Combate" nas páginas de grupo.
- Reaproveita o WebSocket existente (`party_roster_sync`) para sincronização
  em tempo real — nenhum tipo de mensagem novo é necessário.

**Fora do escopo (não fazer agora):**
- Notificação via WhatsApp — só e-mail, por decisão do usuário.
- Grade de calendário mensal (visualização tipo "Google Calendar"). O que se
  pede é uma lista de propostas de data com status de confirmação — não uma
  grade visual de mês. Se o usuário quiser isso depois, é uma extensão
  separada.
- Exportação para calendário externo (ICS, Google Calendar).
- Sessões recorrentes ("toda terça").
- Qualquer tratamento de fuso horário além de guardar data/hora como o
  mestre/proponente digitou — o grupo já joga no mesmo fuso, então não há
  necessidade de conversão.
- Widget de date-picker customizado — usa `<input type="date">` /
  `<input type="time">` nativos (já são os tipos de input corretos para
  esse dado; o app não tem nenhum precedente de calendário custom e criar um
  agora seria escopo não pedido).

## 1. Modelo de dados

Adiciona dois sub-schemas e um campo em `server/db/models/Party.js`:

```js
const sessionResponseSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  vote: { type: String, enum: ['sim', 'nao'], required: true },
  respondedAt: { type: Date, default: Date.now },
}, { _id: false });

const sessionProposalSchema = new mongoose.Schema({
  id: { type: String, required: true },
  proposedBy: { type: String, required: true },
  date: { type: String, required: true },   // 'YYYY-MM-DD'
  time: { type: String, default: '' },      // 'HH:mm', opcional
  createdAt: { type: Date, default: Date.now },
  responses: { type: [sessionResponseSchema], default: [] },
}, { _id: false });
```

E em `partySchema`:

```js
sessionProposals: { type: [sessionProposalSchema], default: [] },
```

**Por que "pendente" não é um valor armazenado:** um membro sem entrada em
`responses` está pendente. Isso evita ter que modelar `null` dentro de um
`enum` do Mongoose e mantém a leitura "quem falta responder" como um diff
simples entre `party.members` e `proposal.responses` — feito no client, sem
campo derivado para manter sincronizado no banco.

`id` da proposta é gerado com a mesma função já usada para IDs de party:
`generatePartyId()` de `server/src/utils/inviteCode.js` (timestamp base36 +
sufixo aleatório) — não precisa de uma nova função geradora.

## 2. Endpoints REST

Adicionados em `server/src/routes/parties.routes.js`, seguindo o padrão
`asyncHandler` já usado nas rotas existentes:

```js
router.post('/api/parties/:id/sessions', asyncHandler(partyController.proposeSession));
router.post('/api/parties/:id/sessions/:proposalId/respond', asyncHandler(partyController.respondToSession));
router.delete('/api/parties/:id/sessions/:proposalId', asyncHandler(partyController.cancelSession));
```

**`POST /api/parties/:id/sessions`** — propor uma data.
- Body: `{ date: string, time?: string }`.
- Autorização: qualquer membro do grupo (dono ou membro comum).
- Validação: `date` obrigatório, formato `YYYY-MM-DD` (regex simples);
  `time`, se presente, formato `HH:mm`.
- Retorna: o `Party` inteiro atualizado (mesmo padrão de
  `addCharacterToParty`/`applyBuff`, que devolvem `toPartyDTO`).

**`POST /api/parties/:id/sessions/:proposalId/respond`** — votar.
- Body: `{ vote: 'sim' | 'nao' }`.
- Autorização: qualquer membro do grupo. Sobrescreve o próprio voto anterior
  se já existir um (troca de ideia permitida, por decisão já validada).
- Retorna: `Party` atualizado.

**`DELETE /api/parties/:id/sessions/:proposalId`** — cancelar uma proposta.
- Autorização: quem propôs (`proposal.proposedBy === uid`) **ou** o dono do
  grupo (assumindo que o mestre deve poder remover uma proposta obsoleta
  mesmo que não tenha sido ele quem propôs — **decisão nova, não validada
  ainda**; avise se preferir só o proponente poder cancelar).
- Retorna: `Party` atualizado.

## 3. Camada de serviço

Adicionado em `server/src/services/party.service.js`, seguindo exatamente o
padrão já usado por `addCharacterToParty`/`applyBuff` (busca o doc completo
via repository, muta o array em memória, `party.save()`, dispara o
broadcast):

```js
function isValidDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isValidTime(s) {
  return typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);
}

async function proposeSession(partyId, body, req) {
  const { date, time } = body || {};
  if (!isValidDate(date)) throw new AppError(400, 'Data inválida (esperado YYYY-MM-DD)');
  if (time && !isValidTime(time)) throw new AppError(400, 'Horário inválido (esperado HH:mm)');

  const party = await partyRepository.findMemberParty(partyId, req.user.uid);
  if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

  const proposal = {
    id: generatePartyId(),
    proposedBy: req.user.uid,
    date,
    time: time || '',
    createdAt: new Date(),
    responses: [],
  };
  party.sessionProposals.push(proposal);
  await party.save();
  refs.broadcastPartyRoster(partyId);

  sendSessionProposalEmail(party, proposal).catch((err) => {
    console.error('Falha ao enviar e-mail de proposta de sessão:', err.message);
  });

  return toPartyDTO(party.toObject());
}

async function respondToSession(partyId, proposalId, body, uid) {
  const { vote } = body || {};
  if (vote !== 'sim' && vote !== 'nao') throw new AppError(400, 'vote deve ser "sim" ou "nao"');

  const party = await partyRepository.findMemberParty(partyId, uid);
  if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

  const proposal = party.sessionProposals.find((p) => p.id === proposalId);
  if (!proposal) throw new AppError(404, 'Proposta não encontrada');

  const existing = proposal.responses.find((r) => r.uid === uid);
  if (existing) {
    existing.vote = vote;
    existing.respondedAt = new Date();
  } else {
    proposal.responses.push({ uid, vote, respondedAt: new Date() });
  }
  await party.save();
  refs.broadcastPartyRoster(partyId);
  return toPartyDTO(party.toObject());
}

async function cancelSession(partyId, proposalId, uid) {
  const party = await partyRepository.findMemberParty(partyId, uid);
  if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

  const proposal = party.sessionProposals.find((p) => p.id === proposalId);
  if (!proposal) throw new AppError(404, 'Proposta não encontrada');
  if (proposal.proposedBy !== uid && party.ownerUid !== uid) {
    throw new AppError(403, 'Só quem propôs ou o dono do grupo pode cancelar');
  }

  party.sessionProposals = party.sessionProposals.filter((p) => p.id !== proposalId);
  await party.save();
  refs.broadcastPartyRoster(partyId);
  return toPartyDTO(party.toObject());
}
```

Import adicional no topo do arquivo: `const { sendSessionProposalEmail } = require('./email.service');`
(além do já existente `generatePartyId` de `../utils/inviteCode`, que já é
importado nesse arquivo). As três funções entram no objeto retornado por
`createPartyService`, junto das já existentes.

`respondToSession`/`cancelSession` recebem `proposalId` como parâmetro
separado (não dentro de `body`) porque vem de `req.params.proposalId`,
igual ao padrão já usado em `getPartyCharacter(partyId, characterId, uid)`.

**Nenhuma mudança em `server/src/repositories/party.repository.js`:** as
três funções usam `partyRepository.findMemberParty`, que já existe e já
retorna o documento Mongoose completo (não `.lean()`), pronto para
`.save()` — mesma função já usada por `addCharacterToParty`.

## 4. Controller e DTO

`server/src/controllers/party.controller.js` ganha 3 métodos finos, no
mesmo padrão dos existentes:

```js
async proposeSession(req, res) {
  res.json(await partyService.proposeSession(req.params.id, req.body, req));
},
async respondToSession(req, res) {
  res.json(await partyService.respondToSession(req.params.id, req.params.proposalId, req.body, req.user.uid));
},
async cancelSession(req, res) {
  res.json(await partyService.cancelSession(req.params.id, req.params.proposalId, req.user.uid));
},
```

**DTO: nenhuma mudança necessária.** `toPartyDTO` (em
`server/src/dto/party.dto.js`) desestrutura só `_id`/`__v`/`createdAt`/
`updatedAt`/`ownerEmail` e espalha o resto (`...rest`) — `sessionProposals`
atravessa automaticamente. Como os sub-schemas usam `{ _id: false }`, não
sobra nenhum `_id` de subdocumento vazando pro client.

## 5. Tempo real (WebSocket)

Nenhuma mensagem nova. As três operações (`proposeSession`,
`respondToSession`, `cancelSession`) chamam `refs.broadcastPartyRoster(id)`
exatamente como as mutações de party já existentes. No client, o handler já
existente em `PartyMembersPage`/`GameMasterPage` — que escuta
`party_roster_sync` e chama `loadDataRef.current()` — dispara sozinho; a
nova `PartyCalendarPage` implementa o mesmo padrão de assinatura (ver seção
9).

## 6. E-mail (Resend)

Novo arquivo `server/src/services/email.service.js`:

```js
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'ArcanaForge <onboarding@resend.dev>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function sendSessionProposalEmail(party, proposal) {
  if (!resend) return; // sem chave configurada: recurso continua funcionando só via UI

  const proposer = party.members.find((m) => m.uid === proposal.proposedBy);
  const recipients = party.members
    .filter((m) => m.uid !== proposal.proposedBy && m.email)
    .map((m) => m.email);
  if (recipients.length === 0) return;

  const when = proposal.time ? `${proposal.date} às ${proposal.time}` : proposal.date;
  const link = `${CLIENT_URL}/tormenta/party/${party._id}/calendar`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: recipients,
    subject: `${party.name}: nova data de sessão proposta`,
    html: `<p>${proposer?.email || 'Alguém'} propôs jogar em <strong>${when}</strong>.</p>
           <p><a href="${link}">Confirme ou recuse aqui</a>.</p>`,
    text: `${proposer?.email || 'Alguém'} propôs jogar em ${when}. Confirme ou recuse em: ${link}`,
  });
}

module.exports = { sendSessionProposalEmail };
```

Dependência nova: `resend` (adicionar em `server/package.json`). Variáveis
novas em `.env.example`:

```
# Resend (e-mail de notificação de propostas de sessão). SEGREDO.
RESEND_API_KEY=
EMAIL_FROM=ArcanaForge <onboarding@resend.dev>
```

(`CLIENT_URL` já existe no `.env.example` para o fluxo do Stripe — é
reaproveitada aqui, sem variável nova.)

**Limitação importante do Resend a avisar ao usuário (não é bug, é do
provedor):** sem verificar um domínio próprio no painel do Resend, o
remetente `onboarding@resend.dev` só entrega para o e-mail da própria conta
que criou a chave de API — e-mails para os outros 5 jogadores **não vão
chegar** nesse modo sandbox. Para o grupo inteiro receber de fato, é preciso
verificar um domínio (mesmo um domínio pessoal simples, via DNS) no painel
do Resend. Por isso o design acima trata o e-mail como um extra opcional
que nunca bloqueia nem quebra a criação da proposta: se `RESEND_API_KEY` não
estiver configurada (ou o envio falhar), a proposta é criada normalmente e
todo mundo ainda vê e confirma pela UI — o e-mail é só um lembrete a mais.

## 7. Tipos do client

Em `client/src/types/party.ts`:

```ts
export interface SessionResponse {
  uid: string;
  vote: 'sim' | 'nao';
  respondedAt: string;
}

export interface SessionProposal {
  id: string;
  proposedBy: string;
  date: string;   // 'YYYY-MM-DD'
  time: string;   // 'HH:mm' ou ''
  createdAt: string;
  responses: SessionResponse[];
}

export interface Party {
  id: string;
  name: string;
  system: RPGSystem;
  inviteCode: string;
  ownerUid: string;
  ownerEmail: string;
  members: PartyMember[];
  sessionProposals: SessionProposal[]; // campo novo
}
```

## 8. Cliente API

Em `client/src/api/parties.ts`, seguindo o padrão exato das funções
existentes (`apiFetch` + `assertOk` + `res.json()`):

```ts
export async function apiProposeSession(
  partyId: string,
  data: { date: string; time?: string },
): Promise<Party> {
  const res = await apiFetch(`/api/parties/${encodeURIComponent(partyId)}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await assertOk(res);
  return res.json();
}

export async function apiRespondToSession(
  partyId: string,
  proposalId: string,
  vote: 'sim' | 'nao',
): Promise<Party> {
  const res = await apiFetch(
    `/api/parties/${encodeURIComponent(partyId)}/sessions/${encodeURIComponent(proposalId)}/respond`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    },
  );
  await assertOk(res);
  return res.json();
}

export async function apiCancelSession(partyId: string, proposalId: string): Promise<Party> {
  const res = await apiFetch(
    `/api/parties/${encodeURIComponent(partyId)}/sessions/${encodeURIComponent(proposalId)}`,
    { method: 'DELETE' },
  );
  await assertOk(res);
  return res.json();
}
```

## 9. Página, rota e navegação

**Rota nova** em `client/src/App.tsx`, ao lado das outras rotas de party:

```tsx
<Route path="/:system/party/:partyId/calendar" element={<RequireAuth><PartyCalendarPage /></RequireAuth>} />
```

**Nova página** `client/src/pages/PartyCalendarPage/PartyCalendarPage.tsx` +
`.module.css`, estrutura análoga a `PartyMembersPage.tsx`:
- Carrega a party via `apiFetchParties()` + `.find(p => p.id === partyId)`
  (mesmo padrão de carregamento, incluindo `AccessDeniedPage` se não achar).
- Assina `useWebSocket` com o mesmo filtro `party_roster_sync` +
  `partyId` já usado em `PartyMembersPage`, chamando um `loadData()` local.
- Renderiza `SectionNav` com os 3 itens (ver abaixo) e `Topbar
  title={\`Grupo - ${party.name}\`} showTormentaLogo`.
- Formulário de nova proposta: dois `Input` (`type="date"`, `type="time"`)
  + botão "Propor data" → `apiProposeSession`.
- Lista de propostas (mais recentes primeiro), cada uma mostrando:
  - Data/hora e quem propôs.
  - Para cada membro do grupo: um chip com nome/e-mail e ✓ (sim) / ✗ (não)
    / "aguardando" (pendente) — pendente e "não" usam a cor de aviso
    vermelha já usada no app (`--danger`/tom vermelho do `bannerExpired` em
    `SelectPage.module.css`, para consistência visual).
  - Dois botões de voto ("Sim, posso" / "Não posso") para o próprio uid.
  - Um destaque verde ("Sessão confirmada! 🎲") quando todos os membros
    tiverem `vote: 'sim'`.
  - Botão "Cancelar proposta", visível só para quem propôs ou o dono.

**Nav items atualizados** (adicionar o 3º item nas duas páginas que já
existem, seguindo o padrão de `onClick` + `navigate` já usado):

`PartyMembersPage.tsx`:
```ts
const navItems = useMemo(
  () => [
    { id: 'members', label: 'Membros', active: true },
    { id: 'combat', label: 'Combate', onClick: () => navigate(`/${system}/party/${partyId}`) },
    { id: 'calendar', label: 'Calendário', onClick: () => navigate(`/${system}/party/${partyId}/calendar`) },
  ],
  [navigate, system, partyId],
);
```

`GameMasterPage.tsx`: mesmo padrão, adicionando o item `calendar` ao array
`navItems` já existente (linha ~116-120), com `active: true` na nova página
e os outros dois com `onClick`/`navigate`.

## Compatibilidade

- Parties existentes no Mongo não têm `sessionProposals`. O `default: []` do
  schema cobre isso para documentos Mongoose hidratados normalmente (ex.:
  `findMemberParty`, usado por `proposeSession`/`respondToSession`/
  `cancelSession`), mas **não** cobre leituras via `.lean()` — Mongoose não
  aplica defaults de schema em `.lean()`, então `listParties`/
  `findVisibleToUser` (usado por `GET /api/parties`) devolvia
  `sessionProposals: undefined` para parties antigas, quebrando o client
  (`[...party.sessionProposals]` crashava). Corrigido em `toPartyDTO`
  (`server/src/dto/party.dto.js`) com `sessionProposals: rest.sessionProposals || []`,
  no mesmo padrão já usado ali para `characterIds`. Nenhuma migração de dado
  é necessária — a normalização acontece na borda de saída (DTO), não no
  banco.
- Nenhuma mudança em endpoints existentes; é só adição.
- Se `RESEND_API_KEY` nunca for configurada, a feature continua 100%
  funcional via UI — só o lembrete por e-mail não sai (ver seção 6).

## Plano de teste

- **Backend (manual via curl/Postman, já que o projeto não tem testes de
  integração de rota ainda):** propor sessão como membro A, ver
  `sessionProposals` no `GET /api/parties`; responder como membros B-F;
  confirmar que o array `responses` reflete cada voto e troca de voto
  sobrescreve; cancelar como não-proponente e não-dono → 403; cancelar como
  dono → sucesso mesmo não sendo o proponente.
- **Frontend (manual no browser, replicando o padrão usado nas fases
  anteriores desta sessão):** propor uma data pela UI, confirmar que os
  outros membros (testar com 2 contas/abas) veem a proposta aparecer via
  WebSocket sem F5; votar sim/não e ver o aviso vermelho listar quem falta;
  votar sim em todos e ver o destaque de confirmação aparecer; cancelar uma
  proposta e ver ela sumir para todos.
- **E-mail:** testar com `RESEND_API_KEY` de sandbox apontando só para o
  e-mail do próprio dev (limitação da seção 6) — confirmar que o e-mail
  chega com o link correto; testar também sem `RESEND_API_KEY` definida,
  confirmando que a proposta ainda é criada normalmente (sem exception no
  servidor).
- `cd client && npx tsc -b --force` e `npx vitest run` devem continuar
  passando (o `Party` type ganha um campo novo, não remove nada existente).
