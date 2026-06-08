# Plano de Implementação — Redesign Ficha Tormenta 20

> Direção visual aprovada: **C Dark** (`dir-c-dark.html`). Fluxos de criação/edição: `edicao-criacao.html`.
> Princípio: **mudança de apresentação**, reaproveitando estado, autosave, WebSocket e a lógica de edição já existentes.

## 0. Premissas confirmadas (arquitetura atual)

| Peça | Onde | Reuso |
|---|---|---|
| Estado + mutations | `contexts/CharacterContext.tsx` — `updateCharacter((prev)=>next)`, `readOnly`, `saveStatus` | **100% reusado** |
| Autosave | `hooks/useAutoSave.ts` (debounce 800ms) + WebSocket | **100% reusado** |
| Persistência | `api/characters.ts` (`apiSaveCharacter/Load/Delete/UploadAvatar`) | **100% reusado** |
| Componentes editáveis | `components/character/*` (18 comps, já editam via `updateCharacter`) | **Lógica reusada, CSS reescrito** |
| Factory de novo personagem | `utils/calculations.ts → createEmptyCharacter()` | Reusado pelo wizard |
| Modelo de dados | `types/character.ts` | **Sem mudança** |
| Tema | `styles/tokens.css` (CSS Modules, dark hardcoded, accent gold) | Atualizar p/ C dark |
| Rotas | `App.tsx` — `?id=` query param; criação = modal em `SelectPage` | Nova rota de wizard |

**Decisão central:** unificar `ViewCharacterPage` (readOnly) e `TormentaSheetPage` (editável) num **único shell** parametrizado por `readOnly`, com toggle "Editar". Elimina a duplicação de layout (PLAY_ZONES vs SectionNav).

---

## 1. Arquitetura de componentes nova

```
components/sheet/
  CharacterShell.tsx        # orquestra: VitalBar + TabNav + painel ativo; responsivo
  VitalBar.tsx              # header fixo: avatar, nome, classes, nível, divindade + PV/PM/Defesa
  TabNav.tsx                # nav inferior (mobile) / segmented|sidebar (tablet+) — 5 abas
  tabs/
    TabAtributos.tsx        # AttributesDefense + HpMp(recursos) + BuffsList + TemporaryEffects
    TabPericias.tsx         # SkillsList (promovido de drawer para aba)
    TabPoderes.tsx          # AbilitiesList
    TabMagias.tsx           # SpellsList/SpellCard + atributo-chave/CD
    TabEquipamentos.tsx     # AttacksList(armas+rolar) + Inventory + Proficiencies + moedas
  IdentitySheet.tsx         # detalhe de identidade (origem, tendência, tamanho, desloc., XP) via tap no header
  HeaderMenu.tsx            # "⋯": Notas, Logs, Progressão (drawers existentes), Editar, Excluir

components/ui/ (novos / estendidos)
  BottomSheet.tsx           # modal slide-up reutilizável (base p/ forms complexos)
  Select.tsx, Switch.tsx, SegmentedControl.tsx, SearchField.tsx
  ActionCard.tsx            # cartão de ataque/magia com botão Rolar/Lançar (usa CombatCard/DamagePopover)
  AttributeBadge.tsx, SkillRow.tsx, ConditionChip.tsx, Gauge.tsx

pages/
  CreateCharacterWizard/    # wizard de criação (nova rota /tormenta/new)
    CreateCharacterWizard.tsx
    WizardProgress.tsx
    steps/ StepIdentidade, StepAtributos, StepPericias, StepPoderes, StepMagias, StepEquipamentos
```

### Mapa abas → componentes (ordem de prioridade do usuário)
1. **Atributos** (home) — `AttributesDefense` + recursos (PV/PM de `HpMp`) + `BuffsList`/condições + `TemporaryEffects`
2. **Perícias** — `SkillsList`
3. **Poderes** — `AbilitiesList`
4. **Magias** — `SpellsList` + `SpellCard`
5. **Equipamentos** — `AttacksList`/`AttackCard` (armas, com Rolar) + `Inventory` + `Proficiencies` + moedas

