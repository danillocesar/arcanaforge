# Melhorias da ficha — Tormenta 20

Organização do brainstorm de 19/08/2026. Cada ideia foi cruzada com o código antes de
entrar aqui, para separar **o que é ideia nova** do **que já é defeito**: quatro itens da
lista não são pedido de feature, são bug que hoje produz número errado na ficha.

Formato de cada item: **Pedido** (frase original preservada) → **Hoje** (o que o código faz,
com `arquivo:linha`) → **Proposta** → **Esforço / risco**.

> Nota de arquitetura: o schema do Mongo é `strict: false` (`server/db/models/Character.js:16`),
> ou seja campo novo em personagem persiste sem migração de servidor. **Nenhum item desta lista
> exige mexer no back-end** — tudo é cliente, mais normalização de leitura em `CharacterContext`.

---

## Resumo executivo

| # | Item | Tipo | Prioridade | Esforço |
|---|------|------|-----------|---------|
| 1 | Perícias só-treinadas precisam ficar zeradas | Bug de regra | P0 | XS |
| 2 | Treino em perícia escalável por nível | Bug de regra | P0 | XS |
| 3 | Botão "Usar" em poder sempre ativo (bônus em dobro) | Bug de cálculo | P0 | XS |
| 4 | Custo de PM automático por círculo | Bug de regra | P0 | S |
| 5 | Busca dos pickers ignora acento | Bug de UX | P0 | XS |
| 6 | Catálogo de magias incompleto | Conteúdo | P1 | M |
| 7 | Aprimoramento não pode ser aplicado mais de uma vez | Feature | P1 | S |
| 8 | Bônus fixos precisam ser toggle | Feature | P1 | S–M |
| 9 | Testes de resistência nos buffs | Feature | P1 | M |
| 10 | RD por tipo (lista livre) | Modelo de dados | P1 | M |
| 11 | Resumo da magia | Feature + conteúdo | P1 | S + M |
| 12 | Poderes por tipo, acordeon e favoritos | Feature | P2 | M |
| 13 | Itens esotéricos | Modelo de dados | P2 | S–M |
| 14 | Melhorias e encantos de item | Feature + conteúdo | P2 | L |

São 13 ideias originais em 14 seções: a de "magias faltando" tem **duas causas independentes**
(busca com acento + catálogo incompleto) e virou os itens 5 e 6.

**Sugestão de ataque:** P0 inteiro em uma leva (é meio dia de trabalho e conserta a matemática
da ficha), depois 7/8/9 juntos porque os três mexem no mesmo fluxo de buff, e o 12 quando
sobrar fôlego — é o de maior ganho no uso diário, mas o único que pede desenho de tela novo.

---

# P0 · Regras que hoje calculam errado

## 1. Perícias só-treinadas precisam ficar zeradas

**Pedido**
> perícias específicas que não foram treinadas precisam continuar zeradas — Adestramento
> Atuação Conhecimento Guerra Jogatina Ladinagem Misticismo Nobreza Ofício Pilotagem Religião

**Hoje**
`calcTotalSkill` (`client/src/utils/calculations.ts:134-157`) **nunca lê `cfg.trained`**. O flag
existe em `SKILLS_CONFIG` e é usado só para exibição. Resultado: Misticismo destreinado em um
personagem de nível 8 com Int 4 devolve `4 + 4 = 8`, quando a regra manda não poder usar.

Segundo achado: das 11 perícias que você listou, **10 já têm `trained: true`** no catálogo —
**`Religião` está sem o flag** (`client/src/data/pericias.ts:40`), diferente de todas as outras
da mesma família.

**Proposta**
1. `pericias.ts:40` — acrescentar `trained: true` em Religião.
2. `calcTotalSkill` — no topo, depois de resolver `cfg` e `skill`:
   `if (cfg.trained && !skill.trained) return 0;`
3. `SkillRow` — perícia bloqueada renderiza `—` em vez de `+0`, com estado visual apagado,
   para o jogador entender que é "não pode usar", não "bônus zero".

