# Integração com Google Agenda

## Objetivo

Hoje o calendário do grupo (spec de 2026-08-18) resolve *combinar* a data: cada
membro confirma ou recusa, e a sessão só conta como marcada quando todos dizem
"sim". Mas a data confirmada morre dentro do ArcanaForge — ninguém tem o
compromisso na agenda que usa no dia a dia.

Esta feature fecha esse buraco: quando uma proposta passa a estar confirmada por
todos, o ArcanaForge cria o evento correspondente no Google Agenda, com os outros
membros como convidados. A spec original listava "Exportação para calendário
externo (ICS, Google Calendar)" como fora de escopo; é exatamente isso que entra
agora.

## Decisões validadas com o usuário (brainstorm de 2026-08-31)

- **Um evento com convidados**, não uma cópia por pessoa. O evento é criado numa
  agenda só, e os outros membros entram como convidados por e-mail — o Google
  manda os convites nativos. Só uma pessoa precisa ligar a conta, e o app guarda
  credencial de uma pessoa por grupo em vez de todas.
- **Manter sincronizado**, não "criar e esquecer". Trocar o voto para "não posso"
  ou cancelar a proposta desfaz o evento no Google.
- **Alcance atual: só a mesa do usuário.** O app OAuth fica em modo "Testing" no
  Google Cloud, sem passar pela verificação do Google.
- **Escopo estreito por padrão** (`calendar.app.created`): o ArcanaForge cria um
  calendário secundário próprio e só mexe nele, em vez de pedir acesso de leitura
  e escrita a toda a agenda da pessoa.

## Restrições externas confirmadas

Duas coisas foram verificadas na documentação do Google e limitam o desenho:

1. **Refresh token expira em 7 dias em modo "Testing".** A doc de OAuth 2.0 diz
   que um projeto com consent screen de tipo externo e publishing status
   "Testing" recebe refresh token válido por 7 dias, a menos que os únicos
   escopos pedidos sejam perfil/e-mail. Qualquer escopo de calendário cai na
   regra. Consequência: na configuração escolhida, religar a conta a cada semana
   é comportamento esperado, não defeito — e o tratamento de "link quebrado"
   deixa de ser caso de borda e passa a ser caminho principal.
2. **`calendar.app.created` existe e é estreito:** "Make secondary Google
   calendars, and see, create, change, and delete events on them".

Uma coisa **não** foi confirmada: se `calendar.app.created` é classificado como
sensível. A página de verificação de escopos sensíveis do Google não publica a
classificação por escopo e remete à referência de cada API. O lugar que responde
isso é o Google Cloud Console, que rotula cada escopo como Non-sensitive /
Sensitive / Restricted no momento de adicioná-lo. Importa porque, se for
não-sensível, dá para publicar o app em produção sem verificação — e aí o limite
de 7 dias do item 1 deixa de existir.

Referências:
- <https://developers.google.com/identity/protocols/oauth2>
- <https://developers.google.com/workspace/calendar/api/auth>
- <https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification>

## Uma interpretação que precisa de conferência

O usuário pediu "criar o evento na agenda do usuário logado", e escolheu o
modelo de um evento com convidados. Os dois juntos não fecham: com um evento
único, alguém tem que ser o organizador.

**Decisão desta spec: o organizador é o dono do grupo.** O dono liga a conta
Google, e o evento nasce no calendário dele com os demais membros como
convidados. Motivo: é previsível (o evento sempre está no mesmo lugar), exige
exatamente um link por grupo, e o dono é normalmente o mestre — quem de fato
organiza a sessão. A alternativa (organizador = quem propôs) espalharia os
eventos por contas diferentes conforme quem propôs, e exigiria que todo mundo
ligasse a conta para funcionar de forma consistente.

Para os outros membros, o compromisso ainda chega na agenda pessoal — via
convite do Google, que ao ser aceito entra no calendário deles.

## Escopo

**Dentro do escopo:**

- Fluxo OAuth 2.0 completo com o Google (start + callback), com `state` assinado
  e de uso único.
- Coleção nova `googleLinks`, com o refresh token **cifrado em repouso**.
- Criação, sob demanda, de um calendário secundário "ArcanaForge" na conta do
  dono.
