# ArcanaForge — Digital Character Sheet & Combat Tracker

Sistema web para fichas de personagem e gerenciamento de combate de **Tormenta 20**, com sincronização em tempo real entre múltiplos dispositivos via WebSocket.

Jogadores editam suas fichas enquanto o mestre gerencia o combate — tudo sincronizado automaticamente.

---

## Funcionalidades

### Character Sheet (`/tormenta/char`)

- **Basic Info** — nome, avatar (upload), múltiplas classes com nível total, raça, origem, divindade, alinhamento, idade, tamanho, deslocamento, XP
- **Attributes** — STR, DEX, CON, INT, WIS, CHA com cálculo de modificadores e edição inline
- **Buffs** — lista de buffs ativáveis que alteram atributos e perícias em tempo real, com custo MP
- **HP / MP** — barras visuais estilo MMO, edição incremental (±), temporários, reset, redução de dano
- **Defense** — cálculo automático com itens de proteção e penalidade de armadura
- **Attacks** — corpo-a-corpo e à distância, bônus customizáveis, custo em MP, botões "Usar" e "Duplicar" com animações visuais e efeitos sonoros (Web Audio API)
- **Spells** — lista com custo MP, aprimoramentos, modal de conjurar com cálculo dinâmico de custo
- **Skills** — todas as perícias do T20 com cálculo automático (atributo + treino + buffs - penalidade de armadura), exibidas em drawer lateral
- **Abilities** — lista editável com origem, tipo e custo MP
- **Inventory** — itens, 4 slots de equipamento, moedas (copper, silver, gold), cálculo de carga
- **Proficiencies & Temporary Effects** — campos de texto livre
- **Progression** — histórico de progressão do personagem (drawer)
- **Notes** — bloco de notas (drawer)
- **Logs** — registro de ações com tipo, MP gasto e timestamp (drawer)
- **Section Navigation** — barra sticky com IntersectionObserver e destaque da seção ativa
- **Hideable Sections** — painel para mostrar/esconder seções conforme preferência
- **Auto-save** — salvamento automático com debounce (800ms) após cada alteração
- **URL Persistence** — parâmetro `?char=` mantém o personagem selecionado

### Combat Tracker (`/tormenta/party/:partyId`)

- **Players** carregados automaticamente das fichas salvas (HP, MP, avatar, classes)
- **Enemies** adicionáveis dinamicamente com nome editável e HP customizável
- **Initiative** — campo numérico por participante com reordenação automática
- **Turn System** — próximo turno, reset, indicador visual dourado no card ativo
- **Damage / Heal** — popover com input numérico ao clicar na barra de HP
- **GM Mode** (toggle) — esconde/mostra controles exclusivos do mestre (HP de inimigos, botões de adicionar/remover)
- **Visual HP Feedback** — brilho amarelado (alerta) e avermelhado (crítico) com limiares aleatórios para esconder a % exata dos jogadores
- **Icons** — ícone da classe ao lado do nome dos jogadores, ícone de vilão para inimigos
- **Avatars** — faixa lateral com imagem do personagem (URL pública R2 / HTTPS)
- **Mini Order** — barra inferior fixa com avatares miniatura na ordem de iniciativa
- **Real-time Sync** — todas as alterações (HP, turno, iniciativa, inimigos) são sincronizadas entre todos os clientes conectados

### Character Selection (`/characters`)

- Grid visual de personagens salvos com avatar, nome e classes
- Criar novo personagem diretamente pela tela
- Redirecionamento para a ficha ao clicar no card

### Party Management (`/parties`, `/parties/new/:partyId`)

- Criar e gerenciar grupos de personagens
- Selecionar membros do grupo a partir das fichas existentes
- Iniciar sessão de combate com o grupo selecionado

### Real-time Sync (WebSocket)

- **GM → Sheet**: quando o mestre altera o HP de um jogador no tracker, a ficha do jogador atualiza automaticamente com toast de notificação
- **Sheet → Tracker**: quando o jogador altera HP/MP na sua ficha, o tracker do mestre reflete a mudança
- **Tracker → Tracker**: todas as alterações de combate (HP, iniciativa, turnos, inimigos) são sincronizadas entre todos os clientes conectados
- Reconexão automática em caso de desconexão

