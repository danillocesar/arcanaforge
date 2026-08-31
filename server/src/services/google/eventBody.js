// Não existe campo de duração na proposta; 4h é a duração típica de uma sessão
// de mesa. Trocar aqui muda todos os eventos futuros.
const SESSION_DURATION_HOURS = 4;

/** 'YYYY-MM-DD' + dias, em aritmética de calendário local (sem fuso). */
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Soma horas a date+time, devolvendo 'YYYY-MM-DDTHH:mm:00' sem fuso. */
function addHours(dateStr, timeStr, hours) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm));
  dt.setUTCHours(dt.getUTCHours() + hours);
  return `${dt.toISOString().slice(0, 16)}:00`;
}

/**
 * Corpo do evento do Google. Sem `attendees` e sem `organizer`: cada evento é um
 * compromisso próprio na agenda de uma pessoa, e o app nunca convida ninguém.
 * O `timeZone` é o da proposta (não o de cada membro) porque é ele que fixa o
 * instante absoluto — o Google já exibe no fuso local de quem olha.
 */
function buildEventBody({ partyName, proposal, calendarUrl, defaultTimezone }) {
  // Validação: data deve estar em formato YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(proposal.date)) {
    throw new Error(`Data inválida: ${proposal.date}`);
  }

  const body = {
    summary: `Sessão: ${partyName}`,
    description: `Confirmada no ArcanaForge: ${calendarUrl}`,
  };

  if (proposal.time) {
    // Validação: horário deve estar em formato HH:mm com horas 00-23 e minutos 00-59
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(proposal.time)) {
      throw new Error(`Horário inválido: ${proposal.time}`);
    }

    const timeZone = proposal.timezone || defaultTimezone;
    body.start = { dateTime: `${proposal.date}T${proposal.time}:00`, timeZone };
    body.end = {
      dateTime: addHours(proposal.date, proposal.time, SESSION_DURATION_HOURS),
      timeZone,
    };
  } else {
    // Fim exclusivo na API do Google: mesma data criaria evento de duração zero.
    body.start = { date: proposal.date };
    body.end = { date: addDays(proposal.date, 1) };
  }

  return body;
}

module.exports = { buildEventBody, SESSION_DURATION_HOURS };
