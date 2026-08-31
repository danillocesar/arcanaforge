const partyRepository = require('../../repositories/party.repository');
const repo = require('../../repositories/googleLink.repository');
const googleApi = require('./googleApi');
const googleLinkService = require('./googleLink.service');
const { buildEventBody } = require('./eventBody');
const { isConfirmed, planSync } = require('./syncPlan');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function calendarUrl(party) {
  return `${CLIENT_URL}/${party.system || 'tormenta'}/party/${party._id}/calendar`;
}

/** Persiste a lista de eventos da proposta. Via repository: no repo, service
 *  nunca requer model direto. */
async function saveEvents(partyId, proposalId, googleEvents) {
  await partyRepository.updateProposalGoogleEvents(partyId, proposalId, googleEvents);
}

async function criarPara(uid, party, proposal) {
  const token = await googleLinkService.getAccessTokenFor(uid);
  if (!token) return null;
  const body = buildEventBody({
    partyName: party.name,
    proposal,
    calendarUrl: calendarUrl(party),
    defaultTimezone: googleLinkService.defaultTimezone(),
  });
  try {
    const eventId = await googleApi.insertEvent(token.accessToken, token.calendarId, body);
    return { uid, eventId, calendarId: token.calendarId, createdAt: new Date() };
  } catch (err) {
    if (err instanceof googleApi.GoogleAuthError) {
      await repo.setLastError(uid, err.message);
      return null;
    }
    throw err;
  }
}

async function apagarPara({ uid, eventId, calendarId }) {
  const token = await googleLinkService.getAccessTokenFor(uid);
  if (!token) return;
  try {
    await googleApi.deleteEvent(token.accessToken, calendarId, eventId);
  } catch (err) {
    if (err instanceof googleApi.GoogleAuthError) {
      await repo.setLastError(uid, err.message);
      return;
    }
    throw err;
  }
}

/**
 * Efeito colateral de votar/cancelar. Nunca lança: votar não pode falhar porque
 * o Google está fora do ar. Cada membro é independente — allSettled garante que
 * a falha de um não impeça os outros.
 */
async function syncProposal({ party, proposal, prevConfirmed, proposalRemoved, eventsBefore }) {
  try {
    if (!googleLinkService.isEnabled()) return;

    const uids = (party.members || []).map((m) => m.uid);
    const saudaveis = await repo.findHealthyByUids(uids);
    const healthyUids = saudaveis.map((l) => l._id);

    const plano = planSync({
      prevConfirmed,
      nextConfirmed: proposalRemoved ? prevConfirmed : isConfirmed(party, proposal),
      proposalRemoved,
      healthyUids,
      existingEvents: eventsBefore || [],
    });

    if (plano.toDelete.length > 0) {
      await Promise.allSettled(plano.toDelete.map(apagarPara));
      if (!proposalRemoved) await saveEvents(party._id, proposal.id, []);
      return;
    }

    if (plano.toCreate.length === 0) return;

    const resultados = await Promise.allSettled(
      plano.toCreate.map((uid) => criarPara(uid, party, proposal)),
    );
    const criados = resultados
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value);

    if (criados.length > 0) {
      await saveEvents(party._id, proposal.id, [...(eventsBefore || []), ...criados]);
    }
  } catch (err) {
    console.error('Falha ao sincronizar Google Agenda:', err.message);
  }
}

module.exports = { syncProposal };
