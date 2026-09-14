# Modificadores de Ataque Compostos (Ataque Poderoso, Smite, etc.)

## Objetivo

Hoje, pra cobrir todas as combinações de bônus/penalidades ativáveis numa rolagem de
ataque (ex.: Ataque Poderoso, Smite, um item como Manopla de Força), o jogador precisa
criar um `Attack` separado pra cada combinação possível — porque `extraBonuses`/
`extraDamage` ficam sempre ativos dentro de um único ataque, sem toggle. A ideia é
deixar Poderes, Magias e Itens declararem modificadores de ataque opcionais, e o
próprio botão "Atacar" abrir um checklist pra escolher quais ativar **naquela rolagem
específica**, com o resultado final (ataque/dano/custo) calculado ao vivo — sem
precisar duplicar ataques nem usar Buffs (que ficam ligados até desligar manualmente)
como gambiarra.

## Escopo

**Dentro do escopo:**
- Novo campo `attackModifiers` anexável em Poder/Habilidade, Magia e Item (qualquer
  categoria — arma, acessório, comum).
- **Os `extraBonuses`/`extraDamage` que já existem hoje dentro de `Attack` também
  passam a ser desligáveis por rolagem** (ver seção 3) — hoje eles são somados sempre,
  sem opção de desligar, e é exatamente esse campo que já é usado como gambiarra pra
  colar "Ataque Poderoso" direto num ataque específico (daí a duplicação de ataques
  ser o maior incômodo hoje). Isso deixa de ser necessário: um único `Attack` pode
  listar todos os bônus possíveis, e o jogador escolhe por rolagem quais valem.
- Tela de composição de ataque (`ComposeAttackSheet`, reaproveitando o padrão visual e
  funcional do `CastActionSheet`: checklist + total recalculado ao vivo) que só aparece
  quando há pelo menos um item pra marcar/desmarcar (ver seção 3).
- Cálculo ao vivo de Ataque/Dano/Custo total conforme o jogador marca/desmarca.
- Registro no histórico (`logs`) de quais modificadores foram usados em cada ataque.

**Fora do escopo (não fazer agora):**
- Não migra automaticamente ataques/Buffs já existentes que usam a gambiarra atual —
  fica a critério do jogador limpar manualmente depois, quando quiser.
- Sem restrição automática por tipo de ataque (corpo a corpo x à distância) — todo
  modificador cadastrado aparece pra qualquer ataque; validar se faz sentido pra aquela
  rolagem é escolha do jogador/mestre, igual pré-requisito de poder já é hoje.
- Sem deduplicação — se dois poderes diferentes declararem um modificador com o mesmo
  nome, aparecem como duas linhas independentes no checklist (a ficha não tem como
  saber se empilham ou não; isso é julgamento de regra, não da ferramenta).
- Sem limite de quantos modificadores podem ser ativados ao mesmo tempo numa rolagem.
- Sem "usos limitados por cena/dia" pros modificadores (ex.: Smite N vezes por dia) —
  só custo em PM, igual todo o resto do sistema hoje.
- Dano de magia (conjurar uma magia ofensiva) continua fora desse fluxo — isso é
  só pro botão "⚔ Atacar" de `Attack`/arma.

## 1. Modelo de dados

```ts
export interface AttackModifier {
  label: string;         // nome mostrado no checklist, ex. "Ataque Poderoso"
  attackRoll?: number;   // bônus/penalidade no teste de ataque, ex. -2
  damageBonus?: number;  // bônus fixo de dano, ex. 5
  damageDice?: string;   // dado extra de dano, ex. "+2d6"
  mpCost?: number;       // custo em PM pra ativar (padrão 0)
}
```

Campo novo, opcional, mesma forma nos três pontos de anexo:

```ts
export interface Ability {
  // ...campos existentes
  attackModifiers?: AttackModifier[];
}

export interface Spell {
  // ...campos existentes
  attackModifiers?: AttackModifier[];
}

export interface InventoryItem {
  // ...campos existentes
  attackModifiers?: AttackModifier[];
}
```

`Attack.extraBonuses: ExtraBonus[]` e `Attack.extraDamage: ExtraDamage[]` continuam
com o mesmo tipo/forma de hoje — **nenhuma mudança de schema, nenhuma migração**. O que
muda é só como a tela de ataque trata cada entrada dessas listas: em vez de somar tudo
sem opção de desligar, cada entrada vira um item marcável no checklist (ver seção 3).
`AttackModifier` é o formato pros modificadores que vêm de **fora** do ataque (Poder,
Magia, Item) — o `Attack` continua sem precisar desse campo novo, já que
`extraBonuses`/`extraDamage` fazem esse papel pra bônus que pertencem ao próprio
ataque.

## 2. Onde cadastrar

No formulário de Poder/Habilidade (`abilidadeConfig`), Magia (`magiaConfig`) e Item —
arma/acessório/comum, em `client/src/components/sheet/SheetForm/entityForms.ts`: nova
seção opcional de lista "Modificador de Ataque", no mesmo padrão visual da lista
"Modificadores de ataque" que já existe hoje dentro do formulário de Ataque. Cada linha:
Nome, Bônus de Ataque, Bônus de Dano, Dado extra, Custo (PM). Lista vazia por padrão —
quem não usa não vê nada de diferente no formulário.