**Esforço / risco** — XS. Risco baixo; o único efeito colateral é ficha antiga que
"ganhava" bônus indevido passar a mostrar `—`. É a correção, não uma regressão.

---

## 2. Treino em perícia escalável por nível

**Pedido**
> treino nas perícias scalável - acho que é 1-6 +2, 7-14 +4, 15-20 +6

**Hoje**
`calculations.ts:143` é literalmente `const trainingBonus = skill.trained ? 2 : 0;` — fixo em
+2 em qualquer nível. A tabela que você lembrou é a oficial do T20.

**Proposta**
Helper em `calculations.ts`, ao lado de `getTotalLevel`:

```ts
/** Bônus de treinamento do T20: +2 até 6º, +4 do 7º ao 14º, +6 do 15º em diante. */
export function trainingBonusForLevel(level: number): number {
  if (level >= 15) return 6;
  if (level >= 7) return 4;
  return 2;
}
```

e em `calcTotalSkill`:
`const trainingBonus = skill.trained ? trainingBonusForLevel(getTotalLevel(character)) : 0;`

**Esforço / risco** — XS. Atenção: `client/src/utils/calculations.test.ts` tem casos que fixam
o +2 atual e vão quebrar — a atualização deles faz parte da tarefa, não é falha.

---

## 3. Botão "Usar" em poder sempre ativo → bônus contado em dobro

**Pedido**
> tirar o botão de usar se não for conjurável (sempre ativo) - eu não preciso usar se ele for
> sempre ativo (tipo uma passiva)

**Hoje**
`AbilityCard.tsx:21`:

```ts
const showUse = onUse && (mpCost > 0 || hasBuffs);
```

Não olha `ability.alwaysActive`. Um poder passivo com buffs cai em `hasBuffs` e ganha o botão
"▶ Usar". E o problema é maior do que o botão sobrando: `synthesizeAlwaysActiveBuffs`
(`calculations.ts:65-75`) **já injeta** os buffs desse poder em todo cálculo. Clicar em "Usar"
cria uma segunda instância em `character.buffs[]` — **o bônus passa a ser somado duas vezes**,
e o jogador não tem como perceber olhando a ficha.

**Proposta**
```ts
const showUse = onUse && !ability.alwaysActive && (mpCost > 0 || hasBuffs);
```
`isPassive` (linha 22) passa a cobrir o caso automaticamente, então o chip "Passiva" aparece
onde antes aparecia o botão. Vale conferir se `PoderesPanel.handleUse` precisa da mesma guarda
como cinto de segurança.

**Esforço / risco** — XS. É o item de maior retorno por linha da lista inteira: some um botão
errado e para de corromper a matemática.

---

## 4. Custo de PM automático por círculo

**Pedido**
> custo das magias por círculo automaticamente - spellLevel=1 mpCost=1; spellLevel=2 mpCost=3;
> spellLevel=3 mpCost=6; spellLevel=4 mpCost=10; spellLevel=5 mpCost=15

**Hoje**
Toda magia nasce custando 1 PM, inclusive as de 5º círculo:
- `entityForms.ts:326` — `spellToFormValues` grava `mpCost: 1` fixo ao trazer do catálogo
- `entityForms.ts:278` — `magiaConfig.empty()` idem, na magia personalizada

O catálogo oficial (`data/spells.ts`) traz o `mpCost` correto **dos aprimoramentos**, mas nunca
o custo-base da magia — esse dado simplesmente não existe no arquivo, é derivado do círculo.

**Proposta**
1. `client/src/data/constants.ts`:
   ```ts
   /** Custo-base de PM por círculo (T20, tabela de conjuração). */
   export const SPELL_LEVEL_MP_COST: Record<number, number> = { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15 };
   export const baseMpCostForLevel = (level: number) => SPELL_LEVEL_MP_COST[level] ?? 1;
   ```
2. `spellToFormValues` → `mpCost: baseMpCostForLevel(spell.spellLevel)`.
3. `magiaConfig` → recalcular o campo Custo quando o campo Círculo muda no formulário,
   **mantendo o campo editável**: poderes e habilidades de classe alteram custo, e magia já
   cadastrada com custo customizado não pode ser sobrescrita.