---

## Tecnologias


| Camada                        | Tecnologia                                               |
| ----------------------------- | -------------------------------------------------------- |
| **Runtime**                   | Node.js 22                                               |
| **Backend HTTP**              | Express 4                                                |
| **WebSocket**                 | `ws` (WebSocketServer)                                   |
| **Armazenamento de avatares** | Cloudflare R2 (upload via API, servidor grava no bucket) |
| **Autenticação**              | Firebase Auth (Google + Email/Senha)                     |
| **Frontend**                  | React 19, TypeScript, Vite 8                             |
| **Roteamento**                | React Router v7                                          |
| **Estado**                    | React Context + useState                                 |
| **Estilização**               | CSS Modules com variáveis CSS                            |
| **Persistência**              | Sistema de arquivos (JSON) + MongoDB (em migração)       |
| **Infra**                     | Docker Compose, Cloudflare Tunnel                        |
| **Estilo visual**             | Dark mode, glassmorphism, acento dourado                 |


---

## Como Rodar

### Com Docker (recomendado)

Pré-requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
# 1 - Somente MongoDB
docker compose up mongo -d

# 2 - MongoDB + App (backend + frontend built)
docker compose up -d

# 3 - MongoDB + App + Cloudflare Tunnel (expor publicamente)
docker compose --profile tunnel up -d

# Ver logs
docker compose logs -f

# Parar tudo
docker compose --profile tunnel down
```

# Buildar e rodar denovo

docker compose build app && docker compose up -d app

A app fica acessível em `http://localhost:3000`. O MongoDB fica em `localhost:27017`.

> Para expor publicamente, preencha `CLOUDFLARE_TUNNEL_TOKEN` no `.env` antes de usar a opção 3.

### Sem Docker (desenvolvimento)

