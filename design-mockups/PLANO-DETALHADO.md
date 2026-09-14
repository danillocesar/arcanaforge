# Plano Detalhado — Implementação da Nova Ficha Tormenta 20 no Arcana Forge

> **Mockup canônico:** `design-mockups/ficha-tormenta.html` (hub: Ficha ver/editar + Criar, celular + iPad/desktop).
> **Supersede** o `PLANO-IMPLEMENTACAO.md` (versão alto-nível anterior).
> **Estratégia:** 3 camadas em ordem — (A) Design system, (B) Componentes de domínio, (C) Telas. Reutilizar todo o estado/persistência atuais. Modelo de dados quase intacto (poucas extensões).

---

## 0. Princípios e o que NÃO muda

| Reutilizado 100% | Arquivo |
|---|---|
| Estado + mutations (`updateCharacter((prev)=>next)`, `readOnly`, `saveStatus`) | `contexts/CharacterContext.tsx` |
| Autosave 800ms + WebSocket (sync HP/MP/cast) | `hooks/useAutoSave.ts` |
| API REST (load/save/delete/avatar) | `api/characters.ts`, `api/http.ts` |
| Factory de novo personagem | `utils/calculations.ts → createEmptyCharacter()` |
| Cálculos efetivos (atributos/defesa com buffs) | `utils/calculations.ts` |
| Lógica de edição inline (já existe em 18 componentes) | `components/character/*` |

**Decisões estruturais:**
1. **Unificar** `ViewCharacterPage` (readOnly) + `TormentaSheetPage` (editável) num **shell único** parametrizado por `readOnly` + toggle "Editar". Elimina layouts duplicados (PLAY_ZONES vs SectionNav).
2. **Desenvolver atrás de flag/rota paralela** (`?v=2` ou rota nova) para não quebrar o atual; cutover só após paridade.
3. **Apresentação primeiro**: o modelo de dados muda pouco (ver §6). Mutations continuam via `updateCharacter` → autosave automático.

---

## FASE A — Design System (tokens + primitivos)
*Objetivo: a base visual e os componentes internos, ANTES das telas.*

### A1. Tokens (`styles/tokens.css`) + fontes (`index.html`)
- Reescrever a paleta para **C dark** (do mockup):
  ```
  --bg:#0c0d11; --surface:#16181e; --surface-2:#1e2027;
  --line:#23262e; --line-2:#2c2f38;
  --accent:#10b981; --accent-ink:#4ade80; --accent-soft:rgba(16,185,129,.13);
  --danger:#fb5570; --danger-soft:rgba(251,85,112,.13);
  --warn:#f0a830; --warn-soft:rgba(240,168,48,.13);
  --text:#e9eaed; --text-2:#9ba1ad; --text-3:#6b707c;
  --radius/-sm/-lg; sombras; --font-display; --font-ui;
  ```
- **Compatibilidade:** os componentes atuais referenciam `--accent-gold`, `--bg-card`, etc. Estratégia segura: **manter os nomes antigos como alias** apontando para os novos valores (ex.: `--accent-gold: var(--accent)`), migrando os usos gradualmente. Isso re-tematiza o app inteiro (inclusive Naruto) de forma consistente — validar o Naruto depois.
- **Fontes:** adicionar Bricolage Grotesque (display) + Plus Jakarta Sans (UI) via `<link>` no `index.html`; expor `--font-display` / `--font-ui`.
- **Decisão em aberto:** tokens globais (recomendado) vs escopados numa classe `.sheet-v2`.

### A2. Primitivos de UI (`components/ui/`)
Criar/refatorar (reaproveitar `Button`, `NumericInput`, `Modal`, `Drawer`, `Toast`, `Badge` existentes):

| Primitivo | Papel | Props-chave |
|---|---|---|
| `TextField` (underline) | input só com linha de baixo | `label, value, onChange, placeholder` |
| `Select` (underline) | select com chevron | `label, options, value, onChange` |
| `Textarea` | idem underline | `label, value, onChange` |
| `NumberField` | numérico underline | `value, onChange, min/max` |
| `Switch` | toggle on/off | `checked, onChange` |
| `SegmentedControl` | seletor (ex.: círculo, tipo) | `options, value, onChange` |
| `Chip` | condição/buff ativo/inativo + categoria | `active, variant('buff'|'warn'|'danger'), onToggle, onEdit, onRemove` |
| `Stepper` | −/+ valor | `value, onChange, step` |
| `Popover` | flutuante (PV/PM/Defesa no header) | `anchor, children` |
| `Sheet` | **bottom-sheet (mobile) / modal central (desktop)** responsivo | `open, title, onClose, footer` |
| `FabSpeedDial` | FAB "+" com menu pra cima | `actions[]` |
| `Card`, `SectionHeader`, `Gauge` | estrutura/leitura | — |