**Esforço / risco** — S. A decisão de produto a tomar é só uma: sobrescrever ou não o custo já
digitado quando o círculo muda. Recomendação: sobrescrever apenas se o valor atual for igual ao
custo-base do círculo anterior (ou seja, se o jogador nunca tocou nele).

---

## 5. Busca dos pickers ignora acento

**Pedido**
> tem umas magias faltando, por algum motivo — EU PROCUREI HEROÍSMO, NO FIM ADICIONEI NA MÃO,
> MAS ALGUMA COISA ELE N TÁ ACHANDO

**Hoje**
Três pickers filtram com comparação crua, sem normalizar diacrítico:
- `SpellPicker.tsx:23-27` — `spell.name.toLowerCase().includes(query)`
- `PowerPicker.tsx:33-37` — mesma coisa
- `ConditionPicker.tsx:20-23` — mesma coisa

Digitar `heroismo`, `bencao`, `misticismo` ou `explosao` não acha nada, mesmo com a entrada
presente no catálogo. E o helper certo **já existe e já é usado em três outros lugares**:
`normalizeSearch` (`client/src/utils/formatters.ts:2`), em `SkillsPanel`, `OriginPicker` e
`SelectPage`. Os pickers simplesmente não foram atualizados junto.

**Proposta**
Trocar os três filtros por `normalizeSearch`, e aproveitar para casar também escola/categoria,
não só o nome:

```ts
const query = normalizeSearch(search);
const visible = OFFICIAL_SPELLS.filter((spell) => {
  if (level != null && spell.spellLevel !== level) return false;
  if (!query) return true;
  return normalizeSearch(`${spell.name} ${spell.school}`).includes(query);
});
```

**Esforço / risco** — XS, três arquivos, nenhum risco. Vale um teste de unidade fixando
`normalizeSearch('Heroísmo').includes('heroismo')` para não regredir de novo.

---

# P1 · Atrito no uso diário

## 6. Catálogo de magias incompleto

**Pedido** — mesma frase do item 5. O acento explica parte do sintoma; esta é a outra parte.

**Hoje**
`data/spells.ts` tem **201 entradas**, distribuídas em 59 / 47 / 39 / 30 / 26 por círculo. O
comentário do arquivo afirma serem "as 201 magias oficiais do livro básico" — a afirmação não
se sustenta. Busca direta por nome confirma ausentes:

| Magia | No catálogo? |
|---|---|
| Heroísmo | ausente |
| Teleporte | ausente |
| Ressurreição | ausente |
| Poder Divino | ausente |
| Convocar Criatura / Monstro | ausente |
| Servo Zumbi | ausente |
| Marca da Caçada | ausente |

Ou seja: no caso do Heroísmo especificamente, **nem corrigindo a busca ele apareceria**. Você
adicionou na mão porque a magia não existe no arquivo.

**Proposta**
1. Passe de reconciliação do `data/spells.ts` contra a fonte (tsrd.fandom.com/pt-br), círculo a
   círculo, registrando a contagem real por círculo no comentário do topo — e corrigindo o
   comentário atual, que hoje é informação errada dentro do código.
2. No `SpellPicker`, quando a busca não retorna nada, o estado vazio (`SpellPicker.tsx`, `.empty`)
   passa a oferecer **"Criar '<termo>' como magia personalizada"** em vez do texto morto
   "Nenhuma magia encontrada" — assim o beco sem saída vira um atalho.

**Esforço / risco** — M, quase todo de digitação de dados. Baixo risco técnico. Item bom para
fatiar por círculo, ou para delegar.

---

## 7. Aprimoramento não pode ser aplicado mais de uma vez

**Pedido**
> sistema de adição dos buffs ver coé — NÃO POSSO SPAMMAR UM APRIMORAMENTO NA MAGIA