- Gatilho em `respondToSession`: proposta cruzou para confirmada, cria evento.
- Desfazer: voto virou "não posso" ou proposta cancelada, remove o evento.
- Estado "link quebrado" (token expirado, revogado, escopo mudado) visível na UI,
  com ação de religar.
- Fuso horário na proposta, para o evento não cair na hora errada.
- Sem dependência nova: Node 24 tem `fetch` global, e o `crypto` do próprio Node
  cobre a cifragem. As chamadas ao Google são REST direto.

**Fora do escopo (não fazer agora):**

- Uma cópia do evento por membro (a alternativa que o usuário não escolheu).
- Ler a agenda dos membros para sugerir horários livres (`freebusy`). É tentador
  e resolveria "quando todos podem?", mas é feature diferente, com escopo de
  leitura muito mais invasivo.
- Sincronização de volta: mudar o evento no Google **não** altera a proposta no
  ArcanaForge. Só o sentido ArcanaForge → Google.
- Outros provedores (Outlook, Apple) e export ICS.
- Sessões recorrentes.
- Lembrete/notificação própria do ArcanaForge (os lembretes ficam por conta do
  Google Agenda).
- Passar pela verificação do app no Google. A feature é construída de forma que
  publicar depois seja mudança de configuração, não de código.
- Fila de retentativa para falhas de criação (ver secção 7).

## 1. Modelo de dados

### 1.1 Coleção nova: `googleLinks`

Uma credencial por usuário, em coleção separada — deliberadamente **não** dentro
de `User`. Assim a credencial vive num lugar só, fácil de revogar e de manter
fora de qualquer DTO que já circula pela API.

```js
// server/db/models/GoogleLink.js
{
  _id: String,             // uid do Firebase
  email: String,           // conta Google que autorizou (para mostrar na UI)
  refreshTokenEnc: String, // AES-256-GCM, "iv:authTag:ciphertext" em base64
  scope: String,           // escopos concedidos, como o Google devolveu
  calendarId: String,      // id do calendário secundário criado pelo app
  linkedAt: Date,
  lastError: String,       // null quando saudável; motivo quando quebrado
}
```

`refreshTokenEnc` nunca sai do server. Nenhum endpoint devolve esse campo, e o
DTO do link expõe só `{ linked, email, calendarId, lastError }`.

O access token **não** é persistido: é derivado do refresh token na hora de usar
e descartado.

### 1.2 Coleção nova: `googleOauthStates`

```js
{
  _id: String,     // nonce aleatório (32 bytes hex)
  uid: String,
  createdAt: Date, // índice TTL de 10 minutos
}
```

Existe para tornar o `state` de uso único (ver secção 2.2). O índice TTL do Mongo
faz a limpeza.

### 1.3 Campos novos na proposta de sessão

Em `sessionProposals` (sub-schema de `Party`):

```js
{
  // campos existentes: id, proposedBy, date, time, createdAt, responses
  timezone: String,          // IANA, ex. "America/Sao_Paulo"; '' quando desconhecido
  googleEvent: {
    eventId: String,
    calendarId: String,
    syncedBy: String,        // uid de quem era o dono quando o evento nasceu
    createdAt: Date,
  },
}
```

`googleEvent` presente é o que garante idempotência: se já existe `eventId`, não
se cria outro. Sem isso, dois votos quase simultâneos criam dois eventos.

## 2. Fluxo OAuth

### 2.1 Início

`GET /api/google/oauth/start` (com `requireAuth`) monta e devolve a URL de
consentimento:

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=<GOOGLE_CLIENT_ID>
  &redirect_uri=<GOOGLE_REDIRECT_URI>
  &response_type=code
  &scope=<GOOGLE_CALENDAR_SCOPE>
  &access_type=offline
  &prompt=consent
  &state=<nonce assinado>