> O `Sheet` é a peça central de formulários — um componente que renderiza bottom-sheet no mobile e modal no desktop (decidido por breakpoint), reaproveitando o padrão do mockup.

**Saída da Fase A:** Storybook/página de catálogo opcional renderizando os primitivos no tema novo.

---

## FASE B — Componentes de domínio da ficha (`components/sheet/`)
*Cada um lê do `CharacterContext` e escreve via `updateCharacter`; `readOnly`/`editMode` controla as affordances.*

| Componente | Reaproveita lógica de | Observações |
|---|---|---|
| `VitalBar` | `HpMp`, `BasicInfo`, `AttributesDefense` | header fixo: avatar, nome, classes, nível, divindade + PV/PM/Defesa **clicáveis** (Popover: PV/PM com Stepper de ajuste; Defesa com detalhamento read-only). Botão "Editar" e menu "⋯". |
| `TabNav` | (novo) | bottom tabs no mobile; **sidebar master-detail** no iPad/desktop. 5 seções: Atributos, Perícias, Poderes, Magias, Equipamentos. |
| `AttributesPanel` / `AttributeBadge` | `AttributesDefense` | valor = modificador; em edição vira Stepper/input. |
| `SkillsPanel` / `SkillRow` | `SkillsList` | toggle treinada; valor afetado por buffs; busca. |
| `PoderesPanel` / `AbilityCard` | `AbilitiesList` | Poder e Habilidade na **mesma lista** com **etiqueta** (campo `type`). |
| `MagiasPanel` / `SpellCard` | `SpellsList`, `SpellCard` | botão "Lançar" gasta PM; aprimoramentos. |
| `EquipamentosPanel` | `AttacksList`/`AttackCard`, `Inventory`, `Proficiencies` | 3 sub-seções: **Equipamentos** (armas c/ "Rolar" + armaduras + acessórios), **Comuns**, **Consumíveis**. Sem ícones por item. **Sem "Carga"**. |
| `BuffsPanel` / `ConditionChip` | `BuffsList` | chips toggle on/off com estado claro (ativo=preenchido+ponto aceso). |
| `ActionCard` | `CombatCard`, `DamagePopover` | rolagem de ataque/dano (reuso direto). |
| `DefenseBreakdown` | `AttributesDefense` | popover de detalhamento da Defesa. |

---

## FASE C — Motor de buffs (cálculo automático)
*Em grande parte JÁ existe; centralizar e estender.*
- Hoje `Buff.type ∈ {attack_roll, extra_damage, fixed_damage, attribute, hp, mp, skill}` com `attributeId?/skillId?/value/mp/active`. `AttributesDefense` já computa efetivo com buffs.
- **Delta:** adicionar **`defense`** ao union de `Buff.type` (o mockup permite buff de Defesa). 
- Centralizar selectors em `utils/calculations.ts`: `effectiveAttributes(char)`, `effectiveSkill(char, id)`, `effectiveDefense(char)` somando buffs ativos. Ligar/desligar buff: alterna `active` e ajusta `mp.current` (gasta/devolve) via `updateCharacter`. Reaproveitar o que `BuffsList` já faz.

---

## FASE D — Shell de tela (Ver + Editar)
- **`CharacterSheetPage`** (novo; substitui Ver+Editar): monta `VitalBar` + `TabNav` + painel da seção ativa. 
- `readOnly` derivado de propriedade/contexto; **`editMode`** = estado de UI do dono (toggle "Editar"/"Concluir") que habilita inputs/steppers/remover/editar-no-clique. **PV/PM atual e toggles de buff ficam sempre disponíveis** (ação de jogo, fora do editMode).
- **Responsivo:** mobile = bottom tabs (uma seção por vez); iPad/desktop = sidebar + detalhe.
- **Rota:** montar atrás de flag (`/tormenta/char?id=&v=2`) para comparar com o atual sem risco.

---

## FASE E — Formulários (Sheet) + FAB + editar-no-clique
- **`SheetForm`** dirigido por *descriptor* por entidade — um componente que renderiza os campos e, no submit, chama `updateCharacter` para **adicionar OU atualizar** (por id/índice) a entrada. Campos com os primitivos underline.
- **`FabSpeedDial`** → abre o form certo em modo criação: **Magia · Poder · Habilidade · Buff · Item**.
- **Editar-no-clique:** em `editMode`, clicar num card abre o `SheetForm` **pré-preenchido** (modo edição) → atualiza a entrada. Botão "×" remove.
- **Descriptors / mapeamento para o modelo:**
  | Form | Entrada no Character | Campos |
  |---|---|---|
  | Poder / Habilidade | `abilities[]` (`Ability`) | name, source(fonte), **type=`'Poder'|'Habilidade'`**, mpCost?, description |
  | Magia | `spells[]` (`Spell`) | name, school, **spellLevel(círculo)**, castingTime(execução), range, area, duration, resistance, mpCost, description, enhancements[] |
  | Buff | `buffs[]` (`Buff`) | name, type(`attribute|skill|defense`), attributeId/skillId, value, mp |
  | Item → **Arma** | `attacks[]` (`Attack`) | name, damage, critical(margem/mult), rangeType, attribute, type, tipoDano |
  | Item → **Armadura** | `defense.items[]` (`DefenseItem`) | name, value(bônus), penalty |
  | Item → **Acessório** | `inventory[]` (`InventoryItem`) | category:`'acessorio'`, name, slot(local), effect |
  | Item → **Comum** | `inventory[]` | category:`'comum'`, name, quantity |
  | Item → **Consumível** | `inventory[]` | category:`'consumivel'`, name, quantity, effect |
