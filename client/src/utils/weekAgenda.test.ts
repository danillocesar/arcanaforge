import { describe, it, expect } from 'vitest';
import type { Party, SessionProposal } from '../types/party';
import {
  parseLocalDate,
  toDateKey,
  addDays,
  startOfWeek,
  getWeekDays,
  proposalHour,
  cellKey,
  buildWeekGrid,
  proposalTone,
  initialScrollHour,
  formatWeekRange,
  formatProposalWhen,
} from './weekAgenda';

describe('parseLocalDate', () => {
  it('interpreta YYYY-MM-DD no fuso local, sem deslocar o dia', () => {
    const d = parseLocalDate('2026-08-31');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(31);
  });
});

describe('toDateKey', () => {
  it('formata a data local como YYYY-MM-DD com zero à esquerda', () => {
    expect(toDateKey(new Date(2026, 8, 6))).toBe('2026-09-06');
  });

  it('faz round-trip com parseLocalDate', () => {
    expect(toDateKey(parseLocalDate('2026-01-01'))).toBe('2026-01-01');
  });
});

describe('addDays', () => {
  it('atravessa a virada de mês', () => {
    expect(toDateKey(addDays(parseLocalDate('2026-08-31'), 1))).toBe('2026-09-01');
  });

  it('aceita deslocamento negativo', () => {
    expect(toDateKey(addDays(parseLocalDate('2026-09-01'), -1))).toBe('2026-08-31');
  });

  it('não muta a data recebida', () => {
    const original = parseLocalDate('2026-08-31');
    addDays(original, 7);
    expect(toDateKey(original)).toBe('2026-08-31');
  });
});

describe('startOfWeek', () => {
  it('recua até a segunda-feira da semana', () => {
    // 2026-09-02 é quarta-feira
    expect(toDateKey(startOfWeek(parseLocalDate('2026-09-02')))).toBe('2026-08-31');
  });

  it('trata domingo como último dia da semana, não como primeiro', () => {
    // 2026-09-06 é domingo
    expect(toDateKey(startOfWeek(parseLocalDate('2026-09-06')))).toBe('2026-08-31');
  });

  it('devolve a própria data quando já é segunda-feira', () => {
    expect(toDateKey(startOfWeek(parseLocalDate('2026-08-31')))).toBe('2026-08-31');
  });

  it('zera as horas', () => {
    const d = parseLocalDate('2026-09-02');
    d.setHours(23, 45, 30, 500);
    const start = startOfWeek(d);
    expect([start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()]).toEqual([0, 0, 0, 0]);
  });
});

