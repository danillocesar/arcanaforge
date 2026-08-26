import type { Character, DamageReduction } from '../types/character';
import { getEffectiveMaxHp, getEffectiveMaxMp, deactivateBuffsWhere } from './calculations';
import { normalizeSearch } from './formatters';

export type VitalPool = 'hp' | 'mp';

/**
 * Um pool (PV ou PM): `current` nunca passa de `max`; `temp` é a sobrevida — pool
 * separado, consumido antes do atual e nunca reposto por cura. Regra da mesa (26/08):
 * temporários de fontes diferentes somam.
 */
export interface VitalState {
  current: number;
  max: number;
  temp: number;
}

export interface DamageSplit {
  fromTemp: number;
  fromCurrent: number;
}

/** Quantidade válida de dano/cura: número positivo (Infinity é aceito — "curar tudo"). */
const positive = (n: number): number => (Number.isNaN(n) || n <= 0 ? 0 : n);

export function damageVital(v: VitalState, amount: number): { state: VitalState; split: DamageSplit } {
  const dmg = positive(amount);
  const fromTemp = Math.min(v.temp, dmg);
  const fromCurrent = Math.min(v.current, dmg - fromTemp);
  return {
    state: { ...v, temp: v.temp - fromTemp, current: v.current - fromCurrent },
    split: { fromTemp, fromCurrent },
  };
}

export function healVital(v: VitalState, amount: number): VitalState {
  return { ...v, current: Math.min(v.max, v.current + positive(amount)) };
}

export function clampVital(v: VitalState): VitalState {
  const max = Math.max(0, v.max || 0);
  return { max, current: Math.max(0, Math.min(max, v.current || 0)), temp: Math.max(0, v.temp || 0) };
}

export function getVital(c: Character, pool: VitalPool): VitalState {
  return pool === 'hp'
    ? { current: c.hp.current || 0, max: getEffectiveMaxHp(c), temp: c.temporaryHp || 0 }
    : { current: c.mp.current || 0, max: getEffectiveMaxMp(c), temp: c.temporaryMp || 0 };
}

export function setVital(c: Character, pool: VitalPool, v: VitalState): Character {
  return pool === 'hp'
    ? { ...c, hp: { ...c.hp, current: v.current }, temporaryHp: v.temp }
    : { ...c, mp: { ...c.mp, current: v.current }, temporaryMp: v.temp };
}

export function splitDamage(c: Character, amount: number, pool: VitalPool): DamageSplit {
  return damageVital(getVital(c, pool), amount).split;
}

export function applyDamage(c: Character, amount: number, pool: VitalPool): Character {
  return setVital(c, pool, damageVital(getVital(c, pool), amount).state);
}

export function applyHeal(c: Character, amount: number, pool: VitalPool): Character {
  return setVital(c, pool, healVital(getVital(c, pool), amount));
}

/**
 * Migração de leitura: fichas do modelo antigo guardavam o temporário DENTRO de
 * `hp.current` (o teto era máximo + temp). Clampa o atual no máximo efetivo — o
 * excesso já está em `temporaryHp`. Idempotente; devolve a mesma referência se
 * nada muda, pra não disparar autosave à toa.
 */
export function normalizeVitals(c: Character): Character {
  const hp = clampVital(getVital(c, 'hp'));
  const mp = clampVital(getVital(c, 'mp'));
  const same =
    hp.current === (c.hp.current || 0) && hp.temp === (c.temporaryHp || 0)
    && mp.current === (c.mp.current || 0) && mp.temp === (c.temporaryMp || 0);
  return same ? c : setVital(setVital(c, 'hp', hp), 'mp', mp);
}

/* ───────────────────────────── Novo dia ──────────────────────────── */

/** Zera PV e PM temporários — o que sobra de sobrevida some no fim da cena/dia (T20). */
function zeroTemps(c: Character): Character {
  return setVital(
    setVital(c, 'hp', { ...getVital(c, 'hp'), temp: 0 }),
    'mp',
    { ...getVital(c, 'mp'), temp: 0 },
  );
}

/**
 * "Fim de cena": desliga só os buffs de duração 'cena' (ou sem duração — o padrão) e
 * zera os temporários. Não cura nada; buffs 'dia' e 'permanente' continuam.
 */
