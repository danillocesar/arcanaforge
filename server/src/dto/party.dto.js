/**
 * Retorno de party para o cliente.
 * Mapeia _id → id (convenção já existente via toPartyJson).
 *
 * `viewerUid` é quem está pedindo: `googleEvents` de cada proposta é filtrado
 * para a entrada dessa pessoa e só dela. Mandar a lista crua contava para todos
 * os membros quem ligou a Google Agenda, mais o `calendarId` e o `eventId` de
 * cada um — e a spec §6 diz o oposto: "o estado de link de cada um não é
 * informação que os demais precisem ver". O cliente já mostrava só a própria
 * entrada; era o fio que carregava todas. Sem `viewerUid` a lista sai vazia (o
 * lado seguro).
 *
 * Campos não usados no frontend (confirmado por análise):
 * - ownerEmail: declarado no tipo mas nenhum componente o lê
 * - members[].joinedAt: só no tipo, nenhum componente exibe
 */
function toPartyDTO(doc, viewerUid) {
  const { _id, __v, createdAt, updatedAt, ownerEmail, ...rest } = doc;

  const members = (rest.members || []).map(({ uid, email, characterIds }) => ({
    uid,
    email,
    characterIds: characterIds || [],
  }));

  const sessionProposals = (rest.sessionProposals || []).map((proposal) => ({
    ...proposal,
    googleEvents: (proposal.googleEvents || []).filter((e) => e.uid === viewerUid),
  }));

  return {
    id: String(_id),
    ...rest,
    members,
    sessionProposals,
  };
}

/**
 * Personagem dentro de uma party (visão de combate/roster).
 * Expõe apenas os campos necessários para o CombatContext e PlayerCard.
 */
function toPartyCharacterDTO(doc) {
  return {
    _id: doc._id,
    name: doc.name ?? '',
    avatar: doc.avatar ?? '',
    classes: doc.classes ?? [],
    system: doc.system ?? 'tormenta',
    ownerUid: doc.ownerUid ?? '',
    hp: doc.hp ?? null,
    mp: doc.mp ?? null,
    // Sobrevida e RDs: o mestre mostra o temporário e aplica dano descontando as RDs do alvo.
    temporaryHp: Number(doc.temporaryHp) || 0,
    temporaryMp: Number(doc.temporaryMp) || 0,
    damageReductions: Array.isArray(doc.damageReductions) ? doc.damageReductions : [],
  };
}

module.exports = { toPartyDTO, toPartyCharacterDTO };
