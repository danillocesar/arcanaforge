const partyRepository = require('../../repositories/party.repository');
const { isConfirmed } = require('./syncPlan');
const { syncProposal } = require('./calendarSync');
const googleLinkService = require('./googleLink.service');

/**
 * Propostas que devem gerar evento para quem acabou de ligar a conta:
 * confirmadas, de hoje em diante, e sem evento ainda para aquele uid.
 * Passadas são ignoradas — encher a agenda de sessões que já aconteceram é ruído.
 */
function selectBackfillTargets({ parties, uid, today }) {
  const alvos = [];
  for (const party of parties || []) {
    for (const proposal of party.sessionProposals || []) {
      if (proposal.date < today) continue;
      if (!isConfirmed(party, proposal)) continue;
      if ((proposal.googleEvents || []).some((e) => e.uid === uid)) continue;
      alvos.push({ party, proposal });
    }
  }
  return alvos;
}

/**
 * Data de "hoje" no fuso informado, não no fuso do processo. Containers
 * costumam rodar em UTC; às 22h em São Paulo (UTC-3) já é o dia seguinte em
 * UTC, e usar getFullYear()/getMonth()/getDate() sem fuso faria uma sessão
 * de hoje à noite ser descartada como "passado" nas últimas horas do dia.
 * `now` é injetável para o teste ser determinístico (não depender da hora
 * em que a suíte roda).
 */
function todayKey(timeZone, now = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t) => partes.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Nunca lança: é efeito colateral do callback do OAuth. */
async function backfillForUid(uid) {
  try {
    // findVisibleToUser ja devolve lean as parties em que o uid e dono ou membro.
    const parties = await partyRepository.findVisibleToUser(uid);
    const today = todayKey(googleLinkService.defaultTimezone());
    const alvos = selectBackfillTargets({ parties, uid, today });
    for (const { party, proposal } of alvos) {
      // prevConfirmed=false força o caminho de criação para este uid; a
      // idempotência por uid impede duplicar o evento dos outros membros.
      await syncProposal({
        party,
        proposal,
        prevConfirmed: false,
        proposalRemoved: false,
        eventsBefore: proposal.googleEvents || [],
      });
    }
  } catch (err) {
    console.error('Falha no backfill do Google Agenda:', err.message);
  }
}

module.exports = { selectBackfillTargets, backfillForUid, todayKey };