export function endScene(c: Character): Character {
  return zeroTemps(deactivateBuffsWhere(c, (b) => (b.duration ?? 'cena') === 'cena'));
}

/**
 * Decisão da mesa (26/08): "Novo dia" = buffs desligados (todos, exceto os marcados como
 * permanentes), temporários zerados (inclusive os digitados à mão), PV e PM no máximo
 * efetivo e usos por dia dos poderes renovados. Sem tabela de descanso. Bônus Fixos não
 * mudam (não são buffs).
 */
export function newDay(c: Character): Character {
  const zeroed = zeroTemps(deactivateBuffsWhere(c, (b) => b.duration !== 'permanente'));
  const renewed: Character = {
    ...zeroed,
    abilities: (zeroed.abilities ?? []).map((a) => (a.usesPerDay ? { ...a, usesLeft: a.usesPerDay } : a)),
  };
  return applyHeal(applyHeal(renewed, Infinity, 'hp'), Infinity, 'mp');
}

/** Resumo do que `newDay` vai fazer — texto do modal de confirmação e do Histórico. */
export function describeNewDay(c: Character): {
  buffsOff: number;
  tempHp: number;
  tempMp: number;
  healHp: number;
  healMp: number;
} {
  const hp = getVital(c, 'hp');
  const mp = getVital(c, 'mp');
  return {
    buffsOff: (c.buffs ?? []).filter((b) => b.active && b.duration !== 'permanente').length,
    tempHp: hp.temp,
    tempMp: mp.temp,
    healHp: Math.max(0, hp.max - hp.current),
    healMp: Math.max(0, mp.max - mp.current),
  };
}

/* ───────────────────────── Redução de dano ───────────────────────── */

/** RD "Geral" (ou sem nome) vale contra qualquer tipo de dano. */
export function isGeneralRd(rd: DamageReduction): boolean {
  const key = normalizeSearch(rd.name ?? '');
  return key === '' || key === 'geral';
}

/**
 * Pré-seleção das RDs para um tipo de dano: Geral sempre; RD cujo nome contém o tipo
 * como palavra ("Frio e Ácido" casa "Ácido"); RD com valor ≤ 0 nunca. O jogador pode
 * ligar/desligar cada chip depois.
 */
export function applicableRds(rds: DamageReduction[], damageType?: string): boolean[] {
  const type = normalizeSearch(damageType ?? '');
  return rds.map((rd) => {
    if ((Number(rd.value) || 0) <= 0) return false;
    if (isGeneralRd(rd)) return true;
    if (!type) return false;
    const words = normalizeSearch(rd.name).split(/[^a-z0-9]+/).filter(Boolean);
    return words.includes(type);
  });
}

/** Decisão da mesa (26/08): as RDs SOMAM (o T20 oficial usaria só a maior). */
export function reduceDamage(amount: number, rds: DamageReduction[]): { rdTotal: number; net: number } {
  const rdTotal = rds.reduce((sum, rd) => sum + Math.max(0, Number(rd.value) || 0), 0);
  return { rdTotal, net: Math.max(0, positive(amount) - rdTotal) };
}

export interface DamageTakenInput {
  amount: number;
  damageType?: string;
  /** Uma flag por entrada de `character.damageReductions`, na mesma ordem. */
  selected: boolean[];
  ignoreRd?: boolean;
}

export interface DamageTakenResult {
  gross: number;
  rdApplied: DamageReduction[];
  rdTotal: number;
  net: number;
  split: DamageSplit;
  character: Character;
}

/** Dano recebido: bruto − RDs selecionadas (somadas) → líquido, consumido do temporário
 * primeiro. Devolve a prévia e o personagem resultante — a UI só renderiza isto. */
export function computeDamageTaken(c: Character, input: DamageTakenInput): DamageTakenResult {
  const rds = c.damageReductions ?? [];
  const rdApplied = input.ignoreRd ? [] : rds.filter((_, i) => input.selected[i]);
  const { rdTotal, net } = reduceDamage(input.amount, rdApplied);
  const { state, split } = damageVital(getVital(c, 'hp'), net);
  return { gross: positive(input.amount), rdApplied, rdTotal, net, split, character: setVital(c, 'hp', state) };
}
