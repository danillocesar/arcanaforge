# Bônus Fixos (Poderes/Itens sempre ativos)

## Objetivo

Alguns Poderes/Habilidades e Itens de um personagem concedem um bônus que nunca é
desligado (ex.: um poder passivo, um item permanentemente equipado) — hoje, a única
forma de refletir isso na ficha é "lançar" o efeito uma vez via um Poder conjurável e
deixar o buff resultante sempre ligado em `character.buffs[]`, misturado com os buffs
que o jogador realmente ativa/desativa durante o jogo. Isso deixa a lista de "Buffs &
Condições" poluída com entradas que nunca mudam. A ideia é permitir marcar o próprio
Poder/Habilidade ou Item como "sempre ativo", aplicando seu bônus automaticamente sem
precisar de uma entrada em `character.buffs[]`, e mostrando esses bônus fixos numa
seção própria, separada da lista de buffs desligáveis.

## Escopo

**Dentro do escopo:**
- Campo `alwaysActive` (opcional) em Poder/Habilidade e em Item (qualquer categoria —
  arma, acessório, comum, consumível).
- Campo `buffs` (mesmo formato `BuffEffect[]` já usado em Poder/Magia) passa a existir
  também em Item, só usado quando `alwaysActive` estiver marcado.
- Uma função central (`getActiveBuffs`) que soma os buffs manualmente ligados com os
  buffs sintéticos vindos de fontes fixas, usada por todo cálculo que hoje lê
  `character.buffs` diretamente (atributo, perícia, defesa, ataque, dano, custo em PM).
- Nova seção "Bônus Fixos" na aba Atributos, abaixo da linha Atributos+Buffs, listando
  cada Poder/Item fixo com nome + resumo do que ele afeta — sem toggle, já que nunca
  desliga.

**Fora do escopo (não fazer agora):**
- Magias não ganham esse campo agora — só Poder/Habilidade e Item, por pedido
  explícito do usuário.
- Sem migração automática de buffs já existentes: um Poder que hoje já está "lançado e
  sempre ligado" como gambiarra continua funcionando exatamente como está; se o
  jogador quiser trocar pra usar o novo mecanismo, precisa marcar o Poder como fixo E
  desativar/remover manualmente o buff antigo da lista de Buffs & Condições — caso
  contrário o bônus soma em dobro (um vindo do buff manual, outro do novo mecanismo).
  A ficha não detecta nem avisa sobre essa duplicação — é responsabilidade do jogador.
- Sem exigir que o Item esteja "equipado" (`character.equipped`) pra que seu bônus
  fixo valha — mesmo comportamento que os `attackModifiers` de Item já têm hoje (valem
  independente de equipar, já que a lista de equipados é só um registro visual solto,
  não amarrado aos itens do inventário).
- Um Poder/Item pode ser simultaneamente conjurável (`castable`) e fixo
  (`alwaysActive`) sem nenhuma validação cruzada — combinação improvável na prática,
  mas não é bloqueada.

## 1. Modelo de dados

```ts
export interface Ability {
  // ...campos existentes
  alwaysActive?: boolean;
}

export interface InventoryItem {
  // ...campos existentes
  alwaysActive?: boolean;
  buffs?: BuffEffect[];
}
```

`BuffEffect` continua exatamente como já existe hoje (`{ type, attributeId?, skillId?,
value }`) — nenhuma mudança de schema nele.

## 2. Onde cadastrar

**Poder/Habilidade** (`abilidadeConfig` em `entityForms.ts`): novo campo select "Sempre
ativo" (Sim/Não), no mesmo padrão visual do campo "Conjurável" já existente. A lista
"Efeitos de Buff" (que hoje só aparece quando `castable === 'true'`) passa a aparecer
quando `castable === 'true'` **ou** `alwaysActive === 'true'`. O campo "Alvo do buff"
(`buffTargetScope`) continua só pra conjurável — bônus fixo é sempre só pro próprio
personagem, não faz sentido escolher alvo.

**Item** (`armaConfig` e a fábrica `inventoryConfig` — cobre Arma, Acessório, Comum e
Consumível): mesmo campo select "Sempre ativo", e uma lista "Efeitos de Buff" nova
(reaproveitando os mesmos `BUFF_EFFECT_ITEM_FIELDS`/`effectsFromValues`/`effectsToForm`
já usados em Poder/Magia), aparecendo só quando `alwaysActive === 'true'` — Item não
tem conceito de "conjurável", então o campo de efeitos só faz sentido junto do fixo.