describe('getWeekDays', () => {
  it('devolve os 7 dias da semana, de segunda a domingo', () => {
    expect(getWeekDays(parseLocalDate('2026-09-02')).map(toDateKey)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
  });
});

function proposal(overrides: Partial<SessionProposal> = {}): SessionProposal {
  return {
    id: 'p1',
    proposedBy: 'owner1',
    date: '2026-09-02',
    time: '19:00',
    createdAt: '2026-08-20T10:00:00.000Z',
    responses: [],
    ...overrides,
  };
}

describe('proposalHour', () => {
  it('extrai a hora de HH:mm', () => {
    expect(proposalHour(proposal({ time: '19:30' }))).toBe(19);
  });

  it('lê a meia-noite como hora 0, não como ausência de horário', () => {
    expect(proposalHour(proposal({ time: '00:00' }))).toBe(0);
  });

  it('devolve null quando a proposta não tem horário', () => {
    expect(proposalHour(proposal({ time: '' }))).toBeNull();
  });
});

describe('cellKey', () => {
  it('combina dia e hora numa chave única', () => {
    expect(cellKey('2026-09-02', 19)).not.toBe(cellKey('2026-09-02', 1));
  });
});

describe('buildWeekGrid', () => {
  const week = getWeekDays(parseLocalDate('2026-09-02'));

  it('coloca a proposta com horário na célula do dia e da hora', () => {
    const p = proposal({ date: '2026-09-02', time: '19:00' });
    const grid = buildWeekGrid([p], week);
    expect(grid.timed.get(cellKey('2026-09-02', 19))).toEqual([p]);
  });

  it('coloca a proposta sem horário na faixa do dia inteiro', () => {
    const p = proposal({ time: '' });
    const grid = buildWeekGrid([p], week);
    expect(grid.allDay.get('2026-09-02')).toEqual([p]);
    expect(grid.timed.size).toBe(0);
  });

  it('ignora propostas fora da semana', () => {
    const grid = buildWeekGrid([proposal({ date: '2026-09-09' })], week);
    expect(grid.timed.size).toBe(0);
    expect(grid.allDay.size).toBe(0);
  });

  it('inclui os dois extremos da semana', () => {
    const grid = buildWeekGrid(
      [proposal({ id: 'seg', date: '2026-08-31' }), proposal({ id: 'dom', date: '2026-09-06' })],
      week,
    );
    expect(grid.timed.get(cellKey('2026-08-31', 19))?.[0].id).toBe('seg');
    expect(grid.timed.get(cellKey('2026-09-06', 19))?.[0].id).toBe('dom');
  });

  it('acumula propostas que caem na mesma célula, ordenadas por horário', () => {
    const grid = buildWeekGrid(
      [proposal({ id: 'depois', time: '19:45' }), proposal({ id: 'antes', time: '19:15' })],
      week,
    );
    expect(grid.timed.get(cellKey('2026-09-02', 19))?.map((p) => p.id)).toEqual(['antes', 'depois']);
  });
});

function party(overrides: Partial<Party> = {}): Party {
  return {
    id: 'party1',
    name: 'Grupo Teste',
    system: 'tormenta',
    inviteCode: 'ABC123',
    ownerUid: 'owner1',
    ownerEmail: 'owner@test.com',
    members: [
      { uid: 'owner1', email: 'owner@test.com', characterIds: [], joinedAt: '2026-01-01' },
      { uid: 'player2', email: 'player2@test.com', characterIds: [], joinedAt: '2026-01-01' },
    ],
    sessionProposals: [],
    ...overrides,
  };
}

function vote(uid: string, v: 'sim' | 'nao') {
  return { uid, vote: v, respondedAt: '2026-08-21T10:00:00.000Z' };
}

describe('proposalTone', () => {
  it('fica confirmado quando todos os membros votaram sim', () => {
    const p = proposal({ responses: [vote('owner1', 'sim'), vote('player2', 'sim')] });
    expect(proposalTone(party(), p)).toBe('confirmed');
  });

  it('fica pendente enquanto falta alguém votar', () => {
    const p = proposal({ responses: [vote('owner1', 'sim')] });
    expect(proposalTone(party(), p)).toBe('pending');
  });

  it('fica recusado quando alguém votou não', () => {
    const p = proposal({ responses: [vote('owner1', 'sim'), vote('player2', 'nao')] });
    expect(proposalTone(party(), p)).toBe('declined');
  });

  it('dá precedência à recusa sobre o voto pendente', () => {
    const three = party({
      members: [
        ...party().members,
        { uid: 'player3', email: 'p3@test.com', characterIds: [], joinedAt: '2026-01-01' },
      ],
    });
    const p = proposal({ responses: [vote('owner1', 'sim'), vote('player2', 'nao')] });
    expect(proposalTone(three, p)).toBe('declined');
  });
});

describe('initialScrollHour', () => {
  const week = getWeekDays(parseLocalDate('2026-09-02'));

  it('usa a hora mais cedo entre as propostas da semana', () => {
    const grid = buildWeekGrid(
      [proposal({ id: 'a', time: '21:00' }), proposal({ id: 'b', time: '15:00' })],
      week,
    );
    expect(initialScrollHour(grid)).toBe(15);
  });

  it('cai no início da noite quando a semana não tem proposta com horário', () => {
    expect(initialScrollHour(buildWeekGrid([], week))).toBe(18);
  });

  it('ignora as propostas sem horário', () => {
    const grid = buildWeekGrid([proposal({ time: '' })], week);
    expect(initialScrollHour(grid)).toBe(18);
  });
});

describe('formatWeekRange', () => {
  it('não repete o mês quando a semana inteira cai no mesmo mês', () => {
    expect(formatWeekRange(getWeekDays(parseLocalDate('2026-09-09')))).toBe('7 – 13 set 2026');
  });

  it('mostra os dois meses quando a semana vira o mês', () => {
    expect(formatWeekRange(getWeekDays(parseLocalDate('2026-09-02')))).toBe('31 ago – 6 set 2026');
  });

  it('mostra os dois anos quando a semana vira o ano', () => {
    expect(formatWeekRange(getWeekDays(parseLocalDate('2026-12-31')))).toBe('28 dez 2026 – 3 jan 2027');
  });
});

describe('formatProposalWhen', () => {
  it('escreve dia da semana, data e horário', () => {
    expect(formatProposalWhen(proposal({ date: '2026-09-02', time: '19:30' }))).toBe(
      'quarta-feira, 2 de setembro de 2026 às 19:30',
    );
  });

  it('omite o horário quando a proposta não tem um', () => {
    expect(formatProposalWhen(proposal({ date: '2026-09-02', time: '' }))).toBe(
      'quarta-feira, 2 de setembro de 2026',
    );
  });
});
