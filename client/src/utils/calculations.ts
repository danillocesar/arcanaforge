import type { Character, AttributeId, Buff, BuffEffect, BuffType, Attack, InventoryItem, DamageReduction } from '../types/character';
import { SKILLS_CONFIG } from '../data/pericias';
import { filterFixedBonusEffects, normalizeEffectType } from './buffEffects';

export function createEmptyCharacter(name?: string): Character {
  const skills: Character['skills'] = {};
  SKILLS_CONFIG.forEach((p) => {
    skills[p.id] = { trained: false, misc: 0 };
    if (p.customLabel) skills[p.id].label = '';
  });

  return {
    _id: crypto.randomUUID(),
    system: 'tormenta',
    name: name || 'Novo Personagem',
    classes: [{ name: '', level: 1 }],
    race: '',
    origin: '',
    deity: '',
    alignment: '',
    languages: '',
    age: '',
    size: 'Médio',
    speed: '9m / 6q',
    experience: 0,
    attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    hp: { max: 0, current: 0 },
    mp: { max: 0, current: 0 },
    defense: { base: 10, items: [] },
    damageReductions: [],
    attacks: [],
    skills,
    abilities: [],
    spells: [],
    spellcastingAttribute: 'int',
    inventory: [],
    equipped: [{ name: '' }, { name: '' }, { name: '' }, { name: '' }],
    coins: { copper: 0, silver: 0, gold: 0 },
    notes: '',
    temporaryEffects: '',
    proficiencies: '',
    progression: [],
    buffs: [],
    temporaryHp: 0,
    temporaryMp: 0,
    collapsedSections: {},
    hiddenSections: {},
    attackAnimation: 'personagem',
    avatar: '',
    logs: [],
  };
}

export function getTotalLevel(character: Character): number {
  if (character.classes && character.classes.length > 0) {
    return character.classes.reduce((sum, c) => sum + (Number(c.level) || 0), 0);
  }
  return Number(character.level) || 1;
}

/** Bônus de treinamento do T20: +2 até 6º, +4 do 7º ao 14º, +6 do 15º em diante. */
export function trainingBonusForLevel(level: number): number {
  if (level >= 15) return 6;
  if (level >= 7) return 4;
  return 2;
}

/** Arma/armadura fora do corpo não aplica efeito — `undefined` = equipada (legado). */
export function isItemEquipped(item: { equipped?: boolean }): boolean {
  return item.equipped !== false;
}

/**
 * Buffs sintéticos, sempre ativos, vindos de Poderes/Habilidades e Itens marcados
 * como `alwaysActive` — não ficam em `character.buffs[]`, são derivados na hora.
 */
function synthesizeAlwaysActiveBuffs(character: Character): Buff[] {
  const fromAbilities = (character.abilities ?? [])
    .filter((a) => a.alwaysActive && !a.suppressed)
    .map((a) => ({ name: a.name, effects: filterFixedBonusEffects(a.buffs ?? []), mp: 0, active: true, source: 'Poder' }))
    .filter((b) => b.effects.length > 0);
  const fromItems = (character.inventory ?? [])
    .filter((it) => it.alwaysActive && !it.suppressed)
    // Arma guardada na mochila não aplica seus bônus fixos.
    .filter((it) => it.category !== 'arma' || isItemEquipped(it))
    .map((it) => ({ name: it.name, effects: filterFixedBonusEffects(it.buffs ?? []), mp: 0, active: true, source: 'Item' }))
    .filter((b) => b.effects.length > 0);
  // Melhorias/encantos de armadura e escudo (defense.items) também são fixos.
  const fromDefense = (character.defense?.items ?? [])
    .filter((it) => it.alwaysActive && isItemEquipped(it))
    .map((it) => ({ name: it.name, effects: filterFixedBonusEffects(it.buffs ?? []), mp: 0, active: true, source: 'Armadura' }))
    .filter((b) => b.effects.length > 0);
  return [...fromAbilities, ...fromItems, ...fromDefense];
}

/**
 * Todos os buffs em vigor agora: os manuais ligados em `character.buffs[]` mais os
 * sintéticos de Poderes/Itens fixos. Ponto único usado por todo cálculo que soma
 * efeitos de buff — evita duplicar o filtro `active`/iteração em cada função.
 */