- Campos de Arma/Armadura seguem as tabelas do **Livro Básico T20** (Tabela 3-3 Armas / 3-5 Armaduras).

---

## FASE F — Wizard de criação
- **Rota nova** `/tormenta/new` → **`CreateCharacterWizard`**. 6 etapas: Identidade (multi-classe), Atributos (livres), Perícias, Poderes, Magias, Equipamentos.
- **Desktop:** stepper vertical à esquerda + formulário largo (2 colunas). **Mobile:** etapas + Voltar/Próximo.
- Reaproveita os mesmos `SheetForm` (adicionar poder/magia/item/buff dentro das etapas). Constrói o `Character` sobre `createEmptyCharacter()`, depois `apiSaveCharacter` + navega para a ficha.
- Substituir o modal simples de nome em `SelectPage` por "Criar com assistente".

---

## FASE G — Detalhes & persistência
- **Autosave/WebSocket**: mutações são de apresentação → manter intactos; posicionar indicador `saveStatus` no header.
- **Identidade estendida** (origem, tendência, tamanho, deslocamento, idade, XP) + **Notas/Logs/Progressão**: no menu "⋯" / `IdentitySheet` (reuso de `NotesDrawer`, `LogsDrawer`, `ProgressionDrawer`).
- Remover "Carga".

## FASE H — Cutover & limpeza
- Tornar o shell novo padrão em `/tormenta/char` e na visão de party; aposentar `TormentaSheetPage`/`ViewCharacterPage`/`SectionNav`/PLAY_ZONES após paridade.
- Naruto: inalterado (componentes próprios) ou portado depois.

---

## 6. Modelo de dados — deltas exatos (`types/character.ts`)
1. `InventoryItem` += `category?: 'comum' | 'consumivel' | 'acessorio'`, `effect?: string`, `slot?: string`. (Migração: itens existentes → `'comum'`.)
2. `Ability` += `type` passa a carregar a etiqueta `'Poder' | 'Habilidade'` (ou novo campo `kind`).
3. `Buff.type` += `'defense'`.
4. `Spell.spellLevel` reaproveitado como "círculo".
> Tudo o mais (atributos, hp/mp, defense.items, attacks, spells, abilities, buffs, coins) já existe.

## 7. Decisões em aberto (não bloqueiam o início)
- Tokens **globais** (recomendado, com alias dos nomes antigos) vs escopados.
- Arma→`attacks[]` e Armadura→`defense.items[]` (**reuso**, recomendado) vs `inventory` unificado.
- Onde mora Identidade estendida / Notas / Logs.

## 8. Ordem de execução & dependências
```
A (tokens+primitivos) ─▶ B (domínio) ─▶ D (shell ver/editar) ─▶ E (forms+FAB+edit) ─▶ G (detalhes) ─▶ H (cutover)
                          C (motor buffs) ───────────────────────────┘
                                                         F (wizard) depende de A,E
```
- **A e C** podem começar em paralelo. **B** depende de A. **D** depende de B. **E** depende de D+forms. **F** depende de A+E. Cada fase é mergeável isoladamente atrás da flag.

## 9. Mapa rápido: mockup → projeto
| Bloco do mockup | Vira | Reusa |
|---|---|---|
| VitalBar + popovers PV/PM/Defesa | `VitalBar` | `HpMp`, `AttributesDefense` |
| Tab bar / sidebar | `TabNav` | (novo) |
| Emblemas de atributo | `AttributesPanel` | `AttributesDefense` |
| Lista de perícias | `SkillsPanel` | `SkillsList` |
| Cards de poder/habilidade | `PoderesPanel` | `AbilitiesList` |
| Cards de magia + lançar | `MagiasPanel` | `SpellsList`,`SpellCard` |
| Armas (rolar) + inventário | `EquipamentosPanel` | `AttacksList`,`Inventory` |
| Chips de buff/condição | `BuffsPanel` | `BuffsList` |
| FAB + bottom-sheet/modal | `FabSpeedDial` + `Sheet`/`SheetForm` | `Modal`,`Drawer` |
| Wizard 6 etapas | `CreateCharacterWizard` | `createEmptyCharacter` |
```
```
