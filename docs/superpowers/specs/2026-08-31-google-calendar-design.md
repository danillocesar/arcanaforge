# Integração com Google Agenda

## Objetivo

Hoje o calendário do grupo (spec de 2026-08-18) resolve *combinar* a data: cada
membro confirma ou recusa, e a sessão só conta como marcada quando todos dizem
"sim". Mas a data confirmada morre dentro do ArcanaForge — ninguém tem o
compromisso na agenda que usa no dia a dia.

Esta feature fecha esse buraco: quando uma proposta passa a estar confirmada por
todos, o ArcanaForge cria o evento da sessão **no Google Agenda de cada membro
que ligou a própria conta**. A spec original listava "Exportação para calendário
externo (ICS, Google Calendar)" como fora de escopo; é exatamente isso que entra
agora.

## Decisões validadas com o usuário (brainstorm de 2026-08-31)

- **Uma cópia por membro.** Cada membro liga a própria conta Google e recebe o
  evento direto no próprio calendário — sem convite para aceitar. Não existe
  "organizador": são N eventos independentes, um por pessoa. A alternativa
  considerada e recusada era um evento único na conta do dono com os outros como
  convidados.
- **Manter sincronizado**, não "criar e esquecer". Trocar o voto para "não posso"
  ou cancelar a proposta desfaz os eventos no Google.
- **App publicado, não em modo Testing.** Requisito explícito do usuário: ligar a
  conta é uma vez, não toda semana. Isso obriga o publishing status a ser "In
  production" — é o status "Testing" que impõe o prazo de 7 dias no refresh
  token. Ver "Por que o app precisa estar publicado", abaixo.
- **Escopo estreito** (`calendar.app.created`): o ArcanaForge cria um calendário
  secundário próprio na conta de cada pessoa e só mexe nele, em vez de pedir
  acesso de leitura e escrita a toda a agenda.

## Restrições externas confirmadas

Duas coisas foram verificadas na documentação do Google e limitam o desenho:

1. **Refresh token expira em 7 dias em modo "Testing".** A doc de OAuth 2.0 diz
   que um projeto com consent screen de tipo externo e publishing status
   "Testing" recebe refresh token válido por 7 dias, a menos que os únicos
   escopos pedidos sejam perfil/e-mail. Qualquer escopo de calendário cai na
   regra.
2. **`calendar.app.created` existe e é estreito:** "Make secondary Google
   calendars, and see, create, change, and delete events on them".

Uma coisa **não** foi confirmada: se `calendar.app.created` é classificado como
sensível. A página de verificação de escopos sensíveis do Google não publica a
classificação por escopo e remete à referência de cada API. O lugar que responde
isso é o Google Cloud Console, que rotula cada escopo como Non-sensitive /
Sensitive / Restricted no momento de adicioná-lo. O que ficou estabelecido:
**nenhum** escopo de Calendar aparece na lista oficial de escopos *restricted*,
então o pior caso está descartado.

A classificação decide só uma coisa: se os membros veem a tela de "app não
verificado" ao ligar a conta. Ela **não** afeta o prazo do refresh token, que
depende do publishing status — ver a secção seguinte.

Referências:
- <https://developers.google.com/identity/protocols/oauth2>
- <https://developers.google.com/workspace/calendar/api/auth>
- <https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification>

## Por que o app precisa estar publicado

"Uma cópia por membro" multiplica qualquer atrito de autorização por N: cada
pessoa da mesa autoriza a própria conta. Se cada refresh token durasse 7 dias,
seriam 6 pessoas religando a agenda toda semana, e na prática quase sempre haveria
alguém com o link quebrado. O usuário descartou esse cenário: ligar é uma vez.

O prazo de 7 dias vem do **publishing status "Testing"**, não da falta de
verificação — a doc de OAuth 2.0 amarra a regra explicitamente a esse status. A
consequência prática:

| Publishing status | Verificado? | Refresh token | Tela de aviso ao ligar |
|---|---|---|---|
| Testing | n/a | expira em 7 dias | não |
| In production | não | não expira por status | sim, uma vez por pessoa |
| In production | sim | não expira por status | não |