export function getActiveBuffs(character: Character): Buff[] {
  return [...(character.buffs ?? []).filter((b) => b.active), ...synthesizeAlwaysActiveBuffs(character)];
}

/** Termo de nível de um efeito: nível inteiro, metade, ou nada. */
function levelTerm(eff: BuffEffect, character: Character): number {
  if (eff.levelBonus === 'full') return getTotalLevel(character);
  if (eff.levelBonus === 'half') return Math.floor(getTotalLevel(character) / 2);
  return 0;
}

/**
 * Atributo-guia para variáveis: base + efeitos `attribute` de VALOR FIXO (+ nível) — nunca os
 * que dependem de outro atributo. Um nível de derivação, sem ciclo ("+For em Des" e "+Des em
 * For" ativos ao mesmo tempo terminam, cada um lendo o guia do outro).
 */
export function guideAttribute(character: Character, attr: AttributeId): number {
  let val = character.attributes[attr] || 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attribute' && eff.attributeId === attr && !eff.attributeBonus) {
        val += (Number(eff.value) || 0) + levelTerm(eff, character);
      }
    });
  });
  return val;
}

/**
 * Valor numérico de um efeito: fixo + atributo-guia + nível. Único ponto de leitura de
 * `BuffEffect.value` nos cálculos — não usar para `extra_damage` (que é string de dado).
 */
export function resolveEffectValue(eff: BuffEffect, character: Character): number {
  const fixed = Number(eff.value) || 0;
  const attr = eff.attributeBonus ? guideAttribute(character, eff.attributeBonus) : 0;
  return fixed + attr + levelTerm(eff, character);
}

/**
 * Buff que viaja para outro personagem leva os NÚMEROS do conjurador — variável resolvida
 * aqui e removida, igual à CD (`dc`). Dados (`extra_damage`) e efeitos sem variável passam
 * intactos.
 */
export function freezeEffects(effects: BuffEffect[], character: Character): BuffEffect[] {
  return effects.map((eff) => {
    if (normalizeEffectType(eff.type) === 'extra_damage' || (!eff.attributeBonus && !eff.levelBonus)) return eff;
    const { attributeBonus: _attr, levelBonus: _lvl, ...rest } = eff;
    void _attr;
    void _lvl;
    return { ...rest, value: String(resolveEffectValue(eff, character)) };
  });
}

export function getEffectiveAttribute(character: Character, attr: AttributeId): number {
  let val = character.attributes[attr] || 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attribute' && eff.attributeId === attr) {
        val += resolveEffectValue(eff, character);
      }
    });
  });
  return val;
}

/**
 * PV máximo efetivo: o valor base editável em `character.hp.max` mais os efeitos
 * `max_hp` de poderes/itens/buffs ativos — mesmo padrão reativo de
 * `getEffectiveAttribute`, nunca grava o bônus no personagem.
 */
export function getEffectiveMaxHp(character: Character): number {
  let val = character.hp.max || 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (normalizeEffectType(eff.type) === 'max_hp') val += resolveEffectValue(eff, character);
    });
  });
  return val;
}

/** PM máximo efetivo — mesma lógica de {@link getEffectiveMaxHp} para `max_mp`. */
export function getEffectiveMaxMp(character: Character): number {
  let val = character.mp.max || 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (normalizeEffectType(eff.type) === 'max_mp') val += resolveEffectValue(eff, character);
    });
  });
  return val;
}

export function calcArmorPenalty(character: Character): number {
  let pen = 0;
  if (character.defense?.items) {
    character.defense.items.forEach((item) => {
      // Armadura guardada não pesa no corpo — penalidade só equipada.
      if (item.penalty && isItemEquipped(item)) pen += item.penalty;
    });
  }
  return pen;
}