## 3. Cálculo

Nova função em `calculations.ts`:

```ts
function synthesizeAlwaysActiveBuffs(character: Character): Buff[] {
  const fromAbilities = (character.abilities ?? [])
    .filter((a) => a.alwaysActive && (a.buffs?.length ?? 0) > 0)
    .map((a) => ({ name: a.name, effects: a.buffs!, mp: 0, active: true, source: 'Poder' }));
  const fromItems = (character.inventory ?? [])
    .filter((it) => it.alwaysActive && (it.buffs?.length ?? 0) > 0)
    .map((it) => ({ name: it.name, effects: it.buffs!, mp: 0, active: true, source: 'Item' }));
  return [...fromAbilities, ...fromItems];
}

export function getActiveBuffs(character: Character): Buff[] {
  return [...(character.buffs ?? []).filter((b) => b.active), ...synthesizeAlwaysActiveBuffs(character)];
}
```

Todo lugar que hoje faz `character.buffs.forEach((b) => { if (!b.active) return; ... })`
passa a fazer `getActiveBuffs(character).forEach((b) => { ... })` (sem o `if
(!b.active) return`, já que `getActiveBuffs` só devolve entradas já ativas). Pontos a
trocar:
- `getEffectiveAttribute` (atributo efetivo)
- `calcTotalSkill` (perícia)
- `calcTotalDefense` (defesa total)
- `getDefenseBreakdown` (detalhamento da defesa)
- `calcAttackRoll` / `calcDamageBonus` / `buildDamageSummary` / `calcTotalMp` (card de
  ataque em repouso, em `calculations.ts`)
- o laço de buffs dentro de `composeAttack` (`attackCompose.ts`)

Nenhuma dessas funções muda de assinatura nem de comportamento pro caso sem buffs
fixos — é troca mecânica da fonte de dados iterada, não mudança de lógica.

## 4. Exibição

Novo componente (`FixedBonusesPanel` ou nome equivalente), renderizado logo abaixo da
linha Atributos+Buffs (`atributosRow`) e antes de `AcoesPanel`, full-width. Uma linha
por Poder/Item com `alwaysActive` marcado (mesmo estilo visual da linha de
`ConditionChip`: nome + etiqueta do que o efeito afeta, ex. "Aura Ancestral — For +2"),
mas sem `onClick`/toggle — é só leitura, já que nunca desliga. A seção inteira some da
tela se não houver nenhuma fonte fixa (mesmo padrão do `BuffsPanel` atual, que também
não mostra nada quando a lista está vazia).

A lógica que resume os efeitos de um buff numa etiqueta curta (`summarizeEffects`/
`effectTag`/`formatEffectValue`, hoje só dentro de `ConditionChip.tsx`) precisa ser
extraída pra um módulo compartilhado (ex. `utils/buffEffects.ts`) — tanto
`ConditionChip` quanto o novo painel de bônus fixos usam exatamente a mesma lógica de
resumo, só a fonte dos dados (buff manual vs. Poder/Item fixo) é diferente.

## 5. Compatibilidade

Campos novos e opcionais — nenhuma migração de dados necessária, personagens
existentes continuam funcionando sem alteração. Ver nota de duplicação de bônus na
seção Escopo acima.

## 6. Plano de teste (navegador)

- Marcar um Poder existente (ex. um poder qualquer sem `castable`) como "Sempre
  ativo", adicionar um efeito de Atributo/Perícia/Dano — confirmar que aparece na nova
  seção "Bônus Fixos" (não na lista de Buffs & Condições) e que o atributo/perícia/dano
  correspondente já reflete o bônus imediatamente, sem precisar "ligar" nada.
- Repetir o mesmo teste marcando um Item (ex. um Acessório) como "Sempre ativo".
- Confirmar que desmarcar "Sempre ativo" remove o bônus do cálculo e a linha some da
  seção "Bônus Fixos".
- Confirmar que um Poder com `castable=true` e `alwaysActive=true` ao mesmo tempo não
  quebra nada (aparece tanto no botão de conjurar quanto na seção de bônus fixos,
  ambos funcionando independentemente).
- Confirmar que a lista de Buffs & Condições (toggleável) continua funcionando
  exatamente como antes, sem nenhuma fonte fixa aparecendo lá.
