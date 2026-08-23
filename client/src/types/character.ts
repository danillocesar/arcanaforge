export type RPGSystem = 'tormenta';

export interface CharacterSummary {
  _id: string;
  name: string;
  avatar: string;
  classes: { name: string; level: number }[];
  system: RPGSystem;
  ownerUid?: string;
  ownerEmail?: string;
  deletedAt?: string | null;
  pendingDeleteAt?: string | null;
}

export type AttributeId = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type BuffType =
  | 'attack_roll'
  | 'extra_damage'
  | 'fixed_damage'
  | 'attribute'
  | 'temp_hp'
  | 'temp_mp'
  | 'max_hp'
  | 'max_mp'
  | 'skill'
  | 'defense';

export type RangeType = string;

export interface ExtraBonus {
  name: string;
  value: number;
  mp: number;
}

export interface ExtraDamage {
  name: string;
  value: string;
  mp: number;
}

export interface AttackModifier {
  label: string;
  attackRoll?: number;
  damageBonus?: number;
  damageDice?: string;
  mpCost?: number;
  /** Bônus dirigido por atributo: soma o valor efetivo do atributo no teste de
   * ataque / no dano, acumulável com o valor fixo digitado na mesma linha. */
  attackRollAttribute?: AttributeId;
  damageBonusAttribute?: AttributeId;
  /** Pode ser aplicado N vezes no mesmo ataque (ex.: Smite Divino, 1d8 por 1 PM) —
   * habilita o stepper ×N na modal de compor ataque. Ausente/falso = aplica 1×. */
  repeatable?: boolean;
  /** Bônus temporário de atributo (ex.: "+6 Força") — resolvido por ataque: soma
   * no acerto só se a perícia usada pelo ataque for regida por esse atributo, e
   * no dano só se o próprio ataque usar esse atributo como base de dano. */
  attributeId?: AttributeId;
  attributeValue?: number;
}

export interface Attack {
  name: string;
  damage: string;
  critical: string;
  type: string;
  rangeType: RangeType;
  mpCost: number;
  attributeDamageBonus: string;
  extraBonuses: ExtraBonus[];
  extraDamage: ExtraDamage[];
}

export interface BuffEffect {
  type: BuffType;
  attributeId?: AttributeId;
  skillId?: string;
  value: string;
}

export interface Buff {
  name: string;
  effects: BuffEffect[];
  mp: number;
  active: boolean;
  /** Texto de exibição, ex. "de Fulano" — presente só em buffs aplicados por magia/poder. */
  source?: string;
  /** Texto de regra, ex. condições oficiais do catálogo — lembrete do efeito, não recalculado. */
  description?: string;
  /** Teste de resistência da magia de origem, ex. "Vontade anula". Exibição apenas —
   * o app não rola dados, mostra o tipo e a CD pra quem recebeu o buff. */
  resistance?: string;
  /** CD do teste de resistência, congelada na conjuração (sai do conjurador, não do alvo). */
  dc?: number;
}

export interface Enhancement {
  description: string;
  mpCost: number;
  buffs?: BuffEffect[];
  /** Quando presente, o aprimoramento vira um item próprio no checklist da modal de
   * ataque (além do efeito base da magia), com o `mpCost` do aprimoramento somado. */
  attackModifiers?: AttackModifier[];
}

export type BuffTargetScope = 'self' | 'party';

export interface Spell {
  name: string;
  school: string;
  castingTime: string;
  range: string;
  area: string;
  duration: string;
  resistance: string;
  mpCost: number;
  spellLevel: number;
  enhancements: Enhancement[];
  /** Resumo de uma linha pro card da ficha. Vazio ⇒ cai na primeira frase da descrição. */
  summary?: string;
  description: string;
  buffTargetScope?: BuffTargetScope;
  buffs?: BuffEffect[];
  attackModifiers?: AttackModifier[];
}

export type AbilityKind = 'Poder' | 'Habilidade';

export interface Ability {
  name: string;
  source: string;
  type: string;
  /** Redesign etiqueta: distinguishes a Poder from a Habilidade in the unified list. */
  kind?: AbilityKind;
  mpCost: number;
  /** Resumo de uma linha pro card da ficha. Vazio ⇒ cai na primeira frase da descrição. */
  summary?: string;
  description: string;
  /** Se marcado, aparece na lista de Ações (aba Atributos) com botão de usar. */
  castable?: boolean;
  buffTargetScope?: BuffTargetScope;
  buffs?: BuffEffect[];
  /** Pré-requisito, ex. "Força 13" — presente em poderes gerais do catálogo oficial. */
  prerequisite?: string;
  attackModifiers?: AttackModifier[];
  /** Se marcado, os `buffs` deste Poder/Habilidade aplicam sempre, sem precisar
   * "conjurar" — aparece na seção "Bônus Fixos", não na lista de Buffs & Condições. */
  alwaysActive?: boolean;
  /** Bônus fixo suspenso no momento (ex.: agarrado perde a defesa) — o flag mora no
   * próprio poder, não num índice em Character, pra sobreviver a reordenação/remoção.
   * Suspende tanto os `buffs` fixos quanto os `attackModifiers`. */
  suppressed?: boolean;
  /** Marcado como favorito: aparece também na seção "Favoritos" fixa no topo da aba
   * Poderes, sem sair do seu grupo de categoria. */
  favorite?: boolean;
}