**A configuração escolhida é a linha do meio:** status "In production", sem
esperar verificação. Isso entrega o requisito ("ligar uma vez") de imediato. O
custo é cada membro passar uma vez pela tela de "app não verificado" — em
Avançado, "acessar o app". A verificação vira polimento opcional depois: remove o
aviso, e não muda código nem comportamento.

Duas coisas que isso **não** dispensa, porque continuam acontecendo por outros
motivos (a pessoa revoga o acesso na conta Google, ou apaga o calendário):

1. "Link quebrado" segue sendo estado de primeira classe na UI, com caminho de
   religar. Só deixa de ser semanal.
2. Sucesso parcial segue sendo normal: quem não ligou, ou revogou, é pulado sem
   afetar os outros.

Um caminho que dispensaria a tela de aviso sem verificação seria consent screen de
tipo "Internal", mas ele exige uma organização Google Workspace — não se aplica a
uma mesa de contas Gmail pessoais.

## Escopo

**Dentro do escopo:**

- Fluxo OAuth 2.0 completo com o Google (start + callback), com `state` assinado
  e de uso único, disponível para **qualquer membro**.
- Coleção nova `googleLinks`, uma por usuário, com o refresh token **cifrado em
  repouso**.
- Criação, sob demanda, de um calendário secundário "ArcanaForge" na conta de
  cada pessoa que liga.
- Gatilho em `respondToSession`: proposta cruzou para confirmada, cria um evento
  para cada membro com link saudável.
- Desfazer: voto virou "não posso" ou proposta cancelada, remove todos os eventos
  criados para aquela proposta.
- Backfill ao ligar: quem liga a conta recebe na hora os eventos das propostas já
  confirmadas e futuras (ver secção 3.4).
- Estado "link quebrado" por usuário, visível na UI, com ação de religar.
- Fuso horário na proposta, para o evento não cair na hora errada.
- Sem dependência nova: Node 24 tem `fetch` global, e o `crypto` do próprio Node
  cobre a cifragem. As chamadas ao Google são REST direto.

**Fora do escopo (não fazer agora):**

- Evento único com convidados (a alternativa que o usuário recusou). Como
  consequência, o app **nunca** usa `attendees` nem `sendUpdates`, e nunca manda
  convite para ninguém.
- Ler a agenda dos membros para sugerir horários livres (`freebusy`). É tentador
  e resolveria "quando todos podem?", mas é feature diferente, com escopo de
  leitura muito mais invasivo.
- Sincronização de volta: mudar o evento no Google **não** altera a proposta no
  ArcanaForge. Só o sentido ArcanaForge → Google.
- Outros provedores (Outlook, Apple) e export ICS.
- Sessões recorrentes.
- Lembrete/notificação própria do ArcanaForge (os lembretes ficam por conta do
  Google Agenda).
- Passar pela verificação do app no Google. O app vai para "In production" sem
  verificação; submeter à revisão depois só remove a tela de aviso e não exige
  mudança nenhuma no código.
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

Com cópia por membro, esta coleção guarda o refresh token de **todos** que
ligarem — não de uma pessoa só. Isso torna a cifragem em repouso não-negociável:
um dump do Mongo sem ela entregaria acesso ao calendário de toda a mesa.

`refreshTokenEnc` nunca sai do server. Nenhum endpoint devolve esse campo, e o
DTO do link expõe só `{ linked, email, lastError }` — `calendarId` também fica
dentro, porque não serve para nada no cliente.

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
  timezone: String,       // IANA, ex. "America/Sao_Paulo"; '' quando desconhecido
  googleEvents: [         // um por membro que recebeu o evento
    {
      uid: String,
      eventId: String,
      calendarId: String,
      createdAt: Date,
    },
  ],
}
```

É **lista**, não objeto único: são N eventos independentes. A idempotência passa a
ser por uid — se já existe entrada para aquele uid, não cria de novo. Sem isso,
dois votos quase simultâneos duplicam o evento na agenda de todo mundo.

A lista também é o que permite desfazer: sem ela não há como achar os eventos no
Google para apagar.

## 2. Fluxo OAuth

### 2.1 Início

`GET /api/google/oauth/start` (com `requireAuth`) monta e devolve a URL de
consentimento:

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=<GOOGLE_CLIENT_ID>
  &redirect_uri=<GOOGLE_REDIRECT_URI>
  &response_type=code
  &scope=<GOOGLE_OAUTH_SCOPES>
  &access_type=offline
  &prompt=consent
  &state=<nonce assinado>
```