**Hoje**
`CastActionSheet.tsx:36` — `const [selectedEnh, setSelectedEnh] = useState<boolean[]>([])`. Cada
aprimoramento é um checkbox liga/desliga (`CastActionSheet.tsx:263`), o custo soma no máximo uma
vez (`:60`) e os buffs entram no máximo uma vez (`:68`). Aprimoramento do tipo "+1 PM: aumenta o
dano em +1d6", que no T20 se aplica repetidamente, fica capado em uma aplicação.

**Proposta**
1. `selectedEnh: boolean[]` → `counts: number[]`, com `Stepper` (componente já existente) por
   linha no lugar do checkbox.
2. Custo: `sum(enh.mpCost * counts[i])`.
3. Buffs: replicar `enh.buffs` `counts[i]` vezes. Para dado extra isso já funciona sem código
   novo — `buildDamageSummary` (`calculations.ts`) concatena dados repetidos com `+`, então
   3× `1d6` sai como `1d6+1d6+1d6`. (Melhoria futura opcional: colapsar para `3d6`.)

**Decisão registrada:** o catálogo não marca quais aprimoramentos são repetíveis e quais não são,
e inventar um campo `repeatable` sem fonte significaria chutar 201 magias. A recomendação é
**liberar a contagem em todos e confiar no jogador**, que é o comportamento de mesa.

**Esforço / risco** — S, isolado em um componente.

---

## 8. Bônus fixos precisam ser toggle

**Pedido**
> Bônus fixos devem ser toggle tb, as vezes tu perde por algum motivo (ficou agarrado perde
> algumas defesas).

**Hoje**
`FixedBonusesPanel.tsx` é somente leitura **por desenho** — o comentário do próprio arquivo diz
"só leitura, nunca desliga". A lista não é estado, é derivada em tempo real de `alwaysActive` em
`abilities` e `inventory` (`synthesizeAlwaysActiveBuffs`, `calculations.ts:65-75`). Não existe
lugar onde gravar "este bônus está suspenso agora", então o seu caso — ficou agarrado, perde a
defesa da armadura — é irrepresentável sem editar o poder/item e desmarcar "Sempre ativo".

**Proposta**
Campo `suppressed?: boolean` **no próprio `Ability` / `InventoryItem`**, não uma lista de índices
em `Character`. Motivo: índice quebra quando o jogador reordena ou remove um poder; o flag no
objeto acompanha o dono.

1. `types/character.ts` — `suppressed?: boolean` em `Ability` e `InventoryItem`.
2. `synthesizeAlwaysActiveBuffs` — filtra `!a.suppressed` / `!it.suppressed`.
3. `FixedBonusesPanel` — cada linha ganha o mesmo dot de liga/desliga do `BuffsDrawer`
   (`BuffsDrawer.tsx:88`), e a linha suspensa fica apagada com o valor riscado.

Como o efeito é derivado, desligar e religar é reversível de graça: não mexe em PM, não mexe em
PV temporário, não precisa de `toggleBuffState`.

**Esforço / risco** — S–M. Único ponto de atenção: `attackModifiers` de item também são lidos
independentemente de `alwaysActive` (`attackCompose.ts`) — decidir se `suppressed` os afeta
também. Recomendação: sim, para o comportamento ser um só.

---

## 9. Testes de resistência nos buffs

**Pedido**
> testes de resistência (nos buffs) pra facilitar a ficha

**Hoje**
`Buff` (`types/character.ts`) não tem nenhum campo de resistência. O dado até existe na origem —
`Spell.resistance` guarda "Vontade anula", "Fortitude parcial" etc., e vem preenchido do catálogo
— mas **morre na conjuração**: `CastActionSheet` monta o buff com
`{ name, effects, mp, active, source }` e descarta a resistência. A CD também já é calculável e
não é usada aqui: `calcSpellResistance` (`calculations.ts:272`) devolve
`10 + ½nível + atributo de conjuração`.

**Proposta**
1. `Buff.resistance?: string` e `Buff.dc?: number`.
2. `CastActionSheet` propaga: `resistance` da magia de origem, `dc` de
   `calcSpellResistance(character)`. Isso vale tanto para o buff local quanto para o aplicado no
   grupo via `apiApplyBuffToParty` — quem recebe o buff é justamente quem precisa do número.
