# Backlog da ficha — Tormenta 20 (levantamento de 26/08/2026)

Consolidação da checklist de 26/08 em **histórias de usuário prontas para implantação**.
Cada pedido virou um épico; cada épico foi cruzado com o código antes de virar história,
para que critérios de aceite e notas técnicas apontem para arquivo e linha reais.

Formato de cada história:

- **História** — "Como jogador/mestre, quero…, para…"
- **Hoje** — o que o código faz, com `arquivo:linha`
- **Critérios de aceite** — o que precisa ser verdade para fechar
- **Notas técnicas** — onde mexer, seguindo os padrões que já existem no repo
- **Esforço / Depende de / Questões abertas**

Escala de esforço: **XS** < 1h · **S** meio período · **M** 1–2 dias · **L** > 2 dias.

> Arquitetura: o schema do Mongo continua `strict: false` (`server/db/models/Character.js:16`),
> então campo novo em personagem persiste sem migração. **Só E4 toca o servidor**: o espelho
> `mergeBuffIntoCharacter` em `server/src/utils/buffMerge.js` e o payload do websocket.

Referência-base: branch `feature/saas`, commit `4862aac`.

**Decisões tomadas em 26/08** (fecharam as questões abertas da primeira versão deste doc):

- **E2** — o catálogo de magias veio de uma fonte antiga, que não é mais a usada; a "API" a trocar
  é a **fonte de conteúdo**: reimportar da edição atualizada do Tormenta20. Fonte escolhida:
  **Grimório T20** (`https://eduardomarques.pythonanywhere.com/`), filtro "Edição Jogo do Ano".
- **Novo dia** — cura tudo e desliga os buffs. Sem tabela de descanso, sem distinguir duração.
- **RD** — as RDs aplicáveis **somam**.
- **PV/PM temporários** de fontes diferentes — **somam** (mantém o comportamento atual).

---

## Resumo executivo

| ID | História | Tipo | Prio | Esforço | Depende de |
|---|---|---|---|---|---|
| **E1** | **Reset de buffs e "novo dia"** | | | | |
| H1.1 | Desligar todos os buffs de uma vez (e limpar os desligados) | Feature | P1 | XS–S | — |
| H1.2 | "Novo dia": desliga todos os buffs, zera temporários e cura tudo | Feature | P1 | S | H1.1, H4.1 |
| H1.3 | Usos por dia em poderes, renovados no novo dia | Feature | P2 | M | H1.2 |
| H1.4 | (Opcional) Buff sabe sua duração + ação "Fim de cena" | Modelo | P3 | S | H1.2 |
| **E2** | **Fonte do catálogo de magias** | | | | |
| H2.1 | Script em `tools/` que baixa o Grimório T20, converte e diffa contra `spells.ts` | Ferramenta | P1 | S–M | — |
| H2.2 | Regenerar `spells.ts` (197 JdA + 5 de suplemento) e revisar o diff de mecânica | Conteúdo | P1 | M | H2.1 |
| H2.3 | Magia da ficha referencia o catálogo por id (propaga a atualização às fichas) | Refactor | P1 | M | H2.2 |
| **E3** | **Variáveis (atributo / nível) nos efeitos** | | | | |
| H3.1 | Motor: valor de efeito = fixo + atributo + nível, resolvido num ponto só | Modelo | P1 | M | — |
| H3.2 | Formulário e exibição do "+ atributo / + nível" em todo efeito de buff | Feature | P1 | S | H3.1 |
| H3.3 | Modificadores próprios do ataque aceitam atributo | Feature | P1 | S | H3.1 |
| H3.4 | Bônus por atributo direto na linha da perícia | Feature | P2 | S | H3.1 |
| **E4** | **PV/PM temporários como sobrevida** | | | | |
| H4.1 | Modelo: temporário é pool separado, consumido antes, nunca curado | Bug de regra | **P0** | M | — |
| H4.2 | Barra e popover mostram o temporário como segmento próprio | Feature | P1 | S | H4.1 |
| H4.3 | Espelho no servidor, websocket e visão do mestre | Bug de regra | P1 | S–M | H4.1 |
| **E5** | **Botão "Tomar dano" com RD** | | | | |
| H5.1 | Ação "Tomar dano": valor + tipo → RDs aplicáveis → desconta sozinho | Feature | P1 | M | H4.1 |
| H5.2 | Mestre aplica dano no jogador usando as RDs dele | Feature | P2 | M | H5.1, H4.3 |

**Ordem sugerida (levas):**

1. **Vitais e combate** — H4.1 → H4.2 → H4.3 → H5.1, com H1.1 e H1.2 na mesma leva (H1.1 é o
   quick win e não depende de nada; H1.2 só precisa de H1.1 e da função de cura de H4.1). H4.1
   vai primeiro porque hoje o modelo de PV temporário produz número errado (ver E4) e porque H1.2
   e H5.1 precisam das funções de "aplicar dano/cura" que nascem ali.
2. **Magias** — H2.1 → H2.2 não tocam a ficha e podem correr **em paralelo** com a leva 1
   (inclusive delegados); H2.3 vem logo atrás, porque sem ela a reimportação não chega às magias
   já copiadas nas fichas.
3. **Variáveis** — H3.1 → H3.2 → H3.3 (→ H3.4 opcional).
4. **Sobras** — H1.3 (usos por dia), H1.4 (duração / fim de cena), H5.2.

---

# E1 · Reset de buffs e "novo dia"

**Pedido**
> botão de reset dos buff (melhor, pra qdo restartar o dia a gente refreshar o que precisa ser
> refreshado)

**Hoje**

- Buff liga/desliga **um por um**: `ConditionChip` e `BuffsDrawer` chamam `toggleBuffState`
  (`client/src/utils/calculations.ts:249`). Não existe "desligar todos", "remover desligados" nem
  qualquer ação de virada de dia. O único "limpar" da ficha é o de logs
  (`components/sheet/LogsSheet/LogsSheet.tsx:53`).
