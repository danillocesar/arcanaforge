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
- Tela de composição de ataque (`ComposeAttackSheet`, reaproveitando o padrão visual e
  funcional do `CastActionSheet`: checklist + total recalculado ao vivo) que só aparece
  quando há pelo menos um modificador disponível no personagem.
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

`Attack.extraBonuses`/`extraDamage` continuam existindo sem nenhuma mudança — isso
representa bônus intrínsecos daquele ataque específico (ex.: espada +1), sempre
somados, independente de qualquer toggle. O `AttackModifier` é um conceito
complementar: a opção que aparece pra ligar/desligar por rolagem.

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

1. Ao clicar, monta a lista de modificadores disponíveis = todo `AttackModifier`
   presente em `character.abilities[].attackModifiers`, `character.spells[].attackModifiers`
   e `character.inventory[].attackModifiers` — achatados numa lista única, cada item
   guardando de qual poder/magia/item veio (pra mostrar como legenda pequena no
   checklist, ex.: "Ataque Poderoso — Poder", "Smite — Poder", "Manopla de Força — Item").
2. Se essa lista está vazia → comportamento atual, sem nenhuma mudança (ataca na hora,
   como hoje).
3. Se não está vazia → abre `ComposeAttackSheet` (mesmo esqueleto visual/funcional do
   `CastActionSheet`): mostra Ataque/Dano/Crítico base (já incluindo os
   `extraBonuses`/`extraDamage` fixos do ataque), um checklist com cada modificador
   disponível, e recalcula ao vivo conforme marca/desmarca:
   - `Ataque final = ataque base + Σ attackRoll dos marcados`
   - `Dano final = dano base + Σ damageBonus + concatenação de damageDice dos marcados`
   - `Custo (PM) = mpCost do ataque + Σ mpCost dos marcados`
4. Botão "⚔ Atacar" confirma: desconta o PM total (igual `rollAttack` já faz hoje),
   registra a rolagem no log (`type: 'attack'`, `details` ganha um novo campo
   `modifiers: string[]` com os nomes dos modificadores usados), toca o som/toast igual
   hoje, fecha a tela.
5. Nada fica "ligado" depois — é uma escolha só daquela rolagem; não salva nenhum
   estado novo no personagem.

## 4. Compatibilidade

Nenhuma migração necessária — `attackModifiers` é um campo novo e opcional; quem não
cadastrar nada continua exatamente como está hoje (ataque instantâneo, sem tela extra).
Ataques que hoje usam `extraBonuses` fixo ou Buffs como gambiarra continuam funcionando
sem mudança nenhuma; trocar pra usar o modificador de verdade é escolha manual do
jogador, feita quando ele quiser.

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
- Testar um ataque sem nenhum modificador cadastrado no personagem → confirmar que
  continua instantâneo, sem abrir tela nenhuma (comportamento de hoje intacto).
