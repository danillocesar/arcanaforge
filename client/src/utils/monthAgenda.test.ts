import { describe, it, expect } from 'vitest';
import type { SessionProposal } from '../types/party';
import { parseLocalDate, toDateKey } from './weekAgenda';
import {
  startOfMonth,
  addMonths,
  getMonthGrid,
  isSameMonth,
  buildMonthGrid,
  formatMonthLabel,
} from './monthAgenda';

function proposal(overrides: Partial<SessionProposal> = {}): SessionProposal {
  return {
    id: 'p1',
    proposedBy: 'owner1',
    date: '2026-08-12',
    time: '19:00',
    createdAt: '2026-08-01T10:00:00.000Z',
    responses: [],
    ...overrides,
  };
}

describe('startOfMonth', () => {
  it('volta para o dia 1 com as horas zeradas', () => {
    const d = parseLocalDate('2026-08-15');
    d.setHours(23, 45, 30, 500);
    const inicio = startOfMonth(d);
    expect(toDateKey(inicio)).toBe('2026-08-01');
    expect([inicio.getHours(), inicio.getMinutes(), inicio.getSeconds()]).toEqual([0, 0, 0]);
  });
});

describe('addMonths', () => {
  it('avança um mês', () => {
    expect(toDateKey(addMonths(parseLocalDate('2026-08-15'), 1))).toBe('2026-09-01');
  });

  it('volta um mês', () => {
    expect(toDateKey(addMonths(parseLocalDate('2026-08-15'), -1))).toBe('2026-07-01');
  });

  it('atravessa a virada de ano para frente', () => {
    expect(toDateKey(addMonths(parseLocalDate('2026-12-10'), 1))).toBe('2027-01-01');
  });

  it('atravessa a virada de ano para trás', () => {
    expect(toDateKey(addMonths(parseLocalDate('2026-01-10'), -1))).toBe('2025-12-01');
  });

  // O caso que quebra a aritmética ingênua: 31 de janeiro + 1 mês em JS puro
  // cairia em 2 ou 3 de março, porque fevereiro não tem dia 31. Normalizar
  // para o dia 1 antes de somar elimina a classe inteira de erro.
  it('não transborda a partir de um dia 31', () => {
    expect(toDateKey(addMonths(parseLocalDate('2026-01-31'), 1))).toBe('2026-02-01');
  });

  it('não muta a data recebida', () => {
    const original = parseLocalDate('2026-08-15');
    addMonths(original, 3);
    expect(toDateKey(original)).toBe('2026-08-15');
  });
});

describe('getMonthGrid', () => {
  it('devolve sempre 42 dias, para a altura da grade não pular entre meses', () => {
    expect(getMonthGrid(parseLocalDate('2026-08-15'))).toHaveLength(42);
    expect(getMonthGrid(parseLocalDate('2026-02-10'))).toHaveLength(42);
  });

  it('começa na segunda-feira anterior ao dia 1', () => {
    // 2026-08-01 é sábado; a segunda anterior é 2026-07-27.
    const grade = getMonthGrid(parseLocalDate('2026-08-15'));
    expect(toDateKey(grade[0])).toBe('2026-07-27');
    expect(toDateKey(grade[41])).toBe('2026-09-06');
  });

  it('começa no próprio dia 1 quando o mês já começa numa segunda', () => {
    // 2026-06-01 é segunda-feira.
    expect(toDateKey(getMonthGrid(parseLocalDate('2026-06-20'))[0])).toBe('2026-06-01');
  });

  it('cobre o mês inteiro, do dia 1 ao último', () => {
    const chaves = getMonthGrid(parseLocalDate('2026-08-15')).map(toDateKey);
    expect(chaves).toContain('2026-08-01');
    expect(chaves).toContain('2026-08-31');
  });

  it('devolve dias consecutivos, sem buraco', () => {
    const grade = getMonthGrid(parseLocalDate('2026-08-15'));
    for (let i = 1; i < grade.length; i++) {
      const diff = grade[i].getTime() - grade[i - 1].getTime();
      expect(Math.round(diff / 86400000)).toBe(1);
    }
  });
});

describe('isSameMonth', () => {
  it('reconhece um dia do próprio mês', () => {
    expect(isSameMonth(parseLocalDate('2026-08-31'), parseLocalDate('2026-08-01'))).toBe(true);
  });

  it('rejeita o mês vizinho', () => {
    expect(isSameMonth(parseLocalDate('2026-07-31'), parseLocalDate('2026-08-01'))).toBe(false);
  });

  it('rejeita o mesmo mês de outro ano', () => {
    expect(isSameMonth(parseLocalDate('2025-08-15'), parseLocalDate('2026-08-01'))).toBe(false);
  });
});

describe('buildMonthGrid', () => {
  const grade = getMonthGrid(parseLocalDate('2026-08-15'));

  it('agrupa a proposta no dia dela', () => {
    const p = proposal({ date: '2026-08-12' });
    expect(buildMonthGrid([p], grade).get('2026-08-12')).toEqual([p]);
  });

  it('inclui os dias vizinhos que aparecem na grade', () => {
    const p = proposal({ date: '2026-07-28' });
    expect(buildMonthGrid([p], grade).get('2026-07-28')).toEqual([p]);
  });

  it('ignora proposta fora da grade', () => {
    expect(buildMonthGrid([proposal({ date: '2026-10-01' })], grade).size).toBe(0);
  });

  it('ordena por horário dentro do dia', () => {
    const tarde = proposal({ id: 'tarde', date: '2026-08-12', time: '21:00' });
    const cedo = proposal({ id: 'cedo', date: '2026-08-12', time: '15:00' });
    expect(buildMonthGrid([tarde, cedo], grade).get('2026-08-12')?.map((p) => p.id)).toEqual([
      'cedo',
      'tarde',
    ]);
  });

  it('põe a proposta sem horário antes das com horário', () => {
    const comHora = proposal({ id: 'com', date: '2026-08-12', time: '15:00' });
    const semHora = proposal({ id: 'sem', date: '2026-08-12', time: '' });
    expect(buildMonthGrid([comHora, semHora], grade).get('2026-08-12')?.map((p) => p.id)).toEqual([
      'sem',
      'com',
    ]);
  });
});

describe('formatMonthLabel', () => {
  it('escreve mês por extenso e ano', () => {
    expect(formatMonthLabel(parseLocalDate('2026-08-15'))).toBe('agosto 2026');
  });

  it('funciona na virada de ano', () => {
    expect(formatMonthLabel(parseLocalDate('2027-01-02'))).toBe('janeiro 2027');
  });
});
