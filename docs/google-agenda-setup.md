# Ligar o ArcanaForge ao Google Agenda

Passo a passo no Google Cloud Console. Feito uma vez, por quem administra o
projeto. Ao final, seis valores vão para o `.env`.

**Nota:** O Google Cloud Console se reorganiza periodicamente, e seus rótulos
seguem a língua da conta/navegador. Os nomes abaixo são em inglês — se não
corresponderem à sua interface, você pode trocar o Console para inglês pelo
seletor de idioma, ou procurar pelo controle pela descrição fornecida.

## 1. Projeto

1. Abra <https://console.cloud.google.com/> com a conta que vai administrar.
2. No seletor de projeto (topo), **Novo projeto**. Nome: `ArcanaForge`. Criar.
3. Confirme que o seletor mostra `ArcanaForge` antes de seguir.

## 2. Ativar a Calendar API

1. Menu → **APIs and services** → **Library** (página de catálogo de APIs).
2. Busque `Google Calendar API`. Abra e clique em **Enable**.

## 3. Tela de consentimento

1. Menu → **APIs and services** → **Google Auth Platform** (o hub de configuração de OAuth).
2. Na aba **Audience** (onde ficam as configurações de tipo de usuário), escolha o tipo de usuário como **External**. 
   
   **Atenção:** essa escolha não pode ser mudada depois — se escolher errado, será preciso criar um novo projeto. **Internal** é apenas para organizações Google Workspace e não funciona com contas pessoais Gmail.
3. Volte para a aba **Branding** (onde fica a identidade visual do app) e preencha:
   - **Nome do app:** `ArcanaForge`
   - **E-mail de suporte:** seu e-mail
   - **E-mail do desenvolvedor:** seu e-mail

   Esses dois aparecem para os membros na hora de autorizar.
4. Salvar.

## 4. Escopos

1. Na aba **Data Access** (onde ficam as configurações de acesso a dados), clique em **Add or remove scopes**.
2. Adicione os três escopos:
   - `openid` — um identificador sem forma de URL, como é em OpenID Connect.
   - `https://www.googleapis.com/auth/userinfo.email` — o que o Console lista; no `.env` (Passo 8) isso aparece abreviado como `email`, que o Google aceita como equivalente.
   - `https://www.googleapis.com/auth/calendar.app.created` — acesso ao calendário.
3. **Anote o rótulo que aparece ao lado do escopo de calendário**
   (Non-sensitive / Sensitive). Se for *Non-sensitive*, ninguém verá tela de
   aviso. Se for *Sensitive*, cada membro vê uma vez a tela de "app não
   verificado" e precisa clicar em **Avançado → acessar ArcanaForge**.
4. Salvar.

## 5. Publicar o app — passo que não pode ser esquecido

1. Na aba **Audience** (onde ficam o status de publicação e a lista de usuários de teste), clique em **Publish app** e confirme.
2. O status precisa ficar **In production**, não **Testing**.

Por que importa: no status **Testing** o Google emite refresh token que **expira em
7 dias**, o que obrigaria cada membro a religar a conta toda semana. Em **In production**
o token não expira por status. Se em algum momento a agenda parar de receber as
sessões para todos ao mesmo tempo, confira este item primeiro.

A publicação não exige que o app passe por verificação: um app não verificado
roda em produção normalmente, com o aviso "app não verificado" visível apenas
para escopos Sensitive, e está limitado a 100 usuários.

Não é necessário cadastrar usuários de teste: essa lista só existe no status
**Testing**.

## 6. Credenciais OAuth

1. Na aba **Clients** (onde ficam os clientes OAuth), clique em **Create credentials** → **OAuth client ID** (ou equivalente em sua interface).
2. Tipo de aplicativo: **Web application**. Nome: `ArcanaForge web`.
3. Em **Authorized redirect URIs** (a lista de URLs permitidas para retorno após autorização), adicione **exatamente**:
   - `http://localhost:3001/auth/google/callback` (desenvolvimento)
   - `https://SEU-DOMINIO/auth/google/callback` (produção, quando houver)

   Precisa bater caractere por caractere com o `GOOGLE_REDIRECT_URI` do `.env` —
   barra final, `http` vs `https` e porta incluídos. Divergência aqui gera
   `redirect_uri_mismatch` na hora de autorizar.
4. Criar. Copie **Client ID** e **Client Secret**.

## 7. Gerar a chave de cifragem

As credenciais dos membros ficam cifradas no banco. Gere uma chave de 32 bytes:

```bash
openssl rand -base64 32
```

Guarde o resultado. Perder essa chave invalida todos os vínculos já criados
(cada membro precisa ligar a conta de novo); trocá-la tem o mesmo efeito.
Nunca a comite.

## 8. Preencher o `.env`

Na raiz do projeto, no `.env`:

```
GOOGLE_CLIENT_ID=<ID do cliente do passo 6>
GOOGLE_CLIENT_SECRET=<Chave secreta do passo 6>
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
GOOGLE_TOKEN_ENC_KEY=<saída do openssl do passo 7>
GOOGLE_OAUTH_SCOPES=openid email https://www.googleapis.com/auth/calendar.app.created
DEFAULT_TIMEZONE=America/Sao_Paulo
```

Reinicie o server. Sem essas variáveis a integração fica desligada e a linha
"Google Agenda" não aparece na sidebar do grupo — o resto do app funciona
normalmente.

## 9. Conferir

1. `npm run dev`
2. Abra um grupo, aba Calendário. Na sidebar deve aparecer **Conectar Google
   Agenda**.
3. Clique. Autorize (passando pela tela de aviso, se o escopo for Sensitive).
4. Você deve voltar ao ArcanaForge com a sidebar mostrando **Conectada como
   seu@email.com**.
5. Em <https://calendar.google.com/> deve existir um calendário novo chamado
   **ArcanaForge**.

Se der `redirect_uri_mismatch`, revise o passo 6.4. Se voltar com erro de
`invalid_client`, revise `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.

## Cada membro da mesa

Cada pessoa faz só o passo 9 (itens 2 a 4), na própria conta. Nada de Console.