> Sempre visível (VitalBar): nome, PV, PM, Defesa, nível, divindade, classes.
> Identidade estendida + Notas/Logs/Progressão: acessíveis pelo tap no header / menu "⋯".

---

## 2. Fases (incrementais e shippáveis)

### Fase 0 — Design tokens C Dark *(baixo risco, base de tudo)*
- Atualizar `styles/tokens.css`: paleta carvão + acento esmeralda; adicionar fontes Bricolage Grotesque + Plus Jakarta Sans (`index.html`).
- Introduzir tokens semânticos novos (`--accent`, `--accent-soft`, `--surface`, `--surface-2`...) sem quebrar os antigos.
- **Decisão:** aplicar globalmente (moderniza o app inteiro, inclusive Naruto) **ou** escopar via classe wrapper `.sheet-c-dark`. → *Recomendo global, validando o Naruto depois.*

### Fase 1 — Shell + navegação *(esqueleto, ainda com componentes atuais)*
- `CharacterShell` + `VitalBar` + `TabNav`, responsivo (1 col mobile → grid 3 col ≥768px).
- Renderizar os componentes **existentes** (sem restyle ainda) dentro das 5 abas, em `readOnly`.
- Plugar atrás de feature flag numa rota nova (ex.: `/tormenta/char?id=&v=2`) p/ comparar com o atual sem risco.

### Fase 2 — Restyle + cartões de ação
- Reescrever os `.module.css` dos componentes character/* para o C dark.
- `ActionCard` para ataques/magias com botão **Rolar/Lançar** (reusa `CombatCard`/`DamagePopover`), `AttributeBadge`, `SkillRow`, `ConditionChip`, `Gauge` (PV/PM).

### Fase 3 — Modo de edição + bottom-sheets
- Toggle "Editar/Concluir" no header → alterna `readOnly` do `CharacterProvider` (autosave segue ativo).
- Migrar editores inline complexos (magia, poder, ataque, item) para `BottomSheet` reutilizável; valores simples (atributos, PV/PM máx, defesa) editam inline com stepper/input.

### Fase 4 — Wizard de criação
- Rota `/tormenta/new`; `CreateCharacterWizard` constrói o `Character` em cima de `createEmptyCharacter()` por etapa, depois `apiSaveCharacter` + navega para a ficha.
- Substituir o modal simples de nome em `SelectPage` por "Criar com assistente".
- Compra de pontos de atributo (custo linear no MVP; tabela T20 oficial como follow-up).

### Fase 5 — Polish & paridade
- Drawers Notas/Logs/Progressão no menu "⋯"; `IdentitySheet`; animações de load escalonadas; foco/acessibilidade; QA real em mobile/iPad.
- Remover `SectionNav` e as PLAY_ZONES antigas após paridade.

### Fase 6 — Cutover
- Tornar o shell novo padrão em `/tormenta/char` e na visão de party; aposentar `TormentaSheetPage`/`ViewCharacterPage` antigos.
- Naruto: inalterado (componentes próprios) ou portado p/ o mesmo shell depois.

---

## 3. Riscos & decisões em aberto
1. **Tokens globais vs escopados** — mudar `tokens.css` re-tematiza Naruto e demais páginas (consistência vs escopo).
2. **Identidade estendida / Notas / Logs / Progressão** — confirmar onde moram (tap no header vs aba/overflow).
3. **Bottom-sheet vs edição inline** — migrar tudo ou só os forms ricos (magia/poder/ataque).
4. **Compra de pontos** — linear (MVP) vs tabela oficial T20.
5. **Autosave/WebSocket** — mudanças são de apresentação; manter intactos e testar durante o refactor.

## 4. Ordem sugerida de execução
`Fase 0 → 1` entregam já a nova IA e o visual com risco mínimo (sem mexer em lógica). `2 → 3` entregam a experiência de jogo e edição. `4` adiciona criação. `5 → 6` fecham paridade e cutover. Cada fase é mergeável isoladamente.
