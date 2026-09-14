# Redesign da Ficha de Tormenta 20 — Plano e Proposta

> Documento de proposta. **Nenhum código do projeto foi alterado.** O mockup interativo está em `tormenta-redesign-mockup.html` (abra no navegador e redimensione, ou use o seletor Mobile / iPad no topo).

---

## 1. Diagnóstico da tela atual

A ficha hoje (`pages/TormentaSheetPage/TormentaSheetPage.tsx` + `.module.css`) é uma "workbench" de zonas com tema dark fantasy (pergaminho + dourado). Os problemas centrais:

**Navegação confusa e redundante.** Existem três sistemas de navegação competindo: a *zoneRail* sticky no topo, a *visibilityDock* (mostrar/ocultar seções) e a *archiveDock* fixa embaixo com 5 botões. O jogador precisa decidir entre rolar a página, usar âncoras (`scrollIntoView`) ou abrir drawers — sem um modelo mental único.

**Layout desktop-first.** O container é `min(100%, 1480px)` com grids de múltiplas colunas (`1.22fr / 0.78fr`, `turnGrid`, `codexGrid`). No celular tudo colapsa em uma coluna longuíssima de rolagem, e no iPad o espaço é desperdiçado ou estica feio. Não há um layout pensado para toque.

**Ruído visual.** Cada zona tem um texto introdutório explicativo ("Recursos, efeitos e decisões rápidas ficam juntos", "Ações ofensivas em uma faixa própria...") que ocupa espaço sem ajudar o jogador em mesa. O tema escuro com dourado sobre fundo quase preto reduz contraste e legibilidade.

**Recursos vitais não ficam sempre visíveis.** PV / PM / Defesa — os números mais consultados em combate — ficam num "pulsePanel" que sai da tela ao rolar. A referência de UX de fichas digitais (D&D Beyond) é clara: *HP, mana e CA precisam estar acessíveis em qualquer aba, sem trocar de tela*.

**Toque e rolagem de dados.** Não há ação rápida de "rolar ataque / teste de perícia" otimizada para o dedo. Botões e alvos de toque variam de tamanho.

## 2. O que a ficha precisa conter (Tormenta 20)

Levantado do modelo de dados (`types/character.ts`) e da ficha oficial (Jogo do Ano):

- **Identidade:** nome, jogador, raça, origem, classe(s)+nível, divindade, alinhamento, tamanho, deslocamento, XP, avatar.
- **Atributos:** FOR, DES, CON, INT, SAB, CAR.
- **Recursos:** PV (atual/máx), PM (atual/máx), Defesa (10 + Des + armadura + escudo + outros, penalidade), redução de dano, PV/PM temporários.
- **Combate:** ataques (teste, dano, crítico, tipo, alcance, custo PM, bônus/dano extra).
- **Perícias:** 30+ perícias com atributo-chave, treino, ½ nível, penalidade de armadura, outros.
- **Magias:** atributo-chave, escola, execução, alcance, área, duração, resistência, custo PM, nível, aprimoramentos.
- **Habilidades & poderes:** de raça/origem e de classe.
- **Inventário:** itens (qtd, peso/slots), equipados, moedas, limite de carga.
- **Buffs / efeitos temporários** ativáveis.
- **Apoio:** proficiências, anotações, progressão, logs de combate, exportar.

## 3. Princípios de design (direção escolhida)

Direção aprovada: **clean estilo Nubank**, **mobile e iPad com igual peso**, **fluxo completo com abas**.

1. **Clareza acima de tema.** Fundo claro neutro, muito respiro, cards suaves com cantos arredondados (16–20px) e sombra leve. Uma cor de destaque (carmim de Tormenta) + uma secundária para mana (azul). Tipografia legível, hierarquia por tamanho/peso, não por moldura decorativa.
2. **Recursos vitais sempre visíveis.** Uma barra superior fixa com PV / PM / Defesa persiste em todas as abas — o número certo a um olhar de distância.
3. **Uma navegação só.** *Bottom tab bar* no celular (5 abas, na zona do polegar): Turno · Combate · Magias · Perícias · Mais. No iPad, a mesma estrutura vira uma *side rail* à esquerda com conteúdo em 2 colunas (master-detail).
4. **Ação por toque.** Cada ataque, perícia e magia tem um botão grande de "rolar / usar" (alvo ≥ 48px). Gasto de PM e bônus aplicados em um toque.
5. **Card-based e responsivo.** Tudo é card; cards reorganizam por breakpoint sem reflow estranho. Conteúdo de baixa frequência (proficiências, notas, progressão, logs) vai para a aba "Mais" / drawers, não polui o turno.
6. **Acessibilidade.** Contraste AA, estados de foco visíveis, rótulos textuais nas abas, sem depender de cor isolada para significado (PV/PM/Defesa também têm rótulo e ícone).

