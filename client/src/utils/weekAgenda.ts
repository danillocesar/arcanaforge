import type { Party, SessionProposal } from '../types/party';
import { getProposalStatus } from './sessionProposals';

/** Grade semanal da agenda de sessões: primitivas de data e montagem das células. */

/**
 * Interpreta 'YYYY-MM-DD' no fuso local. `new Date('2026-08-31')` seria lido
 * como UTC e voltaria um dia em fusos negativos, então o parse é manual.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/** Segunda-feira da semana que contém `date`, com as horas zeradas. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (start.getDay() + 6) % 7; // domingo (0) fica a 6 dias da segunda
  start.setDate(start.getDate() - shift);
  return start;
}

/** Os 7 dias da semana de `anchor`, de segunda a domingo. */
export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Hora cheia da proposta, ou null quando ela foi proposta sem horário. */
export function proposalHour(proposal: SessionProposal): number | null {
  if (!proposal.time) return null;
  const hour = Number(proposal.time.slice(0, 2));
  return Number.isNaN(hour) ? null : hour;
}

export function cellKey(dateKey: string, hour: number): string {
  return `${dateKey}T${hour}`;
}

export interface WeekGrid {
  /** Propostas com horário, por `cellKey(dia, hora)`. */
  timed: Map<string, SessionProposal[]>;
  /** Propostas sem horário, por dia. */
  allDay: Map<string, SessionProposal[]>;
}

/** Distribui as propostas da semana nas células da grade, descartando o resto. */
export function buildWeekGrid(proposals: SessionProposal[], weekDays: Date[]): WeekGrid {
  const daysInWeek = new Set(weekDays.map(toDateKey));
  const grid: WeekGrid = { timed: new Map(), allDay: new Map() };

  for (const proposal of proposals) {
    if (!daysInWeek.has(proposal.date)) continue;
    const hour = proposalHour(proposal);
    const bucket = hour == null ? grid.allDay : grid.timed;
    const key = hour == null ? proposal.date : cellKey(proposal.date, hour);
    const cell = bucket.get(key);
    if (cell) cell.push(proposal);
    else bucket.set(key, [proposal]);
  }

  for (const cell of grid.timed.values()) {
    cell.sort((a, b) => a.time.localeCompare(b.time) || a.createdAt.localeCompare(b.createdAt));
  }

  return grid;
}

export type ProposalTone = 'confirmed' | 'pending' | 'declined';

/**
 * Cor da proposta na grade. A recusa tem precedência sobre o voto pendente:
 * uma data que alguém já vetou não deve parecer só "à espera".
 */
export function proposalTone(party: Party, proposal: SessionProposal): ProposalTone {
  const status = getProposalStatus(party, proposal);
  if (status.declined.length > 0) return 'declined';
  return status.confirmed ? 'confirmed' : 'pending';
}

/** Hora em que a grade deve abrir: a proposta mais cedo da semana, ou o começo da noite. */
export function initialScrollHour(grid: WeekGrid, fallback = 18): number {
  let earliest: number | null = null;
  for (const cell of grid.timed.values()) {
    for (const proposal of cell) {
      const hour = proposalHour(proposal);
      if (hour != null && (earliest == null || hour < earliest)) earliest = hour;
    }
  }
  return earliest ?? fallback;
}

// Rótulos fixos em pt-BR: `Intl` varia entre versões de ICU (com e sem ponto
// nas abreviações), o que deixaria a grade instável entre ambientes.
export const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const WEEKDAY_FULL = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTH_FULL = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** Intervalo da semana, repetindo mês e ano só quando eles mudam. */
export function formatWeekRange(weekDays: Date[]): string {
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];
  const head = `${first.getDate()} ${MONTH_SHORT[first.getMonth()]}`;
  const tail = `${last.getDate()} ${MONTH_SHORT[last.getMonth()]} ${last.getFullYear()}`;

  if (first.getFullYear() !== last.getFullYear()) {
    return `${head} ${first.getFullYear()} – ${tail}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return `${head} – ${tail}`;
  }
  return `${first.getDate()} – ${tail}`;
}

export function formatProposalWhen(proposal: SessionProposal): string {
  const d = parseLocalDate(proposal.date);
  const when = `${WEEKDAY_FULL[d.getDay()]}, ${d.getDate()} de ${MONTH_FULL[d.getMonth()]} de ${d.getFullYear()}`;
  return proposal.time ? `${when} às ${proposal.time}` : when;
}