3. `BuffsDrawer` mostra a linha `Vontade · CD 18` junto de `source`/`description`, no mesmo
   bloco de metadados que já existe.

**Ressalva importante:** o app **não tem motor de rolagem de dados** — nenhum `rollDice`/`d20` no
código. O escopo aqui é *exibir* o tipo de teste e a CD na ficha de quem recebeu o buff; a rolagem
segue no dado físico. Um botão "rolar" seria um projeto separado.

**Esforço / risco** — M, porque toca o caminho de buff em grupo (cliente + rota de party).

---

## 10. RD por tipo

**Pedido**
> RD não tá por tipo, o certo é deixar adicionar como quiser — ACHO QUE BASTA ACRESCENTAR NOS
> ITENS, MAS N TENTEI

**Hoje**
`Character.damageReduction` é um `number` só (`types/character.ts:241`), editado por `Stepper` em
dois lugares (`DefenseBreakdown.tsx:71` e `HpMp.tsx:146`). Não cabe "RD 5 contra fogo" nem duas
RDs simultâneas.

Detalhe histórico que confirma a sua leitura: **o formato antigo era texto livre e suportava
tipo**. `normalizeDamageReduction` (`calculations.ts:397`) existe exatamente para converter o legado,
e o que ela faz é `String(value).match(/-?\d+/)` — pega o primeiro número e **joga o tipo fora**.
`"5 (fogo)"` virou `5`. A capacidade foi perdida numa migração, não é ausência original.

**Proposta**
Sua intuição de "acrescentar nos itens" é o caminho certo, e há um molde pronto no código:
`defense.items` / `DefenseItem` (`{ name, value, penalty }`), com seu `armaduraConfig`
(`entityForms.ts:470`) e sua linha editável no `DefenseBreakdown`.

1. `Character.damageReductions: { name: string; value: number }[]`, espelhando `DefenseItem`.
2. `rdConfig` em `entityForms.ts`, clonado do `armaduraConfig` sem o campo Penalidade.
3. `DefenseBreakdown` — a linha "Redução de Dano" vira lista com `+ RD`, mesmo padrão visual das
   armaduras logo acima.
4. `normalizeDamageReduction` vira migração de leitura em `CharacterContext`:
   - número `> 0` → `[{ name: 'Geral', value: n }]`
   - string legada → extrai número **e** usa o texto entre parênteses como nome, recuperando o
     tipo das fichas antigas em vez de descartá-lo de novo

**Esforço / risco** — M. Sem mudança de servidor (`strict: false`). O risco está na migração de
leitura: precisa ser idempotente, porque roda em todo carregamento de ficha.

---

## 11. Resumo da magia

**Pedido**
> adicionar um "resumo" da magia, pra poder ver melhor na home — TIPO UMA DESCRIÇÃO, PQ TODO O
> CONTEÚDO AS VEZES É DEMAIS, E É LEGAL TER O COMPLETO AO ACESSAR AS MAGIAS, MAS NO RESUMO EU
> ESCREVERIA EM RESUMO O QUE A MAGIA FAZ

**Hoje**
`Spell` só tem `description`, que é o texto integral do livro — várias passam de 800 caracteres,
com parágrafo de Truque no fim. `SpellCard.tsx:48` despeja isso inteiro no card da ficha, então a
lista de magias vira um paredão e some a informação que importa em combate.

**Proposta**
1. `Spell.summary?: string` + campo "Resumo" em `spellFields` (`entityForms.ts:244`), logo acima
   de Descrição, com placeholder do tipo *"1 linha: o que a magia faz na prática"*.
2. `SpellCard` mostra `summary`; sem resumo, cai para a **primeira frase** da descrição em vez do
   texto todo. O texto completo continua no editor/detalhe, como você pediu.
3. Mesma mudança vale para `Ability.description` no `AbilityCard`, que tem o mesmo paredão.

**Esforço / risco** — código S; preencher o `summary` das 201 magias do catálogo é M de conteúdo.
São duas tarefas separadas: **o código entrega valor sozinho** via fallback de primeira frase, e o
preenchimento do catálogo pode vir depois, magia a magia.