/**
 * `esoterico`: item de conjurador (cetro, varinha, foco) — como uma arma sem dano,
 * com efeito permanente. Não cabia em nenhuma das outras: em `arma` sumia da aba
 * Ações (isWeaponAttack exige dano) e em `acessorio` perdia os campos de combate.
 */
export type InventoryCategory = 'comum' | 'consumivel' | 'acessorio' | 'arma' | 'esoterico';

export interface InventoryItem {
  name: string;
  quantity: number;
  weight: number;
  /** Redesign: groups items into Comuns / Consumíveis / Acessórios. Legacy items → 'comum'. */
  category?: InventoryCategory;
  /** Free-text effect (consumíveis / acessórios). */
  effect?: string;
  /** Equip slot / location (acessórios). */
  slot?: string;
  /** Dados de combate — só usados quando category === 'arma'. Preenchidos ⇒ a arma
   * aparece automaticamente como Ataque na aba Ações, sem precisar cadastrar de novo. */
  damage?: string;
  critical?: string;
  type?: string;
  rangeType?: RangeType;
  mpCost?: number;
  attributeDamageBonus?: string;
  attackModifiers?: AttackModifier[];
  /** Se marcado, os `buffs` deste Item aplicam sempre — aparece na seção
   * "Bônus Fixos", não na lista de Buffs & Condições. Vale independente de o item
   * estar em `character.equipped` (mesma regra que já vale pra `attackModifiers`). */
  alwaysActive?: boolean;
  /** Bônus fixo suspenso no momento — mesma semântica de `Ability.suppressed`. */
  suppressed?: boolean;
  buffs?: BuffEffect[];
}

export interface EquippedItem {
  name: string;
}

export interface DefenseItem {
  name: string;
  value: number;
  penalty: number;
  /** Linhas de melhoria/encanto aplicadas (texto do catálogo). */
  effect?: string;
  /** Buffs fixos da melhoria/encanto — sintetizados como bônus sempre ativo. */
  alwaysActive?: boolean;
  buffs?: BuffEffect[];
}

/** Redução de Dano por tipo, ex. `{ name: 'fogo', value: 5 }`. "Geral" = contra tudo. */
export interface DamageReduction {
  name: string;
  value: number;
}

export interface LogEntry {
  type: string;
  name: string;
  mpSpent: number;
  timestamp: number | string;
  details?: string | Record<string, unknown>;
}

export interface CharacterClass {
  name: string;
  level: number;
}

export interface SkillData {
  trained: boolean;
  misc: number;
  label?: string;
  attribute?: AttributeId;
}

export interface HitPoints {
  max: number;
  current: number;
}

export interface ManaPoints {
  max: number;
  current: number;
}

export interface Defense {
  base: number;
  items: DefenseItem[];
}

export interface Coins {
  copper: number;
  silver: number;
  gold: number;
}

export interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Character {
  _id: string;
  ownerUid?: string;
  ownerEmail?: string;
  system: RPGSystem;
  name: string;
  classes: CharacterClass[];
  race: string;
  origin: string;
  deity: string;
  alignment: string;
  languages: string;
  age: string;
  size: string;
  speed: string;
  experience: number;
  attributes: Attributes;
  hp: HitPoints;
  mp: ManaPoints;
  defense: Defense;
  damageReductions: DamageReduction[];
  /** @deprecated Formato antigo (número solto, antes texto livre). Migrado na leitura
   * por `normalizeDamageReductions`; fica no tipo só pra ler ficha salva. */
  damageReduction?: number;
  attacks: Attack[];
  skills: Record<string, SkillData>;
  abilities: Ability[];
  spells: Spell[];
  spellcastingAttribute: AttributeId;
  inventory: InventoryItem[];
  equipped: EquippedItem[];
  coins: Coins;
  notes: string;
  temporaryEffects: string;
  proficiencies: string;
  progression: string[];
  buffs: Buff[];
  temporaryHp: number;
  temporaryMp: number;
  collapsedSections: Record<string, boolean>;
  hiddenSections: Record<string, boolean>;
  attackAnimation: string;
  avatar: string;
  logs: LogEntry[];
  level?: number;
}
