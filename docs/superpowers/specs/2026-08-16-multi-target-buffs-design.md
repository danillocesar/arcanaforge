# Sistema de Buffs Multi-Alvo (Magias e Poderes)

## Objetivo

Hoje um buff só afeta um atributo ou perícia, e só pode ser aplicado manualmente na
própria ficha. A ideia é permitir que magias e poderes concedam **um ou mais** efeitos
de buff de uma vez (ex.: Bênção dá +2 de ataque e +2 de dano num único buff), e que ao
conjurar/usar, o jogador escolha **quais personagens do grupo** recebem esse buff —
aplicado automaticamente na ficha deles, já ativo, com aviso em tempo real.

## Escopo

**Dentro do escopo:**
- Magias (base + cada aprimoramento) e Poderes/Habilidades marcados como "conjurável".
- Buff manual (o "+ Buff" que já existe) também passa a suportar múltiplos efeitos.
- Aplicação em outros personagens, restrita a quem compartilha grupo com o conjurador.
- Notificação em tempo real (toast) + atualização ao vivo da lista de buffs de quem recebeu.
- Nova seção "Ações" (Ataques + Magias + Poderes conjuráveis) na aba Atributos.

**Fora do escopo (não fazer agora):**
- Ataques não ganham esse sistema de buff/aprimoramento (só Magias e Poderes).
- Sem duração/contagem de rodadas para buffs — continuam ativos até serem
  desativados/removidos manualmente, igual hoje.
- Sem "revogar à distância" — quem recebeu controla o próprio buff (ativar/desativar/
  remover) como qualquer outro.
- Sem limite de quantidade de alvos selecionáveis — fica a critério do jogador/mestre.
- Poderes não ganham "aprimoramentos" (isso é exclusivo de magia); o buff de poder vive
  só na base do poder.

## 1. Modelo de dados

### Buff (mudança principal)

```ts
export interface BuffEffect {
  type: BuffType;              // attack_roll | extra_damage | fixed_damage | attribute | hp | mp | skill | defense
  attributeId?: AttributeId;   // quando type === 'attribute'
  skillId?: string;            // quando type === 'skill'
  value: string;               // mesmo formato livre de hoje (ex.: "2", "1d6")
}

export interface Buff {
  name: string;
  effects: BuffEffect[];        // ANTES: type/attributeId/skillId/value soltos no buff
  mp: number;                   // custo ao ativar manualmente (buffs de magia/poder usam 0 — o custo já foi pago na conjuração)
  active: boolean;
  source?: string;               // NOVO, opcional — texto de exibição, ex. "Bênção (de Fulano)"
}
```

### Spell / Enhancement / Ability

```ts
export interface Spell {
  // ...campos existentes
  buffTargetScope?: 'self' | 'party'; // 'self' (padrão) = só o conjurador; 'party' = pode escolher outros
  buffs?: BuffEffect[];                // efeitos concedidos pela magia base
  enhancements: Enhancement[];
}

export interface Enhancement {
  description: string;
  mpCost: number;
  buffs?: BuffEffect[];                // NOVO — efeitos concedidos por este aprimoramento
}

export interface Ability {
  // ...campos existentes (kind, name, source, mpCost, description)
  castable?: boolean;                  // NOVO — checkbox "Conjurável"; controla se aparece na aba de Ações
  buffTargetScope?: 'self' | 'party';
  buffs?: BuffEffect[];
}
```

### Compatibilidade com personagens existentes

Buffs salvos hoje têm o formato antigo (`type`/`attributeId`/`skillId`/`value` soltos,
sem `effects`). Como o documento do personagem no MongoDB não tem schema rígido
(`strict:false`), não precisa de migração de banco: ao **carregar** o personagem, uma
função `normalizeBuffs(character)` converte qualquer buff antigo para o formato novo
(`effects: [{ type, attributeId, skillId, value }]`). Na próxima vez que o personagem for
salvo, já grava no formato novo. Aplicado em `loadCharacter` (CharacterContext).

## 2. Onde configurar buffs

### Buff manual ("+ Buff")