## 4. Arquitetura de informação (abas) — ordenada por prioridade de mesa

Princípio: **isto é dado de RPG, não um painel de combate.** Num jogo de mesa o foco é a interpretação; o combate é episódico. Logo a ordem das abas segue o que se consulta com mais frequência — identidade e valores base primeiro, combate por último.

1. **Personagem (home):** identidade e valores base (raça, origem, classe, divindade, alinhamento, tamanho, deslocamento, nível/XP), atributos, e bloco de **interpretação** (personalidade, aparência, história, objetivos). É a primeira coisa que importa na mesa.
2. **Perícias:** atributos no topo + lista de perícias com total e botão de teste; treinadas em destaque. As perícias são o coração da interpretação (Diplomacia, Enganação, Intuição, Atuação…).
3. **Magias & Poderes:** grimório por círculo + poderes/habilidades + buffs, **cada seção com criação rápida** (bottom sheet limpo). Custo de PM e aprimoramentos visíveis.
4. **Itens (inventário):** mochila com qtd/slots, moedas, limite de carga, criação rápida de item.
5. **Combate (última aba):** defesa detalhada, ataques com rolagem 1-toque, redução de dano. Fica por último porque combate não acontece o tempo todo.

**Sempre acessível (fora das abas):** cabeçalho fixo com PV/PM (anéis de progresso), Defesa e os **6 atributos** (FOR/DES/CON/INT/SAB/CAR). Como ficam sempre visíveis, não se repetem dentro das abas. Tocar em PV/PM abre o ajuste rápido (dano/cura/gastar PM); tocar num atributo rola o teste. O ícone de ajustes abre "Mais" (anotações, progressão, logs, proficiências, exportar, ocultar seções).

### Criação de magias / poderes / buffs

Cada seção tem um botão "+ Adicionar" que abre um **bottom sheet** (estilo Nubank): campos essenciais primeiro, avançado recolhido. Buff usa os tipos do sistema (atributo, teste de ataque, dano extra/fixo, vida, mana, perícia) com valor, custo de PM e um switch "ativar agora". Organizado e clean, sem formulário gigante de uma vez.

## 5. Comportamento responsivo

| Faixa | Layout |
|---|---|
| Celular | 1 coluna, cabeçalho fixo (vitais + atributos) empilhado, bottom tab bar de 5 abas. |
| iPad | Side rail à esquerda, conteúdo em 2 colunas (master-detail), cabeçalho full-width. |
| Desktop | Janela com side rail de ícones+rótulos, cabeçalho em linha única (identidade · vitais · atributos), conteúdo centralizado em 2 colunas largas. |

O mockup tem um seletor **Mobile / iPad / Desktop** no topo para visualizar os três.

## 6. Próximos passos (após aprovação)

1. Validar a direção visual e a estrutura de abas neste mockup.
2. Definir tokens de tema claro em `styles/tokens.css` (ou um tema alternativo).
3. Refatorar `TormentaSheetPage` para o modelo de abas + barra de vitais fixa, reaproveitando os componentes existentes (`HpMp`, `AttributesDefense`, `AttacksList`, `SpellsList`, `SkillsList`, etc.).
4. Garantir alvos de toque, foco e contraste (passar pela skill de accessibility-review).

---
*Referências de UX: feedback de fichas D&D Beyond (vitais sempre acessíveis, evitar perder-se entre abas), Demiplane Nexus (tooltips/click-to-know, multi-dispositivo), princípios Nubank (simplificar, cards, bottom nav na zona do polegar).*