```

`access_type=offline` é o que faz o Google devolver refresh token. `prompt=consent`
força a tela mesmo em re-autorização — necessário porque, sem ela, o Google pode
omitir o refresh token numa segunda autorização.

### 2.2 Callback

`GET /api/google/oauth/callback?code=...&state=...` — **sem `requireAuth`**, e
esse é o ponto delicado: o callback é um redirect de navegador vindo do Google,
sem header `Authorization`. Logo, quem autentica a requisição é o `state`.

O `state` é `base64url(uid.nonce.exp)` mais `.` mais o HMAC-SHA256 da mesma
carga.

**Duas subchaves, não uma.** `GOOGLE_TOKEN_ENC_KEY` não é usada direto nos dois
lugares: dela saem duas subchaves por HKDF-SHA256, com `info` distinto
(`"arcanaforge:token-enc"` e `"arcanaforge:oauth-state"`). Reaproveitar a mesma
chave para cifrar e para assinar é o tipo de atalho que só dá problema depois.

O callback:

1. Confere a assinatura HMAC (comparação em tempo constante) e o `exp`.
2. Consome o nonce em `googleOauthStates` com um `findOneAndDelete`. Se não achar,
   rejeita: ou já foi usado, ou expirou pelo TTL.
3. Troca o `code` por tokens em `POST https://oauth2.googleapis.com/token`.
4. Cria o calendário secundário (`POST /calendar/v3/calendars` com
   `{ summary: 'ArcanaForge', timeZone }`) e guarda o id devolvido. "Já existe" é
   decidido só pelo `calendarId` gravado no `googleLinks`: se o campo está
   preenchido, reaproveita. Se a pessoa apagou o calendário no Google, a próxima
   chamada devolve 404 — tratado como link quebrado (secção 7), e religar cria um
   calendário novo.
5. Grava o `googleLinks` com o refresh token cifrado.
6. Redireciona para o cliente com `?google=ok` ou `?google=error&reason=...`.

Sem os passos 1 e 2 o endpoint aceita CSRF: qualquer um poderia induzir o
navegador do dono a completar um fluxo com um `code` de terceiro.

### 2.3 Uso e renovação

Toda chamada ao Google passa por um único módulo, que:

1. Lê o `googleLinks` e decifra o refresh token.
2. Troca por access token (`grant_type=refresh_token`), guardado só em memória
   pelo tempo da operação.
3. Faz a chamada REST.

Erro `invalid_grant` na renovação significa token expirado (os 7 dias), revogado
pelo usuário, ou escopo alterado. Todos caem no mesmo tratamento: grava
`lastError`, e a feature para de tentar até religarem.

### 2.4 Desconectar

`DELETE /api/google/link` revoga em `POST https://oauth2.googleapis.com/revoke` e
apaga o documento. O calendário secundário e os eventos já criados **ficam** na
conta da pessoa — apagar a agenda de alguém como efeito de "desconectar" seria
destrutivo e surpreendente. A UI diz isso.

## 3. Gatilho e sincronização

### 3.1 Onde

`respondToSession` (`server/src/services/party.service.js:294`) é o único caminho
pelo qual uma proposta pode virar confirmada. `cancelSession` é o único pelo qual
ela desaparece. Os dois ganham o efeito colateral, no mesmo padrão
fire-and-forget que `sendSessionProposalEmail` já usa.

**De qual conta sai o evento.** O `calendarSync` busca sempre o `googleLinks` do
`party.ownerUid` — nunca do usuário que votou. Quem vota pode não ter conta
ligada nenhuma; isso é irrelevante. Se o dono não tem link, ou o link está
quebrado, a função sai sem fazer nada e a confirmação segue normal.

**Ordem no cancelamento.** `cancelSession` remove a proposta do documento, então
o `googleEvent` tem que ser lido **antes** do `save()` e passado para o sync.
Fazer na ordem inversa perde o `eventId` e deixa evento órfão na agenda.

```js
syncGoogleEvent(party, proposal, prevStatus).catch((err) => {
  console.error('Falha ao sincronizar Google Agenda:', err.message);
});
```

Votar nunca pode falhar porque o Google está fora do ar. O erro vai para o log e
para `lastError`, não para a resposta HTTP.

### 3.2 Transições

O status é calculado antes e depois do `save()`, e a transição decide a ação:

| antes | depois | ação |
|---|---|---|
| não confirmada | confirmada | cria o evento (se não houver `googleEvent`) |
| confirmada | não confirmada | remove o evento e limpa `googleEvent` |
| confirmada | confirmada | nada |
| qualquer | proposta cancelada | remove o evento |

Trocar "não posso" de volta para "sim" cria um evento novo, com id novo. Correto:
o anterior foi cancelado no Google, com aviso aos convidados.

### 3.3 Corpo do evento

Com horário:

```js
{
  summary: 'Sessão: <nome do grupo>',
  description: 'Confirmada no ArcanaForge: <link da aba Calendário>',
  attendees: [/* e-mail de cada membro exceto o dono */],
  start: { dateTime: '2026-09-03T19:00:00', timeZone: 'America/Sao_Paulo' },
  end:   { dateTime: '2026-09-03T23:00:00', timeZone: 'America/Sao_Paulo' },
}
```

Sem horário (dia inteiro):

```js
{
  start: { date: '2026-09-03' },
  end:   { date: '2026-09-04' },  // fim exclusivo na API do Google
}
```

Criação e remoção usam `?sendUpdates=all`, para que os convidados recebam convite
e cancelamento.

Duração padrão: `SESSION_DURATION_HOURS = 4`, constante com comentário. Não há
campo de duração na proposta e inventar um agora é escopo não pedido; 4h é a
duração típica de uma sessão de mesa.

Para proposta sem horário, `end.date` é o dia seguinte porque a API do Google
trata o fim de evento de dia inteiro como exclusivo — usar a mesma data cria um
evento de duração zero.

## 4. Fuso horário

As propostas hoje guardam `date` mais `time` sem fuso, e a spec de 2026-08-18
explicitamente não tratava fuso ("o grupo já joga no mesmo fuso"). A Calendar API
exige um: sem `timeZone`, uma sessão às 19:00 pode aparecer como 19:00 UTC.

O cliente passa a mandar `Intl.DateTimeFormat().resolvedOptions().timeZone` ao
propor, guardado em `proposal.timezone`. Propostas antigas (sem o campo) e
qualquer caso em que o valor chegue vazio caem em `DEFAULT_TIMEZONE`
(`America/Sao_Paulo`, configurável por env).

Isso não muda nada na UI existente — a proposta continua sendo exibida como foi
digitada.

## 5. Endpoints

| Método | Rota | Auth | Devolve |
|---|---|---|---|
| GET | `/api/google/oauth/start` | `requireAuth` | `{ url }` |
| GET | `/api/google/oauth/callback` | `state` assinado | redirect para o cliente |
| GET | `/api/google/link` | `requireAuth` | `{ linked, email, calendarId, lastError }` |
| DELETE | `/api/google/link` | `requireAuth` | `{ ok: true }` |

Registrados em `server/src/routes/index.js` como `createGoogleRoutes()`, no mesmo
formato dos três conjuntos que já existem. `openapi.yaml` é atualizado.

## 6. Superfície de UI

- **`GroupInfoCard`** (sidebar que já aparece nas três abas de grupo) ganha uma
  linha "Google Agenda", **só para o dono do grupo**:
  - não ligado: botão "Conectar Google Agenda";
  - ligado: "Conectada como `x@gmail.com`" mais "Desconectar";
  - quebrado: aviso "Conexão expirou — religue para voltar a criar eventos", com
    o mesmo botão de conectar.
- **Proposta confirmada** (bloco na agenda e modal de detalhes) ganha um
  indicador discreto "no Google Agenda" quando `googleEvent.eventId` existe. Sem
  isso não há como saber se o evento foi criado ou se falhou em silêncio.
- **Retorno do OAuth**: o redirect volta para a aba Calendário do grupo com
  `?google=ok|error`, e a página mostra um `Toast` (componente já existente).

Nada da interface atual do calendário muda. As duas visualizações (agenda e
lista) seguem iguais.

## 7. Degradação e erros

O princípio é o mesmo do `email.service.js` (`if (!resend) return;`): sem
configuração, o recurso simplesmente não existe e o resto do app não sente.

| Situação | Comportamento |
|---|---|
| `GOOGLE_CLIENT_ID`/`SECRET` ausentes | Feature inteira desligada; a linha na UI não aparece |
| `GOOGLE_TOKEN_ENC_KEY` ausente | Feature desligada. **Nunca** guardar token em claro como alternativa |
| Dono não ligou a conta | Confirmação segue normal; nenhum evento é criado |
| `invalid_grant` na renovação | Grava `lastError`, marca link como quebrado, UI pede para religar |
| Google fora do ar / 5xx | Log; a proposta continua confirmada |
| Membro sem e-mail no grupo | Entra no evento sem ser convidado; não impede a criação |

Não há retentativa automática nesta versão. Se a criação falhar, a proposta fica
confirmada sem evento, e a ausência do indicador "no Google Agenda" é o sinal.
Uma fila de retentativa é extensão separada, se a falha se mostrar comum.

## 8. Riscos e ordem de ataque