- Buff **não sabe quanto dura**. `Buff` (`types/character.ts:82`) tem `name/effects/mp/active/
  source/description/resistance/dc` — nada de duração. A informação existe na origem:
  `Spell.duration` vem preenchido do catálogo (73 magias "cena", 27 "sustentada", 21 "1 dia",
  5 "1 rodada", 3 "permanente" em `data/spells.ts`), mas **morre na conjuração**:
  `CastActionSheet` monta o `buffPayload` (`CastActionSheet.tsx:67-71`) só com nome, efeitos,
  origem e resistência. Mesmo caminho que a resistência percorria antes do item 9 do doc anterior.
- Buffs recebidos do grupo (`source: "de Fulano"`) acumulam na ficha entre sessões — a
  substituição por nome (`applyBuffToCharacter`, `calculations.ts:491`) evita duplicata, mas não
  remove nada.
- Não existe conceito de **usos por dia**: `Ability` (`types/character.ts:130`) não tem contador.
- Recuperar PV/PM já tem botão: "✚ Curar tudo" por pool no popover (`VitalBar.tsx:320`, `:375`).
  Não há "descanso" que combine as coisas.

## H1.1 · Desligar todos os buffs de uma vez

**História** — Como jogador, quero desligar todos os buffs num toque (e apagar os que ficaram
desligados), para começar a cena/dia limpo sem clicar em cada chip.

**Critérios de aceite**
- [ ] No rodapé do `BuffsDrawer` (ao lado de "+ Buff", `BuffsDrawer.tsx:68-70`) há **"Desligar
      todos"**; desabilitado quando nenhum buff está ativo.
- [ ] Desligar todos remove a contribuição de PV/PM temporário de cada buff que estava ativo
      (mesma aritmética de `toggleBuffState` ao desativar), **sem devolver PM** (hoje o toggle
      também não devolve — comportamento preservado).
- [ ] Há uma segunda ação **"Limpar desligados"** que remove da lista os buffs com
      `active === false`. Buffs com `source` (recebidos do grupo) entram nessa limpeza.
- [ ] Ambas passam por `updateCharacter`, então **Desfazer** (`canUndo`/`undoLastChange` em
      `CharacterContext.tsx`) reverte a ação inteira como uma leva só.
- [ ] Bônus Fixos (`alwaysActive`) **não** são afetados — eles não vivem em `character.buffs[]`.
- [ ] Teste de unidade para a função pura cobrindo: dois buffs ativos com `temp_hp`, um inativo,
      um sem efeitos.

**Notas técnicas**
- Função pura em `calculations.ts`, ao lado de `toggleBuffState`:
  `deactivateAllBuffs(c: Character): Character` (percorre os ativos e aplica a mesma soma de
  `temp_hp`/`temp_mp` com sinal −1) e `removeInactiveBuffs(c)`.
- Confirmar "Limpar desligados" com `ui/ConfirmModal` só se houver mais de N itens; desligar não
  precisa de confirmação porque tem undo.

**Esforço** XS–S · **Depende de** — · **Questão aberta** — nenhuma.

## H1.2 · "Novo dia"

**História** — Como jogador, quero um botão de "Novo dia" que desligue todos os buffs, zere PV/PM
temporários e cure tudo de uma vez, para virar o dia sem lembrar de cada passo.

**Decisão (26/08)** — cura completa e **todos** os buffs desligados. Sem tabela de descanso do T20
e sem distinguir duração de buff; se a mesa quiser granularidade um dia, H1.4 cobre.

**Critérios de aceite**
- [ ] No menu "⋯" da `VitalBar` (junto de Anotações/Histórico) entra **"🌅 Novo dia"**, que abre um
      `ConfirmModal` listando o que vai acontecer: "N buffs desligados · PV temporário X e PM
      temporário Y zerados · PV e PM restaurados ao máximo".
- [ ] Confirmar: desliga todos os buffs (`deactivateAllBuffs` de H1.1), zera `temporaryHp` e
      `temporaryMp` (inclusive o digitado à mão) e leva `hp.current`/`mp.current` ao **máximo
      efetivo** via `applyHeal` de H4.1 — nunca cria temporário.
- [ ] Bônus Fixos (`alwaysActive`) não mudam. Buffs desligados **não** são removidos da lista (o
      jogador religa um permanente à mão se quiser; "Limpar desligados" de H1.1 apaga).
- [ ] Gera entrada no Histórico (`LogEntry.type: 'rest'`, ícone novo em `LOG_ICONS`) com o resumo
      acima.
- [ ] `sendHpUpdate` dispara depois (o grupo vê o PV novo).
- [ ] Undo reverte a leva inteira.
- [ ] Teste da função pura `newDay(c)` cobrindo: buffs ativos com `temp_hp`; temporário digitado à
      mão; PV abaixo do máximo; bônus fixo de `max_hp` (a cura mira o máximo efetivo, não o base).

**Notas técnicas** — `newDay(c)` em `calculations.ts`, ao lado de `toggleBuffState`: 
`deactivateAllBuffs` → zera temporários → `applyHeal(∞, 'hp')` → `applyHeal(∞, 'mp')`. Se H1.3
existir, também renova `usesLeft`.

**Esforço** S · **Depende de** H1.1, H4.1.

## H1.3 · Usos por dia em poderes

**História** — Como jogador, quero marcar quantas vezes por dia um poder pode ser usado e ver
quantas sobram, para o "Novo dia" renovar isso junto com o resto.

**Critérios de aceite**
- [ ] `Ability.usesPerDay?: number` e `Ability.usesLeft?: number` (`types/character.ts:130`).
- [ ] Campo "Usos por dia" no formulário de poder (`abilityFields`, `entityForms.ts`); vazio/0 =
      ilimitado (comportamento atual).
