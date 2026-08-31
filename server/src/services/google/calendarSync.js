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

/**
 * Cria o evento de um membro e grava a referência dele na hora, por uid.
 *
 * Gravar aqui, e não numa escrita única no fim, é o que impede a corrida:
 * montar a lista em memória e gravá-la de uma vez partia sempre de um snapshot
 * lido no começo da requisição, e dois votos sobrepostos apagavam as
 * referências um do outro — eventos de verdade na agenda das pessoas que o app
 * nunca mais conseguiria apagar.
 *
 * Só criação confirmada é gravada: se `insertEvent` falha, nada é persistido.
 * `buildEventBody` fica fora do `try` de propósito — validação inválida lança
 * antes de qualquer chamada ao Google, e nada é gravado.
 */
async function criarPara(uid, party, proposal) {
  const token = await googleLinkService.getAccessTokenFor(uid);
  if (!token) return;
  const body = buildEventBody({
    partyName: party.name,
    proposal,
    calendarUrl: calendarUrl(party),
    defaultTimezone: googleLinkService.defaultTimezone(),
  });
  let eventId;
  try {
    eventId = await googleApi.insertEvent(token.accessToken, token.calendarId, body);
  } catch (err) {
    if (err instanceof googleApi.GoogleAuthError) {
      await repo.setLastError(uid, err.message);
      return;
    }
    throw err;
  }
  await partyRepository.addProposalGoogleEvent(party._id, proposal.id, {
    uid,
    eventId,
    calendarId: token.calendarId,
    createdAt: new Date(),
  });
}

/**
 * Apaga o evento de um membro e, **só se a remoção foi confirmada**, tira a
 * referência dele da proposta.
 *
 * Confirmada = `deleteEvent` retornou sem lançar (inclui "já não existia", que
 * `googleApi.deleteEvent` trata como sucesso). Quando não dá pra confirmar —
 * sem token utilizável, credencial quebrada, ou erro transiente — a referência
 * **fica**: o evento pode continuar de verdade na agenda da pessoa, e apagar o
 * registro apagaria o único jeito de tentar de novo depois. O erro transiente é
 * relançado para virar `rejected` no `allSettled` do chamador e ir para o log.
 *
 * `proposalRemoved` = a proposta já saiu do documento (cancelamento): não há
 * onde gravar, e não se escreve nada.
 */
async function apagarPara({ uid, eventId, calendarId }, { party, proposal, proposalRemoved }) {
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
  if (!proposalRemoved) {
    await partyRepository.removeProposalGoogleEvent(party._id, proposal.id, uid);
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
      // Cada membro é independente: quem falha mantém a própria referência e
      // não impede os outros de sair da lista.
      const resultadosDelete = await Promise.allSettled(
        plano.toDelete.map((alvo) => apagarPara(alvo, { party, proposal, proposalRemoved })),
      );
      resultadosDelete.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(
            `Falha ao apagar evento do Google Agenda (party=${party._id} proposal=${proposal.id} uid=${plano.toDelete[i].uid}):`,
            r.reason,
          );
        }
      });
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
  } catch (err) {
    // Loga o objeto de erro inteiro (com stack), não só a mensagem: aqui é o
    // único lugar onde um bug de programação neste caminho fire-and-forget
    // deixa rastro.
    console.error('Falha ao sincronizar Google Agenda:', err);
  }
}

module.exports = { syncProposal, calendarUrl };