---

# P2 · Estrutura e conteúdo

## 12. Poderes por tipo, acordeon e favoritos

**Pedido**
> Separar os poderes por tipo e poder organizar como quiser (talvez até acordeons) o god mesmo
> era talvez criar até um favoritos, parecido com a biblioteca da steam lá — ESSE JÁ TINHA TE FALADO

**Hoje**
`PoderesPanel.tsx` renderiza `character.abilities` numa lista plana, sem agrupamento, ordenação
ou destaque. Achado que muda o plano: **`Ability.type` está morto**.

- não existe campo `type` em `abilityFields` (`entityForms.ts:157-176`) — o jogador não consegue
  preencher
- `powerToFormValues` (`entityForms.ts:227`) tem `power.category` em mãos (`Combate`, `Destino`,
  `Magia`, `Concedido`, `Tormenta`) e joga tudo em `source` como texto via `powerSourceLabel`,
  **nunca em `type`**
- `abilidadeConfig.apply` só preserva `type` do objeto anterior (`base = { type: '' }`)

Ou seja: agrupar por tipo exige antes **popular o campo**, senão todo poder cai em "Outros".

**Proposta** — três camadas, entregáveis em ordem:

**(a) Dar vida ao `type`**
`powerToFormValues` grava `type: power.category`; `abilityFields` ganha um select de Tipo com as
cinco categorias + "Outro". Poderes já cadastrados ficam sem tipo e caem num grupo "Sem tipo" —
editável a qualquer momento.

**(b) Acordeons por grupo**
`PoderesPanel` agrupa por `type` e renderiza cada grupo com `ui/Section` — que **já persiste o
estado aberto/fechado** em `character.collapsedSections` (`Section.tsx:30-42`). Ou seja, o
acordeon que você quer já está construído e testado, é só usar. Bônus: o estado sobrevive ao
reload e é por personagem.

**(c) Favoritos**
`Ability.favorite?: boolean`, estrela no `AbilityCard`, e uma seção **"★ Favoritos" fixa no topo**
mostrando os marcados independente do grupo — a leitura da biblioteca da Steam que você descreveu.
O poder aparece nos dois lugares, como coleção na Steam.

Ordenação manual (arrastar) fica fora de escopo: resolve pouco depois de (a)+(b)+(c) e custa caro.

**Esforço / risco** — M. Maior ganho no uso diário da lista inteira, e o único item que pede
desenho de tela. Fatiável: (a) sozinho já melhora o cadastro, (b) já resolve o paredão.

---

## 13. Itens esotéricos

**Pedido**
> melhorar itens esotéricos — na aba de itens, o esotérico não encaixa em nenhuma das opções, ele
> é basicamente uma arma sem os danos e tal, com um efeito permanente

**Hoje**
`InventoryCategory` tem quatro valores: `'comum' | 'consumivel' | 'acessorio' | 'arma'`
(`types/character.ts`). Um esotérico não cabe em nenhum:

- em `'arma'` ele **desaparece da aba Ações** — `isWeaponAttack` (`calculations.ts:279`) exige
  `damage` preenchido para virar card de ataque, e esotérico não tem dano
- em `'acessorio'` ele perde os campos de combate: `acessorioConfig` (`entityForms.ts:545`) só
  oferece nome / local / efeito

**Proposta**
Quinta categoria `'esoterico'`, montada com o `inventoryConfig()` genérico que já existe
(`entityForms.ts:493`) — a função foi feita exatamente para isso:

```ts
const esotericoConfig = inventoryConfig('esoterico', 'Item esotérico', [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do item esotérico' },
  { key: 'effect', label: 'Efeito', type: 'text' },
]);
```

Ela já traz de brinde `alwaysActive` + `buffs` + `attackModifiers`, que é precisamente o
"efeito permanente" que você descreveu — sem bloco de dano. Falta só a seção nova em
`EquipamentosPanel` (mesmo padrão dos quatro filtros de `category` já existentes) e o item no
menu de adicionar.

