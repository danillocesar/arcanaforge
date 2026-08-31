# Ligar o ArcanaForge ao Google Agenda

Passo a passo no Google Cloud Console. Feito uma vez, por quem administra o
projeto. Ao final, seis valores vão para o `.env`.

**Nota:** O Google Cloud Console se reorganiza periodicamente. Se um rótulo não
corresponder, procure pela área **Google Auth Platform** e a aba cujo nome
combine com seu objetivo (Branding / Audience / Clients / Data Access), em vez
de seguir um menu exato.

## 1. Projeto

1. Abra <https://console.cloud.google.com/> com a conta que vai administrar.
2. No seletor de projeto (topo), **Novo projeto**. Nome: `ArcanaForge`. Criar.
3. Confirme que o seletor mostra `ArcanaForge` antes de seguir.

## 2. Ativar a Calendar API

1. Menu → **APIs e serviços → Biblioteca**.
2. Busque `Google Calendar API`. Abra e clique em **Ativar**.

## 3. Tela de consentimento

1. Menu → **APIs e serviços → Google Auth Platform**.
2. Aba **Branding**. Preencha:
   - **Nome do app:** `ArcanaForge`
   - **E-mail de suporte:** seu e-mail
   - **E-mail do desenvolvedor:** seu e-mail

   Esses dois aparecem para os membros na hora de autorizar.
3. Salvar.

## 4. Escopos

1. Na aba **Data Access**, clique em **Adicionar ou remover escopos**.
2. Adicione os três escopos (o Console pode exibi-los abreviados):
   - `https://www.googleapis.com/auth/openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/calendar.app.created`
3. **Anote o rótulo que aparece ao lado do escopo de calendário**
   (Non-sensitive / Sensitive). Se for *Non-sensitive*, ninguém verá tela de
   aviso. Se for *Sensitive*, cada membro vê uma vez a tela de "app não
   verificado" e precisa clicar em **Avançado → acessar ArcanaForge**.
4. Salvar.

## 5. Publicar o app — passo que não pode ser esquecido

1. Na aba **Audience**, clique em **Publicar app** e confirme.
2. O status precisa ficar **Em produção**, não "Testes".

Por que importa: no status "Testes" o Google emite refresh token que **expira em
7 dias**, o que obrigaria cada membro a religar a conta toda semana. Em produção
o token não expira por status. Se em algum momento a agenda parar de receber as
sessões para todos ao mesmo tempo, confira este item primeiro.

A publicação não exige que o app passe por verificação: um app não verificado
roda em produção normalmente, com o aviso "app não verificado" visível apenas
para escopos Sensitive, e está limitado a 100 usuários.

Não é necessário cadastrar usuários de teste: essa lista só existe no status
"Testes".

## 6. Credenciais OAuth

1. Na aba **Clients**, clique em **Criar cliente OAuth** (ou equivalente em sua
   interface).
2. Tipo de aplicativo: **Aplicativo da Web**. Nome: `ArcanaForge web`.
3. Em **URIs de redirecionamento autorizados**, adicione **exatamente**:
   - `http://localhost:3001/auth/google/callback` (desenvolvimento)
   - `https://SEU-DOMINIO/auth/google/callback` (produção, quando houver)

   Precisa bater caractere por caractere com o `GOOGLE_REDIRECT_URI` do `.env` —
   barra final, `http` vs `https` e porta incluídos. Divergência aqui gera
   `redirect_uri_mismatch` na hora de autorizar.
4. Criar. Copie **ID do cliente** e **Chave secreta do cliente**.

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
