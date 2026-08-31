const partyRepository = require('../../repositories/party.repository');
const { isConfirmed } = require('./syncPlan');
const { syncProposal } = require('./calendarSync');

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

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Nunca lança: é efeito colateral do callback do OAuth. */
async function backfillForUid(uid) {
  try {
    // findVisibleToUser ja devolve lean as parties em que o uid e dono ou membro.
    const parties = await partyRepository.findVisibleToUser(uid);
    const alvos = selectBackfillTargets({ parties, uid, today: todayKey() });
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

module.exports = { selectBackfillTargets, backfillForUid };
