import { describe, it, expect } from 'vitest';
import { migrateCalendarView } from './calendarView';

describe('migrateCalendarView', () => {
  it('cai em mês quando não há nada guardado', () => {
    expect(migrateCalendarView(null)).toBe('mes');
  });

  it('cai em mês quando o valor guardado é lixo', () => {
    expect(migrateCalendarView('qualquer-coisa')).toBe('mes');
    expect(migrateCalendarView('')).toBe('mes');
  });

  // Os dois valores antigos, de quando a aba só tinha grade semanal e lista.
  it('migra o valor antigo "agenda" para semana', () => {
    expect(migrateCalendarView('agenda')).toBe('semana');
  });

  it('migra o valor antigo "list" para lista', () => {
    expect(migrateCalendarView('list')).toBe('lista');
  });

  // O que a primeira versão errava: os valores NOVOS caíam no "qualquer outro
  // valor" e voltavam para mês, então escolher Semana ou Lista não persistia.
  it('preserva mes', () => {
    expect(migrateCalendarView('mes')).toBe('mes');
  });

  it('preserva semana', () => {
    expect(migrateCalendarView('semana')).toBe('semana');
  });

  it('preserva lista', () => {
    expect(migrateCalendarView('lista')).toBe('lista');
  });

  it('é idempotente: migrar duas vezes dá o mesmo resultado', () => {
    for (const entrada of [null, 'agenda', 'list', 'mes', 'semana', 'lista', 'lixo']) {
      const uma = migrateCalendarView(entrada);
      expect(migrateCalendarView(uma)).toBe(uma);
    }
  });
});
