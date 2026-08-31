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

/**
 * Apaga um evento e devolve se ele está confirmadamente fora do Google:
 * `true` quando `deleteEvent` teve sucesso (inclui "já não existia", que
 * `googleApi.deleteEvent` já trata como sucesso). `false` quando não dá pra
 * confirmar a remoção — sem token utilizável, ou credencial quebrada — casos
 * em que o evento real pode continuar na agenda da pessoa. Um erro transiente
 * é relançado para virar `rejected` no `allSettled` do chamador: nesses dois
 * casos (`false` ou rejeitado) o chamador preserva a referência, porque não
 * apagar o registro do evento que ainda existe de verdade é a única forma de
 * não perder o único jeito de tentar apagá-lo de novo depois.
 */
async function apagarPara({ uid, eventId, calendarId }) {
  const token = await googleLinkService.getAccessTokenFor(uid);
  if (!token) return false;
  try {
    await googleApi.deleteEvent(token.accessToken, calendarId, eventId);
    return true;
  } catch (err) {
    if (err instanceof googleApi.GoogleAuthError) {
      await repo.setLastError(uid, err.message);
      return false;
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
      const resultadosDelete = await Promise.allSettled(plano.toDelete.map(apagarPara));
      // Só sai da lista quem foi confirmadamente apagado. Rejeitado (erro
      // transiente) ou `false` (sem token, ou credencial quebrada) significa
      // que o evento pode continuar de verdade na agenda da pessoa — apagar
      // essa referência apagaria o único jeito de tentar de novo depois.
      const idsConfirmados = new Set();
      resultadosDelete.forEach((r, i) => {
        const alvo = plano.toDelete[i];
        if (r.status === 'fulfilled' && r.value === true) {
          idsConfirmados.add(alvo.uid);
        } else if (r.status === 'rejected') {
          console.error(
            `Falha ao apagar evento do Google Agenda (party=${party._id} proposal=${proposal.id} uid=${alvo.uid}):`,
            r.reason,
          );
        }
      });
      if (!proposalRemoved) {
        const sobreviventes = (eventsBefore || []).filter((e) => !idsConfirmados.has(e.uid));
        await saveEvents(party._id, proposal.id, sobreviventes);
      }
      return;
    }

    if (plano.toCreate.length === 0) return;

    const resultados = await Promise.allSettled(
      plano.toCreate.map((uid) => criarPara(uid, party, proposal)),
    );
    resultados.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(
          `Falha ao criar evento no Google Agenda (party=${party._id} proposal=${proposal.id} uid=${plano.toCreate[i]}):`,
          r.reason,
        );
      }
    });
    const criados = resultados
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value);

    if (criados.length > 0) {
      await saveEvents(party._id, proposal.id, [...(eventsBefore || []), ...criados]);
    }
  } catch (err) {
    // Loga o objeto de erro inteiro (com stack), não só a mensagem: aqui é o
    // único lugar onde um bug de programação neste caminho fire-and-forget
    // deixa rastro.
    console.error('Falha ao sincronizar Google Agenda:', err);
  }
}

module.exports = { syncProposal, calendarUrl };