export function calcTotalSkill(character: Character, skillId: string): number {
  const cfg = SKILLS_CONFIG.find((p) => p.id === skillId);
  if (!cfg) return 0;
  const skill = character.skills[skillId];
  if (!skill) return 0;
  if (cfg.trained && !skill.trained) return 0;

  const halfLevel = Math.floor(getTotalLevel(character) / 2);
  const usedAttribute = (skill.attribute || cfg.attribute) as AttributeId;
  const attributeMod = getEffectiveAttribute(character, usedAttribute);
  const trainingBonus = skill.trained ? trainingBonusForLevel(getTotalLevel(character)) : 0;
  const miscBonus = skill.misc || 0;
  // "+ atributo" direto na perícia (E3/H3.4): segundo atributo somado, via atributo-guia.
  const bonusAttr = skill.bonusAttribute ? guideAttribute(character, skill.bonusAttribute) : 0;
  // Penalidade de armadura vale pra toda perícia usada com Força ou Destreza
  // (inclusive Luta/Pontaria e atributo trocado pelo jogador), exceto Iniciativa.
  let armorPenalty = 0;
  const penalized = (usedAttribute === 'str' || usedAttribute === 'dex') && skillId !== 'iniciativa';
  if (penalized) {
    armorPenalty = calcArmorPenalty(character);
  }
  let buffBonus = 0;
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'skill' && eff.skillId === skillId) {
        buffBonus += resolveEffectValue(eff, character);
      }
    });
  });
  return halfLevel + attributeMod + trainingBonus + miscBonus + bonusAttr + armorPenalty + buffBonus;
}

export function calcTotalDefense(character: Character): number {
  let total = (character.defense.base || 10) + getEffectiveAttribute(character, 'dex');
  if (character.defense.items) {
    character.defense.items.forEach((item) => {
      if (!isItemEquipped(item)) return;
      total += item.value || 0;
    });
  }
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'defense') total += resolveEffectValue(eff, character);
    });
  });
  return total;
}

/** Alias for the buff-aware total defense (centralized selector). */
export const effectiveDefense = calcTotalDefense;

/** All six attribute modifiers with active buffs applied. */
export function effectiveAttributes(character: Character): Record<AttributeId, number> {
  return {
    str: getEffectiveAttribute(character, 'str'),
    dex: getEffectiveAttribute(character, 'dex'),
    con: getEffectiveAttribute(character, 'con'),
    int: getEffectiveAttribute(character, 'int'),
    wis: getEffectiveAttribute(character, 'wis'),
    cha: getEffectiveAttribute(character, 'cha'),
  };
}

export interface DefenseBreakdownRow {
  name: string;
  value: number;
}

export interface DefenseBreakdown {
  base: number;
  dexterity: number;
  items: DefenseBreakdownRow[];
  buffs: DefenseBreakdownRow[];
  total: number;
}

/** Structured breakdown for the Defense popover (base + Destreza + protections + active defense buffs). */
export function getDefenseBreakdown(character: Character): DefenseBreakdown {
  const base = character.defense.base || 10;
  const dexterity = getEffectiveAttribute(character, 'dex');
  const items: DefenseBreakdownRow[] = (character.defense.items || [])
    .filter((it) => isItemEquipped(it) && (it.value || 0) !== 0)
    .map((it) => ({ name: it.name || 'Proteção', value: it.value || 0 }));
  const buffs: DefenseBreakdownRow[] = getActiveBuffs(character)
    .flatMap((b) => (b.effects || [])
      .filter((eff) => eff.type === 'defense')
      .map((eff) => ({ name: b.name || 'Buff', value: resolveEffectValue(eff, character) })));
  return { base, dexterity, items, buffs, total: calcTotalDefense(character) };
}

/**
 * Toggle a buff's active state, applying its game effects as a pure transform:
 * spends/refunds MP cost, and adds/removes temporary HP/MP for hp/mp buffs.
 * Attribute/skill/defense/damage buffs are reflected live by the effective
 * selectors, so they only need the `active` flip (+ MP cost). Centralizes the
 * logic previously inline in BuffsList.
 */
export function toggleBuffState(character: Character, idx: number): Character {
  const buffs = [...character.buffs];
  const b = { ...buffs[idx] };
  if (!b) return character;
  const wasActive = b.active;
  b.active = !wasActive;

  let mpCurrent = character.mp.current;
  let hpTemp = character.temporaryHp;
  let mpTemp = character.temporaryMp;
  const mpCost = Number(b.mp) || 0;
  const sign = wasActive ? -1 : 1;

  if (!wasActive && mpCost > 0) mpCurrent = Math.max(0, mpCurrent - mpCost);

  (b.effects || []).forEach((eff) => {
    const val = resolveEffectValue(eff, character);
    const type = normalizeEffectType(eff.type);
    if (type === 'temp_hp') hpTemp = Math.max(0, hpTemp + sign * val);
    if (type === 'temp_mp') mpTemp = Math.max(0, mpTemp + sign * val);
  });

  buffs[idx] = b;
  return {
    ...character,
    buffs,
    mp: { ...character.mp, current: mpCurrent },
    temporaryHp: hpTemp,
    temporaryMp: mpTemp,
  };
}