**Risco 1 — o pilar da abordagem escolhida não foi validado.** Não está
confirmado que um evento num calendário secundário criado pelo app (escopo
`calendar.app.created`) consegue convidar terceiros e disparar os convites do
Google. Se não conseguir, o modelo "um evento com convidados" não funciona com o
escopo estreito.

Por isso o **primeiro passo do plano é um spike descartável**: ligar uma conta
com o escopo estreito, criar um evento com um convidado, verificar se o convite
chega. Se não funcionar, o design troca o escopo para `calendar.events` — o resto
da arquitetura (fluxo, cifragem, gatilho, sincronização) não muda, só o escopo
pedido e a postura de segurança, que passa a ser bem mais invasiva e merece nova
conversa com o usuário antes de seguir.

**Risco 2 — classificação do escopo.** Conferir no Google Cloud Console se
`calendar.app.created` aparece como Non-sensitive. Se sim, publicar em produção
sem verificação é possível e o limite de 7 dias desaparece. Não bloqueia a
implementação.

**Risco 3 — os 7 dias.** Já mitigado por desenho: "link quebrado" é estado de
primeira classe, com caminho de religar na UI.

## 9. Módulos

```
server/
  db/models/GoogleLink.js                 modelo novo
  db/models/GoogleOauthState.js           modelo novo (TTL)
  db/models/Party.js                      + timezone, + googleEvent na proposta
  src/repositories/googleLink.repository.js
  src/services/google/tokenCrypto.js      AES-256-GCM (puro, testável)
  src/services/google/oauthState.js       assina/verifica state (puro, testável)
  src/services/google/googleApi.js        ÚNICO lugar com fetch para o Google
  src/services/google/calendarSync.js     transições + corpo do evento
  src/controllers/google.controller.js
  src/routes/google.routes.js
  src/services/party.service.js           + gatilho em respondToSession/cancelSession

client/src/
  api/google.ts                           chamadas dos 4 endpoints
  components/party/GoogleCalendarLink/    linha na sidebar
  components/party/GroupInfoCard/         + a linha (só dono)
  pages/PartyCalendarPage/                lê ?google=ok|error e mostra Toast
  components/party/SessionAgenda/         indicador "no Google Agenda"
  components/party/ProposalDetailModal/   indicador "no Google Agenda"
```

A separação existe para que `googleApi.js` seja o único módulo que fala rede: tudo
acima dele é testável sem tocar no Google.

## 10. Testes

Server (`node --test`, padrão `server/src/**/*.test.js` já configurado em
`npm run test:server`):

- `tokenCrypto`: round-trip cifra/decifra; texto adulterado é rejeitado pelo
  authTag; chave ausente desliga em vez de guardar em claro.
- `oauthState`: assina e verifica; assinatura adulterada rejeitada; `exp`
  vencido rejeitado; carga com uid diferente não passa.
- `calendarSync` (transições): cada linha da tabela da secção 3.2; idempotência
  (com `googleEvent` presente, não cria de novo).
- `calendarSync` (corpo do evento): com horário usa `dateTime` mais `timeZone`;
  sem horário usa `date` com fim no dia seguinte; convidados excluem o dono;
  `timezone` vazio cai no default.

Client (`vitest`):

- Estados da linha da sidebar: não ligado / ligado / quebrado.
- Indicador "no Google Agenda" aparece só com `googleEvent.eventId`.

Nenhum teste chama o Google. A validação de ponta a ponta é o spike do Risco 1 e
depois um teste manual no app rodando, como foi feito na agenda semanal.

## 11. Configuração

`.env` (e `.env.example`):

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/oauth/callback
GOOGLE_TOKEN_ENC_KEY=          # 32 bytes em base64: openssl rand -base64 32
GOOGLE_CALENDAR_SCOPE=https://www.googleapis.com/auth/calendar.app.created
DEFAULT_TIMEZONE=America/Sao_Paulo
```

No Google Cloud Console, fora do código: projeto com OAuth consent screen de tipo
externo em status "Testing", a conta do usuário na lista de test users, o escopo
adicionado (é aqui que se lê o rótulo Non-sensitive / Sensitive), e a redirect URI
registrada no cliente OAuth.

`GOOGLE_CALENDAR_SCOPE` é env, e não constante, justamente para a troca do Risco 1
não exigir mudança de código.