`access_type=offline` é o que faz o Google devolver refresh token. `prompt=consent`
força a tela mesmo em re-autorização — necessário porque, sem ela, o Google pode
omitir o refresh token numa segunda autorização, e aí religar depois de uma
revogação deixaria o link inutilizável.

### 2.2 Callback

`GET /auth/google/callback?code=...&state=...` — **fora de `/api`**, e esse é o
ponto delicado: o callback é um redirect de navegador vindo do Google, sem header
`Authorization`. Logo, quem autentica a requisição é o `state`.

A rota fica fora de `/api` por uma razão concreta do código: `server/index.js:73`
tem `app.use('/api', apiLimiter, requireAuth)`, ou seja, **todo** caminho sob
`/api` exige Bearer token. Montar o callback ali significaria abrir uma exceção
dentro do `requireAuth` global — enfraquecer a regra de autenticação de toda a
API para acomodar uma rota. Mais seguro deixá-la num prefixo próprio que nunca
esteve sob a regra.

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
5. Grava o `googleLinks` com o refresh token cifrado e `lastError: null`.
6. Dispara o backfill (secção 3.4), fire-and-forget.
7. Redireciona para o cliente com `?google=ok` ou `?google=error&reason=...`.

Sem os passos 1 e 2 o endpoint aceita CSRF: qualquer um poderia induzir o
navegador de um membro a completar um fluxo com um `code` de terceiro.

### 2.3 Uso e renovação

Toda chamada ao Google passa por um único módulo, que:

1. Lê o `googleLinks` do uid em questão e decifra o refresh token.
2. Troca por access token (`grant_type=refresh_token`), guardado só em memória
   pelo tempo da operação.
3. Faz a chamada REST.

Erro `invalid_grant` na renovação significa refresh token revogado pelo usuário
na conta Google, ou escopo alterado. Com o app publicado isso deixa de ser
rotina, mas continua possível. Todos caem no mesmo tratamento: grava
`lastError` naquele link, e o app para de tentar por aquele usuário — sem afetar
os outros membros.

### 2.4 Desconectar

`DELETE /api/google/link` revoga em `POST https://oauth2.googleapis.com/revoke` e
apaga o documento daquele usuário. O calendário secundário e os eventos já
criados **ficam** na conta da pessoa — apagar a agenda de alguém como efeito de
"desconectar" seria destrutivo e surpreendente. A UI diz isso.

As entradas em `proposal.googleEvents` daquele uid ficam também: são inofensivas,
e apagá-las faria o app perder a informação de que o evento existe na agenda da
pessoa.

## 3. Gatilho e sincronização

### 3.1 Onde

`respondToSession` (`server/src/services/party.service.js:294`) é o único caminho
pelo qual uma proposta pode virar confirmada. `cancelSession` é o único pelo qual
ela desaparece. Os dois ganham o efeito colateral, no mesmo padrão
fire-and-forget que `sendSessionProposalEmail` já usa:

```js
syncGoogleEvents(party, proposal, prevStatus).catch((err) => {
  console.error('Falha ao sincronizar Google Agenda:', err.message);
});
```

Votar nunca pode falhar porque o Google está fora do ar. O erro vai para o log e
para o `lastError` do membro afetado, não para a resposta HTTP.

**Quem recebe evento.** O sync carrega os `googleLinks` de todos os
`party.members` e trabalha só com os que têm link e `lastError` nulo. Um membro
sem conta ligada, ou com link quebrado, é simplesmente pulado — não bloqueia os
outros.

**Ordem no cancelamento.** `cancelSession` remove a proposta do documento, então
`googleEvents` tem que ser lido **antes** do `save()` e passado para o sync. Fazer
na ordem inversa perde os `eventId` e deixa eventos órfãos na agenda das pessoas.

### 3.2 Transições

O status é calculado antes e depois do `save()`, e a transição decide a ação:

| antes | depois | ação |
|---|---|---|
| não confirmada | confirmada | cria evento para cada membro com link saudável e sem entrada em `googleEvents` |
| confirmada | não confirmada | apaga todos os eventos de `googleEvents` e limpa a lista |
| confirmada | confirmada | nada |
| qualquer | proposta cancelada | apaga todos os eventos de `googleEvents` |

Trocar "não posso" de volta para "sim" recria os eventos, com ids novos.

Cada membro é uma operação independente: falha em um não impede os demais. O
resultado é aplicado com `Promise.allSettled`, e só as criações bem-sucedidas
entram em `googleEvents` — mesma forma que `applyToTargets` já usa em
`party.service.js`.

### 3.3 Corpo do evento

Sem `attendees` e sem `sendUpdates`: cada evento é um compromisso próprio na
agenda daquela pessoa, e o app nunca manda convite ou e-mail pelo Google.

Com horário:

```js
{
  summary: 'Sessão: <nome do grupo>',
  description: 'Confirmada no ArcanaForge: <link da aba Calendário>',
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

O corpo é idêntico para todos os membros — inclusive o `timeZone`, que é o da
proposta e não o de cada pessoa. Isso é proposital: o `timeZone` fixa o instante
absoluto, e o Google já exibe o evento no fuso local de quem olha. Usar o fuso de
cada membro moveria a sessão no tempo.

Duração padrão: `SESSION_DURATION_HOURS = 4`, constante com comentário. Não há
campo de duração na proposta e inventar um agora é escopo não pedido; 4h é a
duração típica de uma sessão de mesa.

Para proposta sem horário, `end.date` é o dia seguinte porque a API do Google
trata o fim de evento de dia inteiro como exclusivo — usar a mesma data cria um
evento de duração zero.

### 3.4 Backfill ao ligar a conta

Sem isso a feature parece quebrada logo no primeiro contato: quem liga a conta na
quarta, depois de o grupo ter confirmado a sessão de sábado, não receberia nada
até a próxima confirmação. A pessoa autoriza, olha a agenda, não vê nada, e
conclui que não funcionou.

Ao gravar um link com sucesso, o app varre as parties das quais o usuário é
membro e cria o evento para cada proposta que esteja **confirmada** e cuja data
seja **hoje ou no futuro**. Propostas passadas são ignoradas: encher a agenda de
alguém com sessões que já aconteceram é ruído.

Roda fire-and-forget, e a idempotência por uid da secção 1.3 garante que rodar de
novo não duplica nada.

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
| GET | `/api/google/oauth/start` | `requireAuth` global | `{ url }` |
| GET | `/auth/google/callback` | `state` assinado | redirect para o cliente |
| GET | `/api/google/link` | `requireAuth` global | `{ linked, email, lastError }` |
| DELETE | `/api/google/link` | `requireAuth` global | `{ ok: true }` |

O callback é o único fora de `/api`, pelo motivo explicado na secção 2.2. Os
outros três não precisam declarar `requireAuth`: já herdam do
`app.use('/api', ...)` em `server/index.js:73`.

Todos operam sobre o link do **próprio** usuário autenticado. Não existe endpoint
para ver ou mexer no link de outra pessoa.

Registrados em `server/src/routes/index.js` como `createGoogleRoutes()`, no mesmo
formato dos três conjuntos que já existem. `openapi.yaml` é atualizado.

## 6. Superfície de UI

- **`GroupInfoCard`** (sidebar que já aparece nas três abas de grupo) ganha uma
  linha "Google Agenda", para **todo membro** — não só o dono:
  - não ligado: botão "Conectar Google Agenda";
  - ligado: "Conectada como `x@gmail.com`" mais "Desconectar";
  - quebrado: aviso "Conexão expirou — religue para voltar a receber as sessões",
    com o mesmo botão de conectar.
- **Proposta confirmada** (bloco na agenda e modal de detalhes) ganha um
  indicador discreto "na sua Google Agenda", mostrado quando existe entrada em
  `googleEvents` para o **usuário que está olhando**. Sem isso não há como saber
  se o evento chegou ou se falhou em silêncio.
- **Retorno do OAuth**: o redirect volta para a aba Calendário do grupo com
  `?google=ok|error`, e a página mostra um `Toast` (componente já existente).

O indicador é deliberadamente pessoal ("na *sua* agenda") em vez de um placar do
grupo. Mostrar "3 de 6 membros receberam" convidaria a cobrar os outros, e o
estado de link de cada um não é informação que os demais precisem ver.

Nada da interface atual do calendário muda. As duas visualizações (agenda e
lista) seguem iguais.

## 7. Degradação e erros

O princípio é o mesmo do `email.service.js` (`if (!resend) return;`): sem
configuração, o recurso simplesmente não existe e o resto do app não sente.

| Situação | Comportamento |
|---|---|
| `GOOGLE_CLIENT_ID`/`SECRET` ausentes | Feature inteira desligada; a linha na UI não aparece |
| `GOOGLE_TOKEN_ENC_KEY` ausente | Feature desligada. **Nunca** guardar token em claro como alternativa |
| Nenhum membro ligou a conta | Confirmação segue normal; nenhum evento é criado |
| Parte dos membros ligou | Cria só para esses. É o caso normal, não erro |
| `invalid_grant` para um membro | Grava `lastError` só nele; os outros seguem recebendo |
| Calendário apagado no Google (404) | Mesmo tratamento de link quebrado |
| Google fora do ar / 5xx | Log; a proposta continua confirmada |

Não há retentativa automática nesta versão. Se a criação falhar para alguém, a
ausência do indicador "na sua Google Agenda" é o sinal para aquela pessoa. Uma
fila de retentativa é extensão separada, se a falha se mostrar comum.

## 8. Riscos

**O risco que existia e morreu.** Na versão anterior desta spec (evento único com
convidados) o pilar não validado era se um calendário secundário criado pelo app
consegue convidar terceiros e disparar convites do Google. Com cópia por membro
não há `attendees`: o app só cria eventos no calendário que ele mesmo criou, que é
literalmente o que `calendar.app.created` autoriza. O risco desapareceu junto com
a necessidade de um spike para validá-lo.

**Risco 1 — classificação do escopo.** Não foi possível confirmar na
documentação se `calendar.app.created` é sensitive ou non-sensitive. O que ficou
estabelecido: **nenhum** escopo de Calendar consta na lista oficial de escopos
*restricted*, então o pior caso está descartado. O rótulo definitivo aparece no
Google Cloud Console ao adicionar o escopo.

Consequência se for non-sensitive: nem a tela de aviso existe, e "In production"
resolve tudo sem ressalva. Se for sensitive: a tela de aviso aparece uma vez por
pessoa, como descrito em "Por que o app precisa estar publicado". Em nenhum dos
dois casos há impacto no código — é por isso que os escopos são variável de ambiente.

**Risco 2 — o prazo de 7 dias só desaparece se o status for realmente "In
production".** A leitura da doc é clara ao amarrar o prazo ao status "Testing",
mas isso ainda não foi observado na prática neste projeto. É verificável sem
esforço: ligar uma conta, e o link continuar funcionando depois de mais de 7 dias
confirma. Se por algum motivo o prazo persistir, o requisito do usuário ("ligar
uma vez") não é atingível sem verificação, e essa conversa precisa ser reaberta
antes de considerar a feature pronta.

**Risco 3 — credencial de todos em repouso.** A feature passa a guardar refresh
token de toda a mesa. Mitigação: cifragem AES-256-GCM com chave fora do banco,
coleção separada, campo que nunca entra em DTO, e a feature se desliga inteira se
a chave não existir em vez de degradar para texto em claro.

## 9. Módulos

```
server/
  db/models/GoogleLink.js                 modelo novo
  db/models/GoogleOauthState.js           modelo novo (TTL)
  db/models/Party.js                      + timezone, + googleEvents na proposta
  src/repositories/googleLink.repository.js
  src/services/google/tokenCrypto.js      AES-256-GCM + HKDF (puro, testável)
  src/services/google/oauthState.js       assina/verifica state (puro, testável)
  src/services/google/googleApi.js        ÚNICO lugar com fetch para o Google
  src/services/google/calendarSync.js     transições, fan-out, corpo do evento
  src/services/google/backfill.js         propostas confirmadas futuras ao ligar
  src/controllers/google.controller.js
  src/routes/google.routes.js
  src/services/party.service.js           + gatilho em respondToSession/cancelSession