/**
 * Desliga todo buff ativo (H1.1) — reaproveita a aritmética de `toggleBuffState`, então o
 * temporário concedido por cada um é devolvido e o PM gasto NÃO volta (igual ao toggle).
 * Devolve a mesma referência quando não há nada ativo, pra não disparar autosave à toa.
 */
export function deactivateAllBuffs(character: Character): Character {
  return deactivateBuffsWhere(character, () => true);
}

/** Desliga os buffs ativos que passam no predicado (ex.: só os de duração "cena"). */
export function deactivateBuffsWhere(character: Character, predicate: (buff: Buff) => boolean): Character {
  return (character.buffs ?? []).reduce(
    (acc, b, i) => (b.active && predicate(b) ? toggleBuffState(acc, i) : acc),
    character,
  );
}

/** Remove da lista os buffs desligados (os ativos ficam intactos). */
export function removeInactiveBuffs(character: Character): Character {
  return { ...character, buffs: (character.buffs ?? []).filter((b) => b.active) };
}

export function calcCarryCapacity(character: Character): number {
  const strength = getEffectiveAttribute(character, 'str');
  if (strength < 0) return 10 + strength;
  return 10 + 2 * strength;
}

export function calcUsedLoad(character: Character): number {
  let total = 0;
  if (character.inventory) {
    character.inventory.forEach((item) => {
      total += (item.weight || 0) * (item.quantity || 1);
    });
  }
  return total;
}

export function calcSpellResistance(character: Character): number {
  const attrKey = character.spellcastingAttribute || 'int';
  const mod = getEffectiveAttribute(character, attrKey);
  return 10 + Math.floor(getTotalLevel(character) / 2) + mod;
}

/** Uma arma do inventário só vira card de Ataque quando tem dano cadastrado. */
export function isWeaponAttack(item: InventoryItem): boolean {
  return item.category === 'arma' && Boolean((item.damage ?? '').trim());
}

/** Adapta uma arma do inventário (com dados de combate) para o formato de Ataque. */
export function weaponToAttack(item: InventoryItem): Attack {
  return {
    name: item.name,
    damage: item.damage ?? '',
    critical: item.critical ?? '',
    type: item.type ?? '',
    rangeType: item.rangeType ?? 'melee',
    mpCost: item.mpCost ?? 0,
    attributeDamageBonus: item.attributeDamageBonus ?? 'str',
    extraBonuses: [],
    extraDamage: [],
  };
}

export function calcAttackRoll(character: Character, atk: Character['attacks'][number]): number {
  const skillId = atk.rangeType === 'ranged' ? 'pontaria' : 'luta';
  let total = calcTotalSkill(character, skillId);
  if (atk.extraBonuses) {
    atk.extraBonuses.forEach((b) => {
      total += (Number(b.value) || 0) + (b.attribute ? getEffectiveAttribute(character, b.attribute) : 0);
    });
  }
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'attack_roll') total += resolveEffectValue(eff, character);
    });
  });
  return total;
}

export function calcDamageBonus(character: Character, atk: Character['attacks'][number]): number {
  const attrKey = (atk.attributeDamageBonus || 'str') as AttributeId;
  let total = getEffectiveAttribute(character, attrKey);
  if (atk.extraDamage) {
    atk.extraDamage.forEach((b) => {
      // Dado ("1d6") não entra aqui (fica em buildDamageSummary); o atributo entra como fixo.
      total += (Number(b.value) || 0) + (b.attribute ? getEffectiveAttribute(character, b.attribute) : 0);
    });
  }
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'fixed_damage') total += resolveEffectValue(eff, character);
    });
  });
  return total;
}