- [ ] `AbilityCard` mostra `2/3` ao lado do custo em PM; "▶ Usar" decrementa `usesLeft` e fica
      desabilitado em 0 com dica "sem usos hoje".
- [ ] `newDay` (H1.2) restaura `usesLeft = usesPerDay` em todos os poderes.
- [ ] Poder do catálogo (`data/powers.ts`) **não** ganha o campo automaticamente — o catálogo não
      marca frequência de uso; o jogador preenche.

**Esforço** M · **Depende de** H1.2 · **Questão aberta** — vale também "usos por cena"? Deixar
fora até aparecer caso real.

## H1.4 · (Opcional) Buff sabe sua duração + "Fim de cena"

**História** — Como jogador, quero que um buff saiba se dura a cena, o dia ou é permanente, para
ter um "Fim de cena" que desligue só o que expira — e para o "Novo dia" poupar os permanentes.

**Por que é opcional** — a decisão de 26/08 ("novo dia desliga tudo") dispensa a duração. Fica
registrado porque o dado **já existe na origem** e só se perde na conjuração: `Spell.duration` vem
do catálogo (73 magias "cena", 27 "sustentada", 21 "1 dia", 5 "1 rodada", 3 "permanente") e
`CastActionSheet.tsx:67-71` não o coloca no `buffPayload` — o mesmo caminho que a resistência
percorria antes do item 9 do doc anterior. Preservar custa pouco.

**Critérios de aceite** (se for feito)
- [ ] `Buff.duration?: 'cena' | 'dia' | 'permanente'` (`types/character.ts:82`); ausente ⇒ `'cena'`.
- [ ] Viaja na conjuração como `resistance`/`dc`: `CastActionSpec.duration`, `MagiasPanel.tsx:69-70`,
      `AcoesPanel.tsx:49-50`, `CastActionSheet.tsx:67-71` — inclusive no buff de grupo.
- [ ] Normalização texto → enum testada, em `utils/castAction.ts`: `sustentada`, `1 rodada`,
      `cena, até ser descarregada` ⇒ cena; `1 dia` ⇒ dia; `permanente…` ⇒ permanente;
      desconhecido ⇒ cena.
- [ ] Select "Duração" no formulário de buff manual; `BuffsDrawer` mostra na linha de metadados.
- [ ] Ação **"⏱ Fim de cena"** no menu "⋯": desliga só `'cena'` e zera temporários. "Novo dia"
      (H1.2) passa a poupar `'permanente'`.

**Esforço** S · **Depende de** H1.2.

---

# E2 · Fonte do catálogo de magias

**Pedido**
> mudar a api das magias

**Decisão (26/08)** — o catálogo atual foi montado a partir de uma fonte antiga, que não é mais a
usada; a "API" a trocar é a **fonte de conteúdo**: reimportar as magias da edição atualizada do
Tormenta20, usando o **Grimório T20** (`https://eduardomarques.pythonanywhere.com/`). Leituras
descartadas: expor o catálogo por endpoint HTTP (não pedido); a referência por id (H2.3) fica
**só** como meio de fazer a atualização chegar às fichas já existentes.

**Hoje**

- `client/src/data/spells.ts` (~202 magias, 256 KB) nasceu no commit `650e645` (17/08) com texto
  integral vindo da wiki `tsrd.fandom.com` — a fonte que `melhorias-ficha.md:226` cita e que hoje
  devolve 402. Em 19/08 o arquivo foi **reconciliado por nome** contra o Fichas de Nimb (cabeçalho
  em `spells.ts:25-26`): a lista de *quais* magias existem bate; **o texto, os aprimoramentos e os
  campos de bloco (`castingTime/range/area/duration/resistance`) continuam sendo os importados da
  fonte antiga**. Sintoma já visto na reconciliação: nomes de edição anterior ("Cólera do Sol",
  "Lágrimas da Deusa da Magia") — o mesmo vale para o corpo das magias.
- Não existe API HTTP de magias no servidor (`server/src/routes/*.js` só têm
  characters/parties/combat); a única menção é o broadcast de conjuração
  (`server/websocket.js:146-151`). Nada a mudar ali.
- Ao adicionar do catálogo, `spellToFormValues` (`entityForms.ts:398`) **copia** a magia para
  `character.spells[]` (forma `Spell`, `types/character.ts:109`) sem guardar de onde veio. Ou seja:
  reimportar o `spells.ts` corrige o picker, mas **não muda nenhuma magia já cadastrada nas
  fichas do grupo** — por isso H2.3 acompanha H2.2.