client/src/
  api/google.ts                           chamadas dos 4 endpoints
  components/party/GoogleCalendarLink/    linha na sidebar
  components/party/GroupInfoCard/         + a linha (todo membro)
  pages/PartyCalendarPage/                lê ?google=ok|error e mostra Toast
  components/party/SessionAgenda/         indicador "na sua Google Agenda"
  components/party/ProposalDetailModal/   indicador "na sua Google Agenda"
```

A separação existe para que `googleApi.js` seja o único módulo que fala rede: tudo
acima dele é testável sem tocar no Google.

## 10. Testes

Server (`node --test`, padrão `server/src/**/*.test.js` já configurado em
`npm run test:server`):

- `tokenCrypto`: round-trip cifra/decifra; texto adulterado é rejeitado pelo
  authTag; as duas subchaves HKDF são diferentes entre si; chave ausente desliga
  em vez de guardar em claro.
- `oauthState`: assina e verifica; assinatura adulterada rejeitada; `exp`
  vencido rejeitado; carga com uid diferente não passa.
- `calendarSync` (transições): cada linha da tabela da secção 3.2.
- `calendarSync` (fan-out): membro sem link é pulado; membro com `lastError` é
  pulado; falha em um membro não impede os outros; idempotência por uid (com
  entrada em `googleEvents`, não cria de novo).
- `calendarSync` (corpo do evento): com horário usa `dateTime` mais `timeZone`;
  sem horário usa `date` com fim no dia seguinte; `timezone` vazio cai no
  default; **nunca** inclui `attendees`.
- `backfill`: pega confirmada e futura; ignora confirmada e passada; ignora não
  confirmada; não duplica o que já está em `googleEvents`.

Client (`vitest`):

- Estados da linha da sidebar: não ligado / ligado / quebrado.
- Indicador "na sua Google Agenda" aparece só quando há entrada para o uid que
  está olhando — não quando há entrada de outro membro.

Nenhum teste chama o Google. A validação de ponta a ponta é manual no app
rodando, como foi feito na agenda semanal.

## 11. Configuração

`.env` (e `.env.example`):

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
GOOGLE_TOKEN_ENC_KEY=          # 32 bytes em base64: openssl rand -base64 32
GOOGLE_OAUTH_SCOPES=openid email https://www.googleapis.com/auth/calendar.app.created
DEFAULT_TIMEZONE=America/Sao_Paulo
```