O formulário atual (`entityForms.ts` → `buffConfig`) tem hoje um único conjunto de
campos tipo/atributo-ou-perícia/valor. Passa a ter:
- Nome (como já é)
- Custo em PM (como já é)
- Uma **lista de efeitos** (tipo + atributo-ou-perícia condicional + valor), com botão
  "+ Efeito" — mesmo padrão visual já usado em "Aprimoramentos" de magia.

### Magia

No formulário de Magia:
- Novo seletor **"Alvo do buff"**: "Só eu" / "Posso escolher outros" (`buffTargetScope`).
- Nova lista de efeitos na base da magia.
- Dentro de cada item da lista de "Aprimoramentos", uma lista de efeitos aninhada
  (aprimoramento também pode conceder buff).

Isso exige estender o motor genérico de formulários (`SheetForm.tsx`) para suportar uma
lista **dentro** de uma lista (hoje `renderListField` só aceita campos escalares como
sub-campos de uma linha). É o ponto tecnicamente mais delicado do trabalho, mas
contido: tornar `renderListField` recursivo quando encontrar um sub-campo do tipo
`'list'`.

### Poder / Habilidade

No formulário (já unificado, `abilidadeConfig`):
- Checkbox **"Conjurável"** (`castable`).
- Se marcado: aparece o mesmo seletor "Alvo do buff" + lista de efeitos (sem
  aprimoramentos, já que poder não tem esse conceito).

## 3. Aba de Ações combinada

Hoje a aba "Atributos" mostra Atributos, Buffs & Condições e uma seção "Ataques"
(`AcoesPanel`). Passa a mostrar, abaixo de Ataques, mais duas seções:

- **Magias**: lista todas as magias (reaproveita `SpellCard`, com o botão "✦ Lançar"
  que já existe).
- **Poderes**: lista só os poderes/habilidades com `castable: true` (reaproveita
  `AbilityCard`, que ganha um botão "▶ Usar" — hoje o card só abre edição ao clicar).
  O botão "Usar" só aparece se o poder custa PM e/ou concede buff; um poder puramente
  descritivo marcado como conjurável mas sem custo/efeito não precisa de botão.

As abas "Magias" e "Poderes" continuam existindo como estão hoje (gestão completa:
criar, editar, remover) — a aba "Atributos" ganha só um atalho de uso rápido para
combate, sem precisar trocar de aba no meio da cena.

## 4. Fluxo de conjuração/uso

O componente `CastSpellSheet` (já existe, criado nesta sessão) vira a base para um
componente compartilhado entre Magia e Poder (`CastActionSheet` ou similar), cobrindo:

1. Custo base + checkboxes de aprimoramento (só magia) → calcula PM total, igual hoje.
2. Calcula `efeitos = buffs da magia/poder base + buffs de cada aprimoramento marcado`.
3. Se `efeitos` estiver vazio → fluxo atual, sem mudança (desconta PM, loga, toca som,
   fecha).
4. Se `efeitos` não estiver vazio:
   - Se `buffTargetScope !== 'party'` (ou não há ninguém mais no grupo) → aplica o
     buff automaticamente só no próprio conjurador (já ativo), sem etapa extra.
   - Se `buffTargetScope === 'party'` → mostra uma lista de seleção com todos os
     personagens dos grupos aos quais o personagem atual pertence (nome + avatar),
     **o próprio conjurador vem pré-marcado**, os demais desmarcados. Jogador confirma
     quem recebe.
5. Ao confirmar: desconta PM do conjurador (como hoje), grava o log (como hoje), e
   monta um `Buff` com `name: <nome da magia/poder>`, `effects: efeitos`, `mp: 0`,
   `active: true`, `source: "de <nome do conjurador>"`.
   - Para o próprio conjurador (se selecionado): adiciona direto no estado local (via
     `updateCharacter`), sem chamada de API.
   - Para os demais alvos selecionados: chamada ao novo endpoint (seção 5).

### Fonte dos alvos possíveis

