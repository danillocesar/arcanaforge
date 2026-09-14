/** Qual das três visões a aba Calendário mostra. */
export type CalendarView = 'mes' | 'semana' | 'lista';

const VALIDAS: readonly string[] = ['mes', 'semana', 'lista'];

/** Valores usados antes de a visão de mês existir, quando a aba só tinha a
 *  grade semanal e a lista. */
const ANTIGOS: Record<string, CalendarView> = {
  agenda: 'semana',
  list: 'lista',
};

/**
 * Resolve o que veio do localStorage para uma das três visões.
 *
 * A ordem importa: um valor JÁ VÁLIDO é devolvido intacto antes de qualquer
 * outra checagem. Sem essa primeira linha, `semana` e `lista` caem no "qualquer
 * outro valor" e voltam para `mes` — ou seja, escolher qualquer coisa que não
 * seja mês simplesmente não persiste.
 */
export function migrateCalendarView(stored: string | null): CalendarView {
  if (stored && VALIDAS.includes(stored)) return stored as CalendarView;
  if (stored && ANTIGOS[stored]) return ANTIGOS[stored];
  return 'mes';
}