**Esforço / risco** — S–M. Nenhuma migração: item legado sem categoria continua caindo em
`'comum'` por `isComum()`.

---

## 14. Melhorias e encantos de item

**Pedido**
> não dá pra botar buff no cetro elemental (léo falou isso, mas acho q ele tá falando do sistema
> de itens que não deve puxar automático as melhorias e encantos)

**Hoje**
Sua leitura do relato do Léo está certa: **dá para botar buff no item** — `inventoryConfig`
(`entityForms.ts:493-509`) oferece `alwaysActive` + `buffs` + `attackModifiers` em toda categoria.
O que não existe é **catálogo de melhorias e encantos**. Cada bônus do Cetro Elemental precisa ser
digitado à mão, campo por campo, e o jogador precisa saber de cor o que cada encanto concede.

Compare com o resto do app, onde todo conteúdo oficial tem picker: `ConditionPicker`,
`PowerPicker`, `SpellPicker`, `OriginPicker`, `RacePicker`, `DeityPicker`. Item é a única entidade
sem catálogo — daí a sensação de "não puxa automático".

**Proposta**
1. `client/src/data/itemEnhancements.ts` — catálogo de melhorias e encantos do T20, cada entrada
   com nome, custo/categoria, descrição e os `BuffEffect[]` / `AttackModifier[]` correspondentes.
   Mesma forma de `OFFICIAL_CONDITIONS` (`data/conditions.ts`), que já resolve o problema
   equivalente: descrição em texto **mais** efeitos numéricos quando são simples, e só descrição
   quando o efeito é procedural.
2. `ItemEnhancementPicker`, clone do `ConditionPicker`, aberto de dentro do editor de item,
   anexando os modificadores prontos ao item — carregado com `lazy()` como já fazem
   `PowerPicker` e `SpellPicker`, para não pesar o bundle.

**Esforço / risco** — L, o maior da lista, e majoritariamente **trabalho de dados**, não de código.
Candidato natural a fatiar: começar só pelas melhorias de arma (que é o caso concreto do Cetro),
deixar encantos e itens mágicos gerais para uma segunda rodada.

---

# Apêndice · Mapa de arquivos por item

| Item | Arquivos |
|---|---|
| 1 | `data/pericias.ts` · `utils/calculations.ts` · `components/sheet/SkillRow/` |
| 2 | `utils/calculations.ts` · `utils/calculations.test.ts` |
| 3 | `components/sheet/AbilityCard/AbilityCard.tsx` · `components/sheet/PoderesPanel/` |
| 4 | `data/constants.ts` · `components/sheet/SheetForm/entityForms.ts` |
| 5 | `components/sheet/{SpellPicker,PowerPicker,ConditionPicker}/` · `utils/formatters.ts` |
| 6 | `data/spells.ts` · `components/sheet/SpellPicker/` |
| 7 | `components/sheet/CastActionSheet/CastActionSheet.tsx` |
| 8 | `types/character.ts` · `utils/calculations.ts` · `components/sheet/FixedBonusesPanel/` |
| 9 | `types/character.ts` · `components/sheet/{CastActionSheet,BuffsDrawer}/` · rota de party |
| 10 | `types/character.ts` · `utils/calculations.ts` · `contexts/CharacterContext.tsx` · `components/sheet/{DefenseBreakdown,SheetForm}/` · `components/character/HpMp/` |
| 11 | `types/character.ts` · `components/sheet/{SpellCard,AbilityCard,SheetForm}/` · `data/spells.ts` |
| 12 | `types/character.ts` · `components/sheet/{PoderesPanel,AbilityCard,SheetForm}/` · `components/ui/Section/` |
| 13 | `types/character.ts` · `components/sheet/SheetForm/entityForms.ts` · `components/sheet/EquipamentosPanel/` |
| 14 | `data/itemEnhancements.ts` (novo) · `components/sheet/SheetForm/entityForms.ts` · picker novo |

Referência-base do levantamento: branch `feature/saas`, commit `8086f9d`, 19/08/2026.