- Forma do catálogo: `OfficialSpell` (`spells.ts:6-17`), aprimoramentos só `{ mpCost, description }`.
- **Fonte escolhida — Grimório T20** (levantado em 26/08 com `curl`, que funciona contra o site):
  - Site server-rendered (Django no PythonAnywhere), leitura sem login, **sem API nem export**.
  - Lista: `GET /?book_magazine=<publicação>` → nomes + links `/<id>/` (id numérico estável).
    Demais filtros GET: `type1..3`, `school1..8`, `keyword`, `execution`, `duration`, `range`,
    `target_area_effect`, `resistance`. "Edição Jogo do Ano" devolve **197** magias; sem filtro,
    **275** (Ameaças de Arton, Deuses de Arton, Dragão Brasil, Heróis de Arton, Guia de NPCs,
    errata da Dragão Brasil, homebrew).
  - Detalhe `/<id>/`: Nome, Tipo, Círculo, Escola, Execução, Alcance, Alvo/Área/Efeito, Duração,
    Resistência, **Publicação**, Descrição, Aprimoramentos (linhas "Truque" e "+N PM") — cobre
    `OfficialSpell` inteiro e ainda traz a publicação, que hoje não guardamos.
  - **Nomes: 202/202 dos nossos existem no site.** Os 197 JdA batem 1:1 (única diferença é
    "Lendas e Histórias" vs "Lendas & Histórias"); os outros 5 são de suplemento — Conjurar
    Mortos-Vivos e Açoite Flamejante (*Ameaças de Arton*), Disparo Gélido, Detonação Congelante e
    Geiser Cáustico (*Dragão Brasil*). Conjurar Mortos-Vivos estava contado como "básico" na
    reconciliação de 19/08.
  - **Texto: difere de verdade.** Amostra de 2 magias JdA, 2 com diferença — *Arma Mágica*: alvo
    "1 arma" → "1 arma empunhada", "atributo-chave" → "atributo-chave de magias"; *Armadura
    Arcana*: aprimoramento de reação reescrito, "1 dia" → "um dia". Convenções distintas do site:
    `Resistência: nenhuma` (nós gravamos `''`) e **Truque como linha de aprimoramento** (nós o
    deixamos como último parágrafo da descrição).
  - Versão antiga do próprio site (pré-JdA): `http://grimorioantigo.pythonanywhere.com/` — serve
    para confirmar o que mudou entre edições. O site avisa "Tormenta 20 pertence a Jambo Editora"
    e dá o contato do mantenedor em `/about/`; é conteúdo de fã, mesmo status do nosso catálogo
    atual. Creditar a fonte no cabeçalho do `spells.ts`, baixar com intervalo (≈1 req/s; ~200
    páginas ≈ 4 min) e cachear o HTML localmente para não repetir.

## H2.1 · Script de importação e diff do Grimório T20

**História** — Como mantenedor do catálogo, quero um script que baixe as magias do Grimório T20,
converta para o formato do `spells.ts` e mostre o diff campo a campo, para a reimportação ser
revisão de diferenças e não digitação de 200 magias.

**Critérios de aceite**
- [ ] `tools/import_grimorio_t20.py` (Python, como os dois scripts que já existem em `tools/`):
      1. baixa `GET /?book_magazine=Edição Jogo do Ano` mais as publicações dos 5 extras (Ameaças
         de Arton, Dragão Brasil), guarda cada HTML em `tools/cache/grimorio/<id>.html` (não
         versionado) e respeita intervalo ≥ 1 s entre requisições;
      2. parseia cada `/<id>/` para um objeto com os campos de `OfficialSpell` + `publication`;
      3. normaliza para a nossa convenção: `Resistência: nenhuma` → `''`; "Truque" → último
         parágrafo da `description` prefixado `Truque:` (mantém o comportamento atual do app — ver
         questão aberta); nome `&` → `e` quando o nosso catálogo já usa "e"; `1º círculo` →
         `spellLevel: 1`;
      4. emite um diff legível por magia (campo · valor nosso · valor do site) e um resumo:
         quantas idênticas, quantas só com redação diferente, quantas com diferença em campo de
         **mecânica** (custo de aprimoramento, alcance, alvo, duração, resistência);
      5. com `--write`, regenera `client/src/data/spells.ts` inteiro, com cabeçalho declarando
         fonte, filtro, data e contagens.
- [ ] Rodar o diff **sem** `--write` sobre o `spells.ts` atual e guardar o relatório em `docs/` —
      é a evidência do tamanho da defasagem antes de trocar qualquer texto.
- [ ] Teste do parser sobre 2–3 HTMLs salvos como fixtures, incluindo uma magia com Truque e uma
      de suplemento.
- [ ] Docstring no topo do script: como rodar, o que cacheia, aviso de uso responsável do site.

**Esforço** S–M · **Depende de** — · **Questão aberta** — Truque continua dentro da descrição
(sem mudança de UI) ou vira `{ mpCost: 0, description: 'Truque: …' }` em `enhancements`,
aparecendo como opção de 0 PM na `CastActionSheet`? Recomendação: dentro da descrição nesta
rodada; a mudança de UI é história própria.

## H2.2 · Regenerar o `spells.ts` a partir do Grimório T20

**História** — Como jogador, quero que as magias do catálogo tragam texto, aprimoramentos e campos
da Edição Jogo do Ano, para não levar regras da versão antiga para a mesa.

**Critérios de aceite**
- [ ] `spells.ts` regenerado pelo script de H2.1 (`--write`), cobrindo as 202 magias atuais — 197
      JdA + 5 de suplemento — cada uma com `publication` preenchido (campo novo e opcional em
      `OfficialSpell`; sem uso na UI nesta rodada, mas é o que permite um filtro por suplemento no
      picker depois).
- [ ] Revisão humana do diff de H2.1: toda diferença em **campo de mecânica** listada na mensagem
      de commit ou em `docs/`, para a mesa saber o que mudou de regra.
- [ ] Nomes preservados como estão no nosso catálogo ("Lendas e Histórias"), para nenhuma ficha
      perder a correspondência por nome que H2.3 vai usar.
- [ ] Contagem por círculo e checagem de duplicata (comandos do cabeçalho) batem: 202 no total.
- [ ] `OfficialSpell` (fora o campo opcional novo), `SpellPicker` e `spellToFormValues` não mudam
      de contrato; testes atuais verdes; o picker continua achando "Heroísmo", "Bênção" etc. sem
      acento.
- [ ] Fatiável por círculo em 5 commits se o diff for grande — a geração é mecânica, a revisão é
      o gargalo.

**Notas técnicas** — dar mecânica (`buffs`/`attackModifiers`) aos aprimoramentos do catálogo fica
para H2.3, quando a hidratação der uso a isso.

**Esforço** M (revisão do diff; geração é mecânica) · **Depende de** H2.1.

## H2.3 · Magia da ficha referencia o catálogo por id (propaga a atualização)

**História** — Como jogador, quero que as magias que já adicionei recebam o texto atualizado do
catálogo automaticamente, sem perder o que personalizei (custo, resumo, buffs que configurei).