export function buildDamageSummary(character: Character, atk: Character['attacks'][number]): string {
  const parts: string[] = [];
  const damageDice = atk.damage || '';
  if (damageDice) parts.push(damageDice);

  const damageBonus = calcDamageBonus(character, atk);

  const extraDice: string[] = [];
  if (atk.extraDamage) atk.extraDamage.forEach((b) => {
    const v = String(b.value || '');
    if (v && isNaN(Number(v))) extraDice.push(v);
  });
  getActiveBuffs(character).forEach((b) => {
    (b.effects || []).forEach((eff) => {
      if (eff.type === 'extra_damage') {
        const v = String(eff.value || '');
        if (v) extraDice.push(v);
      }
    });
  });
  extraDice.forEach((d) => parts.push(d));

  if (damageBonus !== 0 || parts.length === 0) {
    parts.push(damageBonus >= 0 && parts.length > 0 ? `+${damageBonus}` : formatMod(damageBonus));
  }

  return parts.join('+').replace(/\+\+/g, '+').replace(/\+-/g, '-');
}

export function calcTotalMp(atk: Character['attacks'][number]): number {
  let total = Number(atk.mpCost) || 0;
  if (atk.extraBonuses) atk.extraBonuses.forEach((b) => { total += Number(b.mp) || 0; });
  if (atk.extraDamage) atk.extraDamage.forEach((b) => { total += Number(b.mp) || 0; });
  return total;
}

export function formatMod(val: number | string): string {
  const n = Number(val) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
}

export function hpPercent(current: number, max: number): number {
  if (!max || max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

/**
 * Converte buffs no formato antigo (type/attributeId/skillId/value soltos no buff,
 * sem `effects`) para o formato novo. Personagens salvos antes desta mudança não têm
 * `effects` — sem isso, os cálculos acima (que só leem `effects`) os ignorariam
 * silenciosamente.
 */
export function normalizeBuffs(buffs: unknown[]): Buff[] {
  return (buffs || []).map((raw) => {
    const b = raw as Record<string, unknown>;
    if (Array.isArray(b.effects)) return b as unknown as Buff;
    const legacy = b as { type?: BuffType; attributeId?: AttributeId; skillId?: string; value?: string };
    const effects: BuffEffect[] = legacy.type
      ? [{ type: legacy.type, attributeId: legacy.attributeId, skillId: legacy.skillId, value: String(legacy.value ?? '') }]
      : [];
    return {
      name: String(b.name ?? ''),
      effects,
      mp: Number(b.mp) || 0,
      active: Boolean(b.active),
      source: typeof b.source === 'string' ? b.source : undefined,
    };
  });
}

/** Nome usado quando a RD não diz contra qual tipo de dano ela vale. */
const GENERAL_DR_NAME = 'Geral';

/** Uma linha de RD já saneada, ou `null` se a linha não tinha valor aproveitável. */
function damageReductionRow(raw: unknown): DamageReduction | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as { name?: unknown; value?: unknown };
  const value = Number(row.value);
  if (!Number.isFinite(value) || value === 0) return null;
  const name = String(row.name ?? '').trim() || GENERAL_DR_NAME;
  return { name, value };
}

/**
 * Migração de leitura da Redução de Dano, rodada a cada carregamento de ficha —
 * por isso precisa ser idempotente. Três formatos históricos convergem aqui:
 *
 * - lista nova `damageReductions` → só é saneada (linha sem número sai fora);
 * - número solto `damageReduction` (formato intermediário) → uma linha "Geral";
 * - texto livre `"5 (fogo)"` (formato original) → **recupera o tipo** do parêntese,
 *   em vez de descartá-lo como a migração anterior fazia.
 *
 * A lista nova sempre ganha do valor legado: se ela existe, o número antigo é
 * resíduo de uma ficha já migrada.
 */
export function normalizeDamageReductions(
  list: unknown,
  legacy: unknown,
): DamageReduction[] {
  // A simples presença do campo novo significa que a migração já rodou nesta ficha —
  // então ele é a verdade mesmo vazio, senão apagar todas as RDs seria desfeito pelo
  // valor legado que continua no documento salvo.
  if (Array.isArray(list)) {
    return list.map(damageReductionRow).filter((r): r is DamageReduction => r !== null);
  }

  if (typeof legacy === 'number') {
    return legacy !== 0 ? [{ name: GENERAL_DR_NAME, value: legacy }] : [];
  }

  const text = String(legacy ?? '');
  const value = text.match(/-?\d+/);
  if (!value) return [];
  // "5 (fogo)" → tipo entre parênteses; "RD 5 contra fogo" e afins não são
  // adivinhados, caem em "Geral" pra não inventar nome errado.
  const name = text.match(/\(([^)]+)\)/)?.[1]?.trim();
  return [{ name: name || GENERAL_DR_NAME, value: Number(value[0]) }];
}