Um personagem pode pertencer a um ou mais grupos (raro, mas o modelo permite). A lista
de alvos é a união de todos os personagens de todos os grupos aos quais o personagem
atual pertence (já existe endpoint `GET /api/parties/:id/characters`, member-only, que
lista nome/avatar/PV/PM de todos os personagens de um grupo — dá pra reaproveitar
direto). Se o personagem não pertence a nenhum grupo, a opção "Posso escolher outros"
não tem efeito prático (não há ninguém para selecionar) — a magia/poder aplica só no
próprio conjurador mesmo com o `buffTargetScope` marcado como `'party'`.

## 5. Aplicação em outro personagem (servidor)

Hoje `POST /api/characters/:id` (salvar ficha) só aceita escrita do **dono**. Não dá
pra reaproveitar para isso. Novo endpoint, encaixado nas rotas de grupo (que já fazem
a checagem "sou membro deste grupo"):

```
POST /api/parties/:partyId/apply-buff
body: { targetCharacterIds: string[], buff: { name, effects, source } }
```

- Verifica que quem chama é **membro** do grupo `:partyId` (reaproveita
  `partyRepository.findMemberPartyLean`, já usado por `listPartyCharacters`).
- Filtra `targetCharacterIds` para conter só ids que realmente pertencem a algum
  membro desse grupo (ignora qualquer id fora disso — proteção server-side, não confia
  só no cliente).
- Para cada alvo válido: `$push` do buff (com `mp: 0, active: true` fixados pelo
  servidor, não pelo cliente) no array `buffs` do documento do personagem no MongoDB.
  Escrita direta e cirúrgica — não mexe em mais nenhum campo da ficha alheia.
- Depois de gravar, notifica os clientes conectados daquele grupo via WebSocket (ver
  seção 6), para quem estiver com a ficha aberta ver o buff aparecer na hora.
- Responde `{ ok: true }`.

Se o personagem do conjurador pertencer a mais de um grupo e os alvos selecionados
vierem de grupos diferentes, o cliente agrupa os alvos por grupo e faz uma chamada por
grupo (caso raro, mas o modelo permite).

## 6. Notificação em tempo real

Reaproveita o WebSocket que já existe (hoje usado para sincronizar PV/PM e avisar
conjuração de magia entre abas/grupo). Novo tipo de mensagem:

```
{ type: 'buff_applied', characterId, buff, casterName, spellName }
```

- Servidor: nova função `refs.broadcastBuffApplied(partyId, payload)` (mesmo padrão de
  `broadcastPartyRoster`), chamada pelo `party.service.js` depois do `$push` no banco.
  Envia para todo client conectado que seja membro daquele grupo.
- Cliente (`CharacterContext.tsx`): se `msg.characterId === character._id`, aplica o
  buff no estado local (`setCharacter`) — isso garante que o próximo autosave do
  destinatário não sobrescreva o buff que acabou de chegar — e mostra toast: "Fulano
  aplicou Bênção em você!".
- Se o destinatário não estiver com o app aberto no momento, a escrita já é durável no
  banco (feita no passo 4); na próxima vez que abrir a ficha, o buff já estará lá — só
  não recebe o toast em tempo real, o que é esperado.

## 7. Exibição do buff recebido

`ConditionChip` (o chip que já existe na lista de Buffs & Condições) passa a mostrar,
quando presente, o `source` como texto secundário pequeno (ex.: "de Fulano"), sem mudar
o comportamento de ativar/desativar/remover — quem recebeu controla o buff normalmente,
como qualquer outro.

## 8. Plano de teste (navegador)

- Criar uma magia "Bênção" com `buffTargetScope: party`, efeito base +2 ataque, um
  aprimoramento com efeito +2 dano.
- Conjurar em um personagem de teste que pertence a um grupo com pelo menos mais um
  personagem; selecionar o próprio + outro personagem.
- Confirmar: PM descontado só do conjurador; buff aparece ativo na lista de buffs de
  ambos com o texto de origem certo; histórico mostra a conjuração.
- Abrir a ficha do personagem-alvo em outra aba/sessão e confirmar o toast + buff
  aparecendo ao vivo sem reload.
- Repetir o mesmo teste com um Poder marcado como conjurável.
- Testar personagem antigo com buff no formato legado (sem `effects`) — confirmar que
  carrega e aplica corretamente (normalização automática).