**Critérios de aceite**
- [ ] `OfficialSpell.id: string` (slug estável, ex. `heroismo`); teste de unicidade e de slug sem
      acento/espaço.
- [ ] `Spell.catalogId?: string`; `spellToFormValues` grava o id. Magia personalizada (à mão) fica
      sem id — nada muda para ela.
- [ ] `hydrateSpell(saved, catalog)`: campos **não editados** vêm do catálogo; editados prevalecem.
      Estratégia recomendada: `Spell.overrides?: string[]` com os nomes dos campos que o jogador
      tocou no formulário — simples de auditar, não depende de snapshot do catálogo.
- [ ] **Migração das fichas existentes**: magia sem `catalogId` cujo `name` casa com o catálogo
      (`normalizeSearch`) recebe o id na leitura; campos que diferem do catálogo **antigo** viram
      `overrides` (comparação feita uma vez, marcada com `catalogMigratedAt`). Idempotente.
- [ ] Hidratação roda em `CharacterContext.loadCharacter`/`setCharacterDirect`, junto de
      `normalizeBuffs`/`normalizeDamageReductions`.
- [ ] `SpellEnhancement` do catálogo aceita `buffs?`/`attackModifiers?` opcionais (unifica com
      `Enhancement` de `types/character.ts`), para a mecânica poder morar no catálogo.
- [ ] Testes: sem id passa intacta; id + `mpCost` editado mantém o custo e recebe `description`
      nova; id inexistente não quebra; migração por nome não casa "Silêncio" com "Silêncio Maior".

**Esforço** M · **Depende de** H2.2 — fazer logo atrás: a reimportação é o que dá valor à
propagação.

---

# E3 · Variáveis (atributo / nível) nos efeitos

**Pedido**
> opção de usar variáveis (atributo por exemplo) em diferentes lugares, tipo nas perícias, poderes
> e até nos ataques

**Hoje**

- O valor de todo efeito de buff é **texto interpretado como número**: `BuffEffect.value: string`
  (`types/character.ts:75`), lido como `Number(eff.value) || 0` em ~18 pontos de `calculations.ts`
  (`:110` atributo, `:126`/`:137` PV/PM máx, `:177` perícia, `:194` defesa, `:265` toggle,
  `:329` ataque, `:341` dano…) e de `attackCompose.ts`. Digitar `For` ou `+Int` vira **0 em
  silêncio**. O placeholder do campo diz "Ex.: 2 ou 1d6" (`entityForms.ts:74`).
- Perícia: `SkillData.misc: number` (`types/character.ts:234`) via `NumberField` — só número. O
  atributo-base já é trocável (`skill.attribute`), então "usar Sabedoria em vez de Carisma" já
  funciona; o que falta é **somar** um atributo como bônus.
- Ataque: `ExtraBonus.value: number` / `ExtraDamage.value: string` (`types/character.ts:31-41`)
  — só número/dado.
- **Precedente pronto**: `AttackModifier` já tem `attackRollAttribute` / `damageBonusAttribute`
  (`types/character.ts:43`), resolvidos por `resolveModifierNumbers` em `attackCompose.ts:39-56` com
  `getEffectiveAttribute`. É exatamente "variável por select", entregue no commit `1f06873` — só
  não chegou aos efeitos de buff nem aos modificadores próprios do ataque.

**Decisão de desenho registrada**: seguir o precedente (campo estruturado + select) em vez de
mini-linguagem de fórmula no texto. Motivos: zero parser, zero ambiguidade de sintaxe para o
jogador, testável, e é o padrão que a ficha já usa. A fórmula livre fica como possível evolução
se aparecer caso que o select não cobre.

## H3.1 · Motor: valor de efeito = fixo + atributo + nível

**História** — Como jogador, quero que um efeito possa valer "+2 + Inteligência" ou "+ metade do
nível", para representar poderes do T20 sem recalcular à mão a cada nível.

**Critérios de aceite**
- [ ] `BuffEffect` ganha `attributeBonus?: AttributeId` e `levelBonus?: 'full' | 'half'`. `value`
      continua o termo fixo (e continua string por causa dos dados em `extra_damage`).
- [ ] Um único `resolveEffectValue(eff, character): number` em `utils/buffEffects.ts` devolve
      `Number(value) + atributo + nível`. **Todos** os `Number(eff.value)` de `calculations.ts` e
      `attackCompose.ts` passam a usar essa função — exceto `extra_damage`, que segue string de
      dado.
- [ ] **Sem ciclo**: ao resolver `attributeBonus`, o atributo é lido com os buffs de atributo de
      **valor fixo** apenas (um nível de derivação). Teste explícito: "+For em Des" e "+Des em For"
      ativos ao mesmo tempo terminam e dão o resultado documentado.
- [ ] `getDefenseBreakdown` e os resumos (`summarizeEffects`, `effectTag`) mostram o **número
      resolvido**, e o rótulo indica a variável (`Misticismo +Int` / `+2 +Int`).
- [ ] Buffs recebidos do grupo: variável de atributo é **congelada na conjuração** com o valor do
      conjurador (`CastActionSheet` resolve antes de montar `buffPayload`), igual `dc`. Buff só
      para si continua dinâmico.
- [ ] Testes em `buffEffects.test.ts` e nos existentes de `calculations.test.ts` (nenhum resultado
      atual muda quando os campos novos estão ausentes).

**Notas técnicas** — `normalizeEffectType` já é o ponto de leitura único de tipo; `resolveEffectValue`
vira o par dele para valor. Fichas antigas não têm os campos ⇒ resultado idêntico ao de hoje.

**Esforço** M · **Depende de** — · **Questão aberta** — congelar no grupo é o padrão certo?
Alternativa: resolver no receptor (usa o atributo de quem recebe). Recomendação: congelar — os
números de uma magia saem do conjurador.

## H3.2 · Formulário e exibição do "+ atributo / + nível"