No Google Cloud Console, fora do código:

1. OAuth consent screen de tipo **External**, publishing status **"In
   production"** — não "Testing". É esse item que cumpre o requisito de não
   religar toda semana.
2. Os escopos `openid`, `email` e `calendar.app.created` adicionados. É aqui que
   se lê o rótulo Non-sensitive / Sensitive de cada um (Risco 1).
3. Redirect URI registrada no cliente OAuth, batendo exatamente com
   `GOOGLE_REDIRECT_URI` — incluindo o host de produção quando houver, já que a
   do dev (`localhost:3001`) não serve para o app publicado.
4. Nome e e-mail de suporte do app preenchidos: em "In production" a tela de
   consentimento os exibe para os membros.

Não é necessária lista de test users — ela só existe no status "Testing".

`GOOGLE_OAUTH_SCOPES` é env, e não constante, para que trocar de escopo não
exija mudança de código. Guarda a string completa, não só o escopo de calendário:
`openid email` entram porque a UI mostra "Conectada como x@gmail.com", e
`calendar.app.created` sozinho não devolve identidade nenhuma. Os dois são
escopos básicos de perfil e não mudam a classificação de sensibilidade do
conjunto.

O e-mail sai do `id_token` que vem na resposta do endpoint de token: o payload é
decodificado sem verificar assinatura, o que é seguro aqui porque a resposta veio
direto do endpoint do Google por TLS, em resposta a uma requisição autenticada
com o client secret — não é um token recebido de terceiro.