## 3. Fluxo de ataque

`ActionCard` (botão "⚔ Atacar", hoje dispara `rollAttack` na hora, sem tela
intermediária):

1. Ao clicar, monta duas listas de itens marcáveis:
   - **Do próprio ataque** — cada entrada de `extraBonuses`/`extraDamage` desse
     `Attack`, **pré-marcada** (mantém o resultado de hoje pra quem não mexer em nada).
   - **De fora** — todo `AttackModifier` presente em
     `character.abilities[].attackModifiers`, `character.spells[].attackModifiers` e
     `character.inventory[].attackModifiers`, **desmarcado por padrão** (é opcional
     novo, não pode mudar sozinho o resultado de um ataque já existente), cada item
     mostrando a fonte como legenda pequena (ex.: "Ataque Poderoso — Poder", "Smite —
     Poder", "Manopla de Força — Item").
2. Se as duas listas juntas estão vazias (ataque simples, sem nenhum bônus cadastrado
   e sem modificador disponível no personagem) → comportamento atual, sem nenhuma
   mudança: ataca na hora, sem abrir tela nenhuma.
3. Se há pelo menos um item (de qualquer uma das duas listas) → abre
   `ComposeAttackSheet` (mesmo esqueleto visual/funcional do `CastActionSheet`): mostra
   Ataque/Dano/Crítico base (sem nenhum extraBonus/extraDamage somado ainda — isso
   passa a depender do checklist), o checklist combinado das duas listas, e recalcula
   ao vivo conforme marca/desmarca:
   - `Ataque final = ataque base + Σ (attackRoll ou value de extraBonus) dos marcados`
   - `Dano final = dano base + Σ (damageBonus ou value de extraDamage/damageDice) dos marcados`
   - `Custo (PM) = mpCost do ataque + Σ mp/mpCost dos marcados`
4. Botão "⚔ Atacar" confirma: desconta o PM total (igual `rollAttack` já faz hoje),
   registra a rolagem no log (`type: 'attack'`, `details` ganha um novo campo
   `modifiers: string[]` com os nomes de tudo que estava marcado, incluindo os
   `extraBonuses`/`extraDamage` do próprio ataque), toca o som/toast igual hoje, fecha
   a tela.
5. Nada fica "ligado" depois — é uma escolha só daquela rolagem; não salva nenhum
   estado novo no personagem nem nos `extraBonuses`/`extraDamage` do ataque (a lista
   continua a mesma pra próxima vez, só o que fica marcado por padrão muda).

## 4. Compatibilidade

Nenhuma migração de dados necessária — nem `attackModifiers` (campo novo, opcional) nem
`extraBonuses`/`extraDamage` (schema igual ao de hoje) exigem tocar em personagens
existentes. Duas mudanças de comportamento pra quem já tinha `extraBonuses`/
`extraDamage` cadastrados:
- O ataque que antes era instantâneo (soma silenciosa) passa a abrir
  `ComposeAttackSheet` com tudo pré-marcado — um clique a mais pra confirmar, mas o
  resultado numérico não muda enquanto ninguém desmarcar nada.
- Ataques duplicados que já existem pra cobrir combinações continuam existindo e
  funcionando (nada é apagado) — só deixam de ser necessários daqui pra frente; juntar
  tudo num só e apagar os duplicados é faxina manual, feita quando o jogador quiser.

Quem usa Buff como gambiarra pro mesmo problema também não precisa mexer em nada —
continua funcionando; a expectativa é que o uso disso caia naturalmente depois que o
compositor de ataque cobrir o caso de forma mais direta.

## 5. Plano de teste (navegador)

- Num personagem de teste com Paladino (ex.: Akatsu ou equivalente): cadastrar "Ataque
  Poderoso" como modificador num Poder (-2 ataque, +5 dano) e "Smite" como modificador
  em outro Poder (+2d6 dano, custo 2 PM). Cadastrar também um item "Manopla de Força"
  com um modificador próprio.
- Clicar "⚔ Atacar" num ataque corpo a corpo: confirmar que `ComposeAttackSheet` abre
  com os 3 modificadores listados, cada um com a fonte certa.
- Marcar só Ataque Poderoso → conferir Ataque/Dano recalculados ao vivo.
- Marcar Ataque Poderoso + Smite juntos → conferir soma correta e custo em PM somado.
- Confirmar o ataque → checar que o PM foi descontado certo e que o histórico registra
  quais modificadores foram usados.
- Testar um ataque sem nenhum modificador cadastrado no personagem e sem
  `extraBonuses`/`extraDamage` → confirmar que continua instantâneo, sem abrir tela
  nenhuma (comportamento de hoje intacto).
- Pegar um ataque que hoje já tem `extraBonuses`/`extraDamage` cadastrados (ex.: um
  ataque existente do Akatsu com "Ataque Poderoso" colado direto nele) → confirmar que
  ao clicar "⚔ Atacar" abre `ComposeAttackSheet` com essas entradas já marcadas, e que
  confirmar sem mexer em nada dá o mesmo resultado de antes (ataque/dano idênticos ao
  que já existia). Desmarcar uma delas e confirmar que o total recalcula pra baixo.