**História** — Como jogador, quero escolher a variável no próprio formulário do efeito, em todo
lugar que aceita efeitos de buff.

**Critérios de aceite**
- [ ] Em `buffEffectFields` (`entityForms.ts:63-75`) entram dois selects meia-largura abaixo de
      Valor: **"+ atributo"** (— Nenhum —, For, Des, Con, Int, Sab, Car) e **"+ nível"** (Não /
      Nível / Metade do nível). Por herdarem a mesma lista de campos, valem em poderes, magias
      (base e aprimoramentos), buffs manuais, itens e melhorias de armadura.
- [ ] `effectsFromValues`/`effectsToForm` (`entityForms.ts:430-445`) mapeiam os campos novos;
      select vazio ⇒ campo ausente (não grava `''`).
- [ ] Placeholder do Valor passa a "Ex.: 2, -1 ou 1d6 (dado só em Dano Extra)".
- [ ] Chips (`ConditionChip`), `BuffsDrawer`, `FixedBonusesPanel` e `AbilityCard` mostram o
      resumo com a variável.

**Esforço** S · **Depende de** H3.1.

## H3.3 · Modificadores próprios do ataque aceitam atributo

**História** — Como jogador, quero que um modificador cadastrado no próprio ataque some um
atributo, como os modificadores de poder/item já fazem.

**Critérios de aceite**
- [ ] `ExtraBonus` e `ExtraDamage` ganham `attribute?: AttributeId` (`types/character.ts:31-41`);
      selects correspondentes nas listas `extraBonuses`/`extraDamage` (`entityForms.ts:495-507`).
- [ ] `buildAttackChecklist` (`attackCompose.ts:154`) resolve o atributo nos itens `own-bonus-*` /
      `own-damage-*`; `calcAttackRoll`/`calcDamageBonus` (`calculations.ts:323`, `:335`) idem, para
      o card em repouso bater com a modal.
- [ ] Testes em `attackCompose.test.ts`.

**Notas técnicas** — alternativa mais limpa e mais cara: migrar `extraBonuses`/`extraDamage` para
`Attack.modifiers: AttackModifier[]` com migração de leitura, eliminando as duas formas paralelas.
Registrar como dívida; não bloquear a história por isso.

**Esforço** S · **Depende de** H3.1.

## H3.4 · Bônus por atributo direto na linha da perícia

**História** — Como jogador, quero somar um segundo atributo a uma perícia direto na linha dela,
sem criar um poder só para isso.

**Critérios de aceite**
- [ ] `SkillData.bonusAttribute?: AttributeId`; select compacto em `SkillRow` ao lado do bônus
      diverso, só no modo edição.
- [ ] `calcTotalSkill` (`calculations.ts:154`) soma o atributo com a mesma regra anti-ciclo de H3.1.
- [ ] Filtro/ordenação do `SkillsPanel` inalterados.

**Esforço** S · **Depende de** H3.1 · **Nota** — o caminho "poder com efeito de perícia + atributo"
(H3.1/H3.2) já cobre o caso; esta história é conveniência. P2.

---

# E4 · PV/PM temporários como sobrevida

**Pedido**
> melhorar a barra de HP e MP (vida e mana temporária funcionam como sobrevida, e são removidas
> primeiro e não são curáveis)

**Hoje** — o temporário **estica o máximo** em vez de ser um pool à parte, e isso produz número
errado em três lugares:

- `VitalBar.tsx:71-72`: `hpMax = effectiveMaxHp + tempHp`; `hp.current` é clampado nesse teto
  (`:74-76`) e a barra é `current / hpMax` (`:206`). Ou seja, `hp.current` **inclui** o temporário.
- Dano pelo Stepper desconta de `hp.current` direto — o temporário **nunca é consumido primeiro**;
  ele só "encolhe o teto" quando o buff desliga.
- **"✚ Curar tudo" cura o temporário** (`:320`, `:375` → `setHpCurrent(hpMax)`), o oposto da regra.
- Quando um buff de `temp_hp` desliga, `toggleBuffState` (`calculations.ts:249-279`) reduz
  `temporaryHp` mas **não toca `hp.current`** — o atual fica acima do máximo até alguém mexer.
- Para compensar o modelo, `applyBuffToCharacter` (`calculations.ts:526-548`, commit `847c70d`)
  **cura** `hp.current` no valor do temporário recebido, e o servidor faz o mesmo em
  `mergeBuffIntoCharacter` (`server/src/utils/buffMerge.js:62-85`). Isso é sintoma: num pool
  separado, receber PV temporário não deveria curar nada.
- O grupo não vê o temporário: `character_hp_update` só carrega `hp`/`mp`
  (`server/websocket.js:119-126`); o mestre aplica dano com `Math.min(character.hp.max, …)`
  (`contexts/CombatContext.tsx:428`) — ignora tanto o temporário quanto os bônus fixos de máximo.
- `components/character/HpMp/HpMp.tsx` (painel legado) não é montado por ninguém — candidato a
  remoção junto com esta leva, para não carregar dois modelos.

## H4.1 · Modelo: temporário é pool separado, consumido antes, nunca curado

**História** — Como jogador, quero que PV/PM temporários funcionem como sobrevida: dano tira deles
primeiro, cura nunca os repõe, e o PV atual nunca passa do máximo.

**Critérios de aceite**
- [ ] Invariante: `0 ≤ hp.current ≤ getEffectiveMaxHp(c)` e `temporaryHp ≥ 0`, independente.
      Mesmo para PM.
- [ ] Funções puras em `calculations.ts` (ou `utils/vitals.ts` novo), testadas:
      `applyDamage(c, amount, pool: 'hp' | 'mp')` — consome temporário, o resto sai do atual, nunca
      abaixo de 0; devolve também `{ fromTemp, fromCurrent }` para o log de H5.
      `applyHeal(c, amount, pool)` — só sobe o atual até o máximo efetivo; temporário intacto.
      `normalizeVitals(c)` — migração de leitura: `hp.current > máximo efetivo` ⇒ clampa (o excesso
      era temporário e já está em `temporaryHp`). Idempotente; roda em `loadCharacter` /
      `setCharacterDirect`.
