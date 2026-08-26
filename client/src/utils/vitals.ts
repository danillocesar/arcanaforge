import type { Character } from '../types/character';
import { getEffectiveMaxHp, getEffectiveMaxMp } from './calculations';

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
