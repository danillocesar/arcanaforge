/** Grade mensal da agenda de sessões: navegação por mês e agrupamento por dia.
 *  As primitivas de data (parse local, chave, soma de dias) vêm do weekAgenda,
 *  que é o kit de datas da agenda inteira apesar do nome. */
import type { SessionProposal } from '../types/party';
import { addDays, MONTH_FULL, startOfWeek, toDateKey } from './weekAgenda';

/** Seis semanas: a grade tem altura fixa e não pula quando o mês vira. */
const WEEKS_IN_GRID = 6;
const DAYS_IN_GRID = WEEKS_IN_GRID * 7;

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Navegação de mês. Normaliza para o dia 1 antes de somar porque a aritmética
 * ingênua transborda: 31 de janeiro mais um mês cairia em março, já que
 * fevereiro não tem dia 31. Para um navegador de mês só o mês importa.
 */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function isSameMonth(date: Date, anchor: Date): boolean {
  return date.getFullYear() === anchor.getFullYear() && date.getMonth() === anchor.getMonth();
}

/** Os 42 dias da grade do mês de `anchor`, começando na segunda-feira. */
export function getMonthGrid(anchor: Date): Date[] {
  const primeiro = startOfWeek(startOfMonth(anchor));
  return Array.from({ length: DAYS_IN_GRID }, (_, i) => addDays(primeiro, i));
}

/**
 * Propostas por dia da grade. Sem horário vem antes das com horário — é a
 * ordem que o Google Agenda usa para evento de dia inteiro, e evita que uma
 * sessão sem hora se perca no meio da lista.
 */
export function buildMonthGrid(
  proposals: SessionProposal[],
  days: Date[],
): Map<string, SessionProposal[]> {
  const naGrade = new Set(days.map(toDateKey));
  const porDia = new Map<string, SessionProposal[]>();

  for (const proposal of proposals) {
    if (!naGrade.has(proposal.date)) continue;
    const doDia = porDia.get(proposal.date);
    if (doDia) doDia.push(proposal);
    else porDia.set(proposal.date, [proposal]);
  }

  for (const doDia of porDia.values()) {
    doDia.sort((a, b) => {
      if (!a.time && b.time) return -1;
      if (a.time && !b.time) return 1;
      return a.time.localeCompare(b.time) || a.createdAt.localeCompare(b.createdAt);
    });
  }

  return porDia;
}

export function formatMonthLabel(anchor: Date): string {
  return `${MONTH_FULL[anchor.getMonth()]} ${anchor.getFullYear()}`;
}