- [ ] `applyBuffToCharacter` **deixa de curar** por `temp_hp`/`temp_mp`; mantém a cura por
      `max_hp`/`max_mp` (subir o máximo sobe o atual junto — regra do T20) e o teto passa a ser
      `getEffectiveMaxHp(next)` **sem** `+ temporaryHp`. Testes de `calculations.test.ts` ajustados
      — a mudança neles é parte da história.
- [ ] `VitalBar`: Stepper com `max = effectiveMax`; botões −/+ do Stepper chamam
      `applyDamage(1)`/`applyHeal(1)`; digitar um valor define `hp.current` clampado ao máximo.
      "Curar tudo" = `applyHeal(∞)`. Campo "Temporário" continua editável à mão.
- [ ] `toggleBuffState` desativando um `temp_hp` só reduz o pool temporário (já faz) — e agora isso
      é coerente, porque o atual não o incluía.

**Esforço** M · **Depende de** — · **Decisão (26/08)** — PV/PM temporários de fontes diferentes
**somam** (comportamento atual preservado; a regra "vale o maior" do T20 não entra).

## H4.2 · Barra e popover mostram o temporário como segmento próprio

**História** — Como jogador, quero ver na barra quanto é vida "de verdade" e quanto é sobrevida.

**Critérios de aceite**
- [ ] Na `VitalBar` a trilha representa `máximo efetivo + temporário`; o preenchimento principal
      é `current / máximo`, e o temporário aparece como **segmento distinto** (cor/hachura própria,
      token de tema, não hex solto) **após o máximo**, para não parecer que "preenche" o vazio até
      o máximo. Legenda mantém `18 (+5) /30`.
- [ ] Popover de PV/PM: linha "Temporário" destaca que é consumido primeiro e não é curável (uma
      linha de ajuda), e mostra a origem quando vem de buff ativo (nome do buff).
- [ ] Sem temporário, nada muda visualmente em relação a hoje.
- [ ] Tema claro e escuro verificados (padrão da ficha "Codex").

**Esforço** S · **Depende de** H4.1.

## H4.3 · Espelho no servidor, websocket e visão do mestre

**História** — Como mestre, quero que o dano que eu aplico e o PV que eu vejo dos jogadores
respeitem o mesmo modelo de sobrevida da ficha deles.

**Critérios de aceite**
- [ ] `mergeBuffIntoCharacter` (`server/src/utils/buffMerge.js`) deixa de curar por
      `temp_hp`/`temp_mp` e tira `hpTemp` do teto — mesma mudança de H4.1; `buffMerge.test.js`
      ajustado. (O cabeçalho da função diz "mudou aqui, muda lá" — esta história é o "lá".)
- [ ] `character_hp_update`/`character_hp_sync` (`server/websocket.js:119-126`,
      `CharacterContext.tsx`) carregam `temporaryHp`/`temporaryMp`; o handler de sync aplica.
- [ ] `CombatContext.applyHpChange` (`:423-440`) usa `applyDamage`/`applyHeal` e clampa no máximo
      **efetivo**, não em `hp.max`; o payload de `master_hp_update` inclui o temporário.
- [ ] Lista de jogadores do mestre (`GameMasterPage`, `PartyCharacter` DTO) mostra `atual (+temp)
      / máx`.

**Esforço** S–M · **Depende de** H4.1 · **Nota** — o servidor não conhece bônus fixos de máximo
(moram no conteúdo da ficha); o cliente já reclampa ao aplicar localmente. Manter esse
comportamento e documentar.

---

# E5 · Botão "Tomar dano" com RD

**Pedido**
> um botão pra tomar dano, reforçando as RD que você tem, tu escreve o valor, as RDs e ele tira
> sozinho o hp, pra n ter q ficar spammando o valor

**Hoje**

- RD já é lista por tipo: `damageReductions: { name, value }[]` (`types/character.ts:216`),
  editada em `DefenseBreakdown` ("+ RD") com `rdConfig` (`entityForms.ts:604`) — `name` é texto
  livre ("Geral" = contra tudo). Existe `DAMAGE_TYPES` com os 12 tipos oficiais em
  `data/constants.ts`, usado no ataque mas **não** na RD.
- Tomar dano é o Stepper do popover de PV: −1 por clique ou digitar o resultado da subtração de
  cabeça. RD não entra em lugar nenhum; nada vai para o Histórico (`LogEntry` só tem
  `attack/spell/buff_on/buff_off`, `LOG_ICONS` idem).
- Ferramentas prontas para reutilizar: `normalizeSearch` (`utils/formatters.ts`) para casar
  "Fogo" com "fogo"; `Sheet`/`Popover`; `Chip`; `applyDamage` de H4.1; padrão de campo numérico
  (draft-string, select-on-focus, normaliza no blur — nunca `type=number` controlado).

## H5.1 · Ação "Tomar dano"

**História** — Como jogador, quero digitar o dano recebido e o tipo, ver quais RDs se aplicam e
confirmar, para a ficha descontar do PV (e do temporário) sozinha.

**Critérios de aceite**
- [ ] No popover de PV da `VitalBar` entra **"💥 Tomar dano"** (ao lado de "Curar tudo"), abrindo um
      `Sheet` compacto.
- [ ] Campos: **Dano** (numérico, padrão de draft-string, foco automático) e **Tipo** (chips com
      `DAMAGE_TYPES` + "Sem tipo"; opcional).
- [ ] **RDs aplicáveis** listadas como chips ligáveis, pré-selecionadas assim: "Geral" sempre
      ligada; RD cujo `name` casa com o tipo escolhido (`normalizeSearch`) ligada; as demais
      desligadas mas visíveis. RD com valor 0 não aparece.
