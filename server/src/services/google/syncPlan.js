/**
 * Confirmada = todo membro do grupo votou 'sim'. Mesma regra do
 * getProposalStatus do cliente, reimplementada aqui porque o server não
 * compartilha código com o client.
 */
function isConfirmed(party, proposal) {
  const membros = party.members || [];
  if (membros.length === 0) return false;
  const respostas = proposal.responses || [];
  return membros.every((m) => respostas.some((r) => r.uid === m.uid && r.vote === 'sim'));
}

/**
 * Decide, sem tocar em rede, o que criar e o que apagar.
 * `toDelete` sai de `existingEvents` (e não dos membros atuais) porque o evento
 * precisa ser removido mesmo de quem perdeu o vínculo no meio do caminho.
 */
function planSync({ prevConfirmed, nextConfirmed, proposalRemoved, healthyUids, existingEvents }) {
  const eventos = existingEvents || [];

  if (proposalRemoved || (prevConfirmed && !nextConfirmed)) {
    return { toCreate: [], toDelete: eventos.map(({ uid, eventId, calendarId }) => ({ uid, eventId, calendarId })) };
  }

  if (!prevConfirmed && nextConfirmed) {
    const jaTem = new Set(eventos.map((e) => e.uid));
    // De-duplica healthyUids e preserva ordem de primeira ocorrência
    const seen = new Set();
    const unique = [];
    for (const uid of (healthyUids || [])) {
      if (!seen.has(uid)) {
        seen.add(uid);
        if (!jaTem.has(uid)) {
          unique.push(uid);
        }
      }
    }
    return { toCreate: unique, toDelete: [] };
  }

  return { toCreate: [], toDelete: [] };
}

module.exports = { isConfirmed, planSync };