/**
 * Aplica um buff já ativo num personagem: soma os deltas de PV/PM temporário dos
 * efeitos do tipo hp/mp (mesma soma que toggleBuffState faria ao ativar, mas sem
 * custo de PM — o custo já foi pago na conjuração) e insere o buff na lista.
 *
 * Se já existir um buff com o mesmo NOME (normalizado — caixa/espaços ignorados,
 * origem irrelevante; ex.: recastar a mesma magia, ou um buff manual homônimo),
 * substitui a instância existente em vez de duplicar — primeiro desfaz a
 * contribuição de PV/PM temporário de cada cópia antiga ativa, depois soma a da
 * nova, evitando contar o bônus em dobro. Duplicatas pré-existentes do mesmo nome
 * são colapsadas numa entrada só (sara fichas poluídas pelo bug antigo de
 * duplicação em buff de grupo). Buff sem nome nunca substitui outro sem nome.
 *
 * Também CURA o PV/PM atual na quantidade dos efeitos `max_hp`/`max_mp` do buff
 * novo, clampado no máximo efetivo — subir o máximo sobe o atual junto (T20).
 * `temp_hp`/`temp_mp` NÃO curam: o temporário é sobrevida separada
 * (utils/vitals.ts), consumida antes do PV e nunca reposta por cura.
 *
 * Espelha o mergeBuffIntoCharacter do servidor — mudou aqui, muda lá.
 *
 * Usado tanto para o próprio conjurador (auto-aplicação local) quanto ao receber a
 * notificação em tempo real de um buff aplicado por outro jogador.
 */
const buffNameKey = (name: string | undefined): string => String(name ?? '').trim().toLowerCase();

export function applyBuffToCharacter(character: Character, buff: Buff): Character {
  const key = buffNameKey(buff.name);
  const matches = key === '' ? [] : character.buffs.filter((b) => buffNameKey(b.name) === key);

  let hpTemp = character.temporaryHp;
  let mpTemp = character.temporaryMp;

  matches.forEach((existing) => {
    if (!existing.active) return;
    (existing.effects || []).forEach((eff) => {
      const val = resolveEffectValue(eff, character);
      const type = normalizeEffectType(eff.type);
      if (type === 'temp_hp') hpTemp = Math.max(0, hpTemp - val);
      if (type === 'temp_mp') mpTemp = Math.max(0, mpTemp - val);
    });
  });

  buff.effects.forEach((eff) => {
    const val = resolveEffectValue(eff, character);
    const type = normalizeEffectType(eff.type);
    if (type === 'temp_hp') hpTemp += val;
    if (type === 'temp_mp') mpTemp += val;
  });

  let replaced = false;
  const buffs =
    matches.length === 0
      ? [...character.buffs, buff]
      : character.buffs.flatMap((b) => {
          if (buffNameKey(b.name) !== key) return [b];
          if (replaced) return [];
          replaced = true;
          return [buff];
        });

  // Só max_hp/max_mp curam: subir o máximo sobe o atual junto (regra do T20).
  // temp_hp/temp_mp são sobrevida separada (utils/vitals.ts) — não mexem no atual,
  // e o teto da cura é o máximo efetivo SEM o temporário.
  let healHp = 0;
  let healMp = 0;
  buff.effects.forEach((eff) => {
    const val = resolveEffectValue(eff, character);
    const type = normalizeEffectType(eff.type);
    if (type === 'max_hp') healHp += val;
    if (type === 'max_mp') healMp += val;
  });

  const next = {
    ...character,
    buffs,
    temporaryHp: hpTemp,
    temporaryMp: mpTemp,
  };

  if (healHp > 0) {
    const ceiling = getEffectiveMaxHp(next);
    next.hp = { ...next.hp, current: Math.min(next.hp.current + healHp, ceiling) };
  }
  if (healMp > 0) {
    const ceiling = getEffectiveMaxMp(next);
    next.mp = { ...next.mp, current: Math.min(next.mp.current + healMp, ceiling) };
  }

  return next;
}