- [ ] As RDs ligadas **somam** (decisão de 26/08 — regra da mesa; o T20 diria "vale a maior", não
      implementar). Toggle "Ignora RD" zera tudo.
- [ ] Prévia em tempo real antes de confirmar: `12 − RD 7 (Geral 5 + Fogo 2) = 5 → 3 do PV
      temporário, 2 do PV` (usa o retorno `{ fromTemp, fromCurrent }` de `applyDamage`). Dano
      líquido nunca negativo.
- [ ] Confirmar aplica `applyDamage`, grava `LogEntry { type: 'damage', name: 'Dano recebido',
      details: { amount, damageType, rdApplied, net, fromTemp, fromCurrent } }`
      (ícone novo em `LOG_ICONS`; `LogsSheet.formatDetails` mostra a linha), dispara
      `sendHpUpdate` e um toast com o líquido.
- [ ] Enter confirma; Esc fecha; undo reverte.
- [ ] Sem RD cadastrada, o Sheet ainda funciona (só valor + prévia) — continua sendo o jeito
      rápido de aplicar um dano grande sem spammar o Stepper.

**Notas técnicas** — função pura `computeDamageTaken(c, { amount, damageType, rdIds, ignoreRd })`
em `utils/vitals.ts`, testada: sem RD; RD geral; RD por tipo casando/não casando; duas RDs
somando; dano menor que a soma das RDs (líquido 0, nada muda). O componente só renderiza o
resultado dela.

**Esforço** M · **Depende de** H4.1 · **Decisão (26/08)** — RDs somam.

## H5.2 · Mestre aplica dano no jogador usando as RDs dele

**História** — Como mestre, quero aplicar dano num jogador a partir da tela de combate já
descontando as RDs e o temporário dele, para não pedir a conta ao jogador.

**Critérios de aceite**
- [ ] Na linha do jogador em `GameMasterPage`/combate, "Dano" abre o mesmo Sheet de H5.1, com as
      RDs e o temporário **do alvo** (o DTO de `PartyCharacter` passa a incluir
      `damageReductions`, `temporaryHp`, máximo efetivo).
- [ ] Aplicação via `applyHpChange` (H4.3), que grava e faz broadcast; o jogador recebe toast
      "PV atualizado pelo mestre" com o líquido.
- [ ] Log na ficha do jogador com `source: 'mestre'`.

**Esforço** M · **Depende de** H5.1, H4.3.

---

# Apêndice A · Mapa de arquivos por história

| História | Arquivos |
|---|---|
| H1.1 | `utils/calculations.ts` · `components/sheet/BuffsDrawer/` |
| H1.2 | `utils/calculations.ts` · `components/sheet/VitalBar/` · `ui/ConfirmModal` · `data/constants.ts` (`LOG_ICONS`) |
| H1.3 | `types/character.ts` · `SheetForm/entityForms.ts` · `components/sheet/{AbilityCard,PoderesPanel,AcoesPanel}/` |
| H1.4 | `types/character.ts` · `utils/castAction.ts` · `components/sheet/{CastActionSheet,MagiasPanel,AcoesPanel,BuffsDrawer,VitalBar}/` · `SheetForm/entityForms.ts` |
| H2.1 | `tools/import_grimorio_t20.py` (novo) · `tools/cache/grimorio/` (ignorado no git) · `docs/` (relatório do diff) |
| H2.2 | `data/spells.ts` (regenerado, com `publication` e cabeçalho novo) |
| H2.3 | `data/spells.ts` · `types/character.ts` · `SheetForm/entityForms.ts` · `contexts/CharacterContext.tsx` · `utils/formatters.ts` |
| H3.1 | `types/character.ts` · `utils/buffEffects.ts` · `utils/calculations.ts` · `utils/attackCompose.ts` · `components/sheet/CastActionSheet/` |
| H3.2 | `SheetForm/entityForms.ts` · `utils/buffEffects.ts` · `components/sheet/{ConditionChip,BuffsDrawer,FixedBonusesPanel,AbilityCard}/` |
| H3.3 | `types/character.ts` · `SheetForm/entityForms.ts` · `utils/attackCompose.ts` · `utils/calculations.ts` |
| H3.4 | `types/character.ts` · `utils/calculations.ts` · `components/sheet/SkillRow/` |
| H4.1 | `utils/calculations.ts` (ou `utils/vitals.ts`) · `contexts/CharacterContext.tsx` · `components/sheet/VitalBar/` · remoção de `components/character/HpMp/` |
| H4.2 | `components/sheet/VitalBar/` (+ CSS) |
| H4.3 | `server/src/utils/buffMerge.js` (+ test) · `server/websocket.js` · `contexts/{CharacterContext,CombatContext}.tsx` · `pages/GameMasterPage/` · `api/parties.ts` |
| H5.1 | `utils/vitals.ts` (novo) · `components/sheet/VitalBar/` · componente novo `TakeDamageSheet` · `data/constants.ts` · `components/sheet/LogsSheet/` |
| H5.2 | `pages/GameMasterPage/` · `contexts/CombatContext.tsx` · `server/src/dto/` |

# Apêndice B · Regras assumidas (T20 × decisão da mesa, 26/08)

- **Novo dia**: cura completa de PV/PM e **todos** os buffs desligados (decisão da mesa). A tabela
  de descanso do T20 (½/1/2/3× nível) não é implementada.
- **PV/PM temporários**: perdidos antes dos normais e não curáveis (regra do T20, implementada em
  E4). Fontes diferentes **somam** (decisão da mesa; a regra "vale o maior" não entra).
- **Redução de dano**: RDs aplicáveis **somam** (decisão da mesa; o T20 usa só a maior).
- **Duração de buff**: só entra se H1.4 for feita; até lá o app não distingue cena/dia/permanente.