Pré-requisitos: [Node.js](https://nodejs.org/) v18+

```bash
# Instalar dependências
npm install
cd client && npm install && cd ..

# Desenvolvimento (backend :3001 + frontend :5173 com hot-reload)
npm run dev

# Produção (build + serve na porta 3000)
npm run public
```

Acesse `http://localhost:5173` em desenvolvimento. O Vite faz proxy automático de `/api` e `/assets` para o backend.

---

## Variáveis de Ambiente

Todas as variáveis ficam no `.env` na raiz do projeto:

```env
# Firebase (frontend — só Auth)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...

# Firebase Admin (backend — Auth / verificação de tokens)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Cloudflare R2 (avatares — API S3 compatível)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
# URL pública de leitura (subdomínio r2.dev ou domínio customizado ligado ao bucket)
R2_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev

# Server
PORT=3000

# MongoDB
MONGODB_URI=mongodb://mongo:27017/arcanaforge

# Cloudflare Tunnel (opcional)
CLOUDFLARE_TUNNEL_TOKEN=
```

### Firebase (só login)

1. Criar projeto Firebase
2. Em **Authentication > Sign-in method**, habilitar Google e Email/Password
3. Em **Authentication > Settings**, configurar domínio autorizado
4. Em **Project settings > Service accounts**, gerar chave privada para o backend

### Cloudflare R2 (avatares)

1. No dashboard **R2**, criar um bucket (ex.: `arcanaforge-avatars`).
2. **Manage R2 API tokens** → criar token com permissão de leitura/escrita nesse bucket; guardar **Access Key ID** e **Secret Access Key**.
3. Copiar **Account ID** (visível na página R2).
4. Activar acesso público de leitura: no bucket → **Settings** → **Public access** → permitir o subdomínio **r2.dev** ou ligar um **Custom domain**; o valor de `R2_PUBLIC_BASE_URL` é a base pública (ex.: `https://pub-abc123.r2.dev`, sem barra no fim). Os objectos ficam em `<email_sanitizado>/avatars/<nome-original>_<nome-personagem>_<uuid>.<ext>` (ex.: `user_at_gmail.com/avatars/foto_arcanista_5fe8916c-....png`). O email vem do token Firebase, da ficha (`ownerEmail`) ou do **Firebase Admin** (`getUser(uid)`).

O browser envia o ficheiro em **multipart** para a API Node, que grava no R2 — não é preciso configurar **CORS** no bucket para uploads directos a partir da página (o que antes causava `Failed to fetch` no PUT para o endpoint S3).

Personagens guardam o campo `avatar` como URL HTTPS absoluta. Fichas antigas com `/avatars/...` local deixam de resolver até novo upload.

---

## Rotas da Aplicação


| Página                    | URL                        |
| ------------------------- | -------------------------- |
| Auth (login)              | `/auth`                    |
| Character Selection       | `/characters`              |
| Party Selection           | `/parties`                 |
| Party Members             | `/parties/new/:partyId`    |
| Tormenta 20 Sheet         | `/tormenta/char?char=<id>` |
| Combat Tracker (Tormenta) | `/tormenta/party/:partyId` |


---

## API REST


| Método   | Endpoint                     | Descrição                                                    |
| -------- | ---------------------------- | ------------------------------------------------------------ |
| `GET`    | `/api/characters`            | Lista IDs de todos os personagens do usuário                 |
| `GET`    | `/api/characters/summary`    | Resumo de cada personagem (nome, avatar, classes)            |
| `GET`    | `/api/characters/:id`        | Carrega um personagem completo                               |
| `POST`   | `/api/characters/:id`        | Salva/atualiza um personagem                                 |
| `POST`   | `/api/characters/:id/avatar` | Upload de avatar (multipart, campo `avatar`, máx. 5 MB) → R2 |
| `DELETE` | `/api/characters/:id`        | Exclui um personagem                                         |
| `GET`    | `/api/parties`               | Lista todos os grupos do usuário                             |
| `POST`   | `/api/parties`               | Cria um novo grupo                                           |
| `PUT`    | `/api/parties/:id`           | Atualiza um grupo                                            |
| `DELETE` | `/api/parties/:id`           | Exclui um grupo                                              |
| `GET`    | `/api/parties/:id/combat`    | Retorna o estado de combate de um grupo                      |
| `POST`   | `/api/parties/:id/combat`    | Salva estado de combate e notifica via WebSocket             |


Rotas protegidas exigem `Authorization: Bearer <idToken>`. Rotas públicas: `/health`, `/assets/`*.

---

## WebSocket Messages


| Sent                  | Received            | Description                                                     |
| --------------------- | ------------------- | --------------------------------------------------------------- |
| `combat_update`       | `combat_sync`       | Atualiza estado completo do combate (enemies, initiative, turn) |
| `character_hp_update` | `character_hp_sync` | Jogador alterou HP/MP na ficha → reflete no tracker             |
| `master_hp_update`    | `master_hp_sync`    | Mestre alterou HP no tracker → reflete na ficha do jogador      |


Na conexão inicial, o servidor envia `combat_sync` com o estado atual para o novo cliente.

---

## Estrutura do Projeto

```
arcanaforge/
├── server.js                 # Entry point (require server/index.js)
├── package.json
├── Dockerfile                # Multi-stage build (frontend + backend)
├── docker-compose.yml        # MongoDB + App + Cloudflare Tunnel
├── .env                      # Variáveis de ambiente
│
├── server/
│   ├── index.js              # Express + WebSocket + Helmet + static files
│   ├── paths.js              # Caminhos do sistema de arquivos
│   ├── websocket.js          # WebSocket server (combat sync, HP sync)
│   ├── combatState.js        # Estado de combate em memória + disco
│   ├── migrateData.js        # Migração de dados PT → EN
│   ├── migrateCharacters.js  # Migração de fichas legadas
│   ├── routes/
│   │   └── index.js          # Todas as rotas REST
│   ├── auth/
│   │   └── firebaseAdmin.js  # Firebase Admin (Auth)
│   ├── storage/
│   │   └── r2.js             # Cloudflare R2 (S3) — upload e delete
│   ├── characters/
│   │   └── userCharactersDir.js  # Resolução de diretório por usuário
│   └── middleware/
│       ├── requireAuth.js    # Middleware de autenticação
│       └── validateId.js     # Validação de IDs nas rotas
│
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx               # Definição de rotas
│       │
│       ├── api/
│       │   ├── index.ts          # Re-export das funções API
│       │   ├── http.ts           # assertOk / ApiError
│       │   ├── characters.ts     # CRUD de personagens
│       │   └── parties.ts        # CRUD de grupos
│       │
│       ├── types/
│       │   ├── character.ts      # Character, Attack, Spell, Ability, etc.
│       │   ├── combat.ts         # CombatData, CombatRow, Enemy
│       │   └── party.ts          # Party
│       │
│       ├── contexts/
│       │   ├── CharacterContext.tsx   # Estado da ficha + auto-save + WS
│       │   └── CombatContext.tsx      # Estado do combate + WS
│       │
│       ├── hooks/
│       │   ├── useWebSocket.ts       # Conexão WS com auto-reconnect
│       │   └── useAutoSave.ts        # Debounce save (800ms)
│       │
│       ├── utils/
│       │   ├── calculations.ts       # Cálculos RPG (attributes, skills, defense, etc.)
│       │   ├── sounds.ts             # Efeitos sonoros via Web Audio API
│       │   ├── animations.ts         # Animações de ataque
│       │   └── formatters.ts         # Utilitários de formatação
│       │
│       ├── data/
│       │   ├── atributos.ts          # ATTRIBUTE_LABELS, ATTRIBUTE_FULL_NAMES
│       │   ├── pericias.ts           # SKILLS_CONFIG
│       │   └── constants.ts          # BUFF_TYPES, SECTION_LABELS, COMBAT_DEFAULT
│       │
│       ├── services/
│       │   └── toastService.ts       # Serviço de notificações
│       │
│       ├── styles/
│       │   ├── tokens.css            # Variáveis CSS (cores, fontes, sombras)
│       │   └── globals.css           # Reset e estilos base
│       │
│       ├── features/
│       │   ├── auth/                 # Autenticação (Firebase)
│       │   │   ├── AuthContext.tsx
│       │   │   ├── firebase.ts
│       │   │   ├── useAuth.ts
│       │   │   ├── components/
│       │   │   │   ├── AuthPage.tsx
│       │   │   │   ├── RequireAuth.tsx
│       │   │   │   └── VerifyEmailNotice.tsx
│       │   │   └── services/
│       │   │       └── authService.ts
│       │   └── tormenta/
│       │       ├── data/tormentaClasses.ts
│       │       └── pages/TormentaSheetPage.tsx
│       │
│       ├── components/
│       │   ├── ui/                   # Componentes reutilizáveis
│       │   │   ├── Button/
│       │   │   ├── Badge/
│       │   │   ├── Modal/
│       │   │   ├── ConfirmModal/
│       │   │   ├── Drawer/
│       │   │   ├── Input/
│       │   │   ├── Section/
│       │   │   ├── Toast/
│       │   │   ├── HealthBar/
│       │   │   └── SystemFilter/
│       │   │
│       │   ├── layout/
│       │   │   ├── Topbar/
│       │   │   └── SectionNav/
│       │   │
│       │   ├── character/
│       │   │   ├── BasicInfo/
│       │   │   ├── AttributesDefense/
│       │   │   ├── HpMp/
│       │   │   ├── BuffsList/
│       │   │   ├── AttackCard/
│       │   │   ├── AttacksList/
│       │   │   ├── AttacksMini/
│       │   │   ├── SpellCard/
│       │   │   ├── SpellsList/
│       │   │   ├── CastSpellModal/
│       │   │   ├── AbilitiesList/
│       │   │   ├── SkillsList/
│       │   │   ├── Inventory/
│       │   │   ├── Proficiencies/
│       │   │   ├── TemporaryEffects/
│       │   │   ├── ProgressionDrawer/
│       │   │   ├── NotesDrawer/
│       │   │   └── LogsDrawer/
│       │   │
│       │   ├── combat/
│       │   │   ├── CombatCard/
│       │   │   ├── CombatToolbar/
│       │   │   ├── DamagePopover/
│       │   │   └── MiniOrder/
│       │   │
│       │   └── select/
│       │       └── SelectGrid/
│       │
│       └── pages/
│           ├── SelectPage/
│           ├── PartySelectPage/
│           ├── PartyMembersPage/
│           ├── TormentaSheetPage/
│           └── GameMasterPage/
│
├── data/                     # Persistência JSON (avatares em Cloudflare R2)
│   ├── characters/<uid>/     # Um JSON por personagem, organizado por usuário
│   ├── parties/              # Grupos (<partyId>.json)
│   └── .migrated-v2          # Sentinela de migração PT→EN
│
├── assets/
│   └── classes/              # Ícones SVG de classes (guerreiro, arcanista, etc.)
│
└── dist/                     # Build de produção do frontend (gerado pelo Vite)
```

---

## Dados em Disco


| Caminho                  | Conteúdo                                                |
| ------------------------ | ------------------------------------------------------- |
| `data/characters/<uid>/` | Um JSON por personagem, organizado por usuário Firebase |
| `data/parties/`          | Grupos (`<partyId>.json`)                               |


Imagens de avatar ficam no **Cloudflare R2** (`<email>/avatars/<ficheiro>_<personagem>_<uuid>.<ext>`); o campo `avatar` no MongoDB é uma URL HTTPS pública.

Com Docker, o diretório `data/` é mapeado para o volume `arcanaforge-data`, persistindo entre restarts.

---

## Docker

### Arquitetura

```mermaid
graph LR
  Internet -->|HTTPS| Tunnel[cloudflared]
  Tunnel -->|"http://app:3000"| App[app - Node.js]
  App -->|"mongodb://mongo:27017"| Mongo[mongo]
  App -->|"/app/data"| Volume[arcanaforge-data]
  App --> R2[Cloudflare R2]
  Mongo --> MongoVol[mongo-data]
```



### Serviços


| Serviço  | Imagem                   | Porta | Descrição                             |
| -------- | ------------------------ | ----- | ------------------------------------- |
| `mongo`  | `mongo:7`                | 27017 | MongoDB sem autenticação (local dev)  |
| `app`    | build local              | 3000  | Backend Express + frontend built      |
| `tunnel` | `cloudflare/cloudflared` | —     | Cloudflare Tunnel (profile: `tunnel`) |


### Volumes


| Volume             | Mount       | Conteúdo                   |
| ------------------ | ----------- | -------------------------- |
| `mongo-data`       | `/data/db`  | Dados do MongoDB           |
| `arcanaforge-data` | `/app/data` | Characters, parties (JSON) |


### Rebuild após alterações

```bash
docker compose build && docker compose up -d
```

---

## Padrões de Projeto

### Componentes UI Reutilizáveis


| Componente     | Uso                                                                              |
| -------------- | -------------------------------------------------------------------------------- |
| `Button`       | 7 variantes: `default`, `add`, `remove`, `remove-sm`, `gold`, `ghost`, `primary` |
| `Section`      | Seção colapsável com título e toggle                                             |
| `Modal`        | Overlay com backdrop blur e click-outside                                        |
| `ConfirmModal` | Modal de confirmação (delete, etc.)                                              |
| `Drawer`       | Painel lateral deslizante                                                        |
| `Toast`        | Notificações com auto-dismiss                                                    |
| `Badge`        | Badge inline (`default`, `pm`, `gold`)                                           |
| `HealthBar`    | Barra de HP/MP reutilizável                                                      |
| `SystemFilter` | Filtro por sistema de RPG                                                        |
| `Input`        | Input estilizado                                                                 |


### Contexts


| Context            | Escopo          | Descrição                                       |
| ------------------ | --------------- | ----------------------------------------------- |
| `CharacterContext` | Character sheet | Estado da ficha, auto-save, WebSocket (HP sync) |
| `CombatContext`    | Combat tracker  | Estado do combate, jogadores, turnos, WebSocket |
| `AuthContext`      | App-wide        | Autenticação Firebase                           |
| `ToastProvider`    | App-wide        | Sistema de notificações                         |


### Estilização

- **CSS Modules** (`.module.css`) para escopo por componente
- **Variáveis CSS** em `tokens.css` para temas e consistência
- **Sem frameworks CSS** — estilos custom com identidade visual dark/dourada
- **Responsividade** — media queries (breakpoints: 900px, 700px, 600px, 450px)

