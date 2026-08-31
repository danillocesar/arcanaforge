const { ownerFieldsFromReq } = require('../../characters/userCharactersDir');
const { AppError } = require('../errors/AppError');
const { toPartyDTO, toPartyCharacterDTO } = require('../dto/party.dto');
const { toCharacterDetailDTO } = require('../dto/character.dto');
const { generatePartyId, generateInviteCode } = require('../utils/inviteCode');
const partyRepository = require('../repositories/party.repository');
const characterRepository = require('../repositories/character.repository');
const characterContentRepository = require('../repositories/characterContent.repository');
const characterLogsRepository = require('../repositories/characterLogs.repository');
const combatRepository = require('../repositories/combat.repository');
const { mergeCharacterDocs } = require('./character.service');
const { sendSessionProposalEmail } = require('./email.service');
const { mergeBuffIntoCharacter, isTempHpType, isTempMpType } = require('../utils/buffMerge');

const VALID_SYSTEMS = ['tormenta'];

async function uniqueInviteCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const exists = await partyRepository.existsInviteCode(code);
    if (!exists) return code;
  }
  return generateInviteCode() + generateInviteCode().slice(0, 2);
}

function createPartyService(refs) {
  async function listParties(uid) {
    const docs = await partyRepository.findVisibleToUser(uid);
    return docs.map(toPartyDTO);
  }

  async function createParty(body, req) {
    const { name, system } = body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError(400, '"name" field is required');
    }
    if (system && !VALID_SYSTEMS.includes(system)) {
      throw new AppError(400, 'Invalid system');
    }
    const owners = ownerFieldsFromReq(req);
    const party = await partyRepository.createParty({
      _id: generatePartyId(),
      name: name.trim(),
      system: system || 'tormenta',
      inviteCode: await uniqueInviteCode(),
      members: [{
        uid: req.user.uid,
        email: owners.ownerEmail,
        characterIds: [],
        joinedAt: new Date(),
      }],
      ...owners,
    });
    return toPartyDTO(party.toObject());
  }

  async function updateParty(id, body, uid) {
    const { name, system } = body || {};
    const update = {};
    if (name && typeof name === 'string') update.name = name.trim();
    if (system && !VALID_SYSTEMS.includes(system)) throw new AppError(400, 'Invalid system');
    if (system) update.system = system;
    const party = await partyRepository.updateOwnedParty(id, uid, update);
    if (!party) throw new AppError(404, 'Party not found');
    return toPartyDTO(party);
  }

  async function deleteParty(id, uid) {
    await partyRepository.deleteOwnedParty(id, uid);
    await combatRepository.deleteCombat(id);
    return { ok: true };
  }

  async function joinParty(body, req) {
    const { code } = body || {};
    if (!code || typeof code !== 'string') {
      throw new AppError(400, 'Código de convite é obrigatório');
    }
    const party = await partyRepository.findByInviteCode(code.toUpperCase().trim());
    if (!party) throw new AppError(404, 'Código inválido ou expirado');

    const alreadyMember = party.members.some((m) => m.uid === req.user.uid);
    if (!alreadyMember) {
      party.members.push({
        uid: req.user.uid,
        email: req.user.email ? String(req.user.email).trim().toLowerCase() : '',
        characterIds: [],
        joinedAt: new Date(),
      });
      await party.save();
      refs.broadcastPartyRoster(String(party._id));
    }
    return toPartyDTO(party.toObject());
  }

  async function addCharacterToParty(id, body, uid) {
    const { characterId } = body || {};
    if (!characterId || typeof characterId !== 'string') {
      throw new AppError(400, 'characterId é obrigatório');
    }

    const character = await characterRepository.findOwnedCharacterById(characterId, uid);
    if (!character) {
      throw new AppError(403, 'Personagem não encontrado ou não pertence a você');
    }

    const party = await partyRepository.findMemberParty(id, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');
    if (party.system !== character.system) {
      throw new AppError(400, 'Personagem deve ser do mesmo sistema da party');
    }

    const member = party.members.find((m) => m.uid === uid);
    if (member) {
      if (!member.characterIds) member.characterIds = [];
      if (!member.characterIds.includes(characterId)) {
        member.characterIds.push(characterId);
        await party.save();
        refs.broadcastPartyRoster(id);
      }
    }
    return toPartyDTO(party.toObject());
  }

  async function removeCharacterFromParty(id, body, uid) {
    const { characterId } = body || {};
    if (!characterId || typeof characterId !== 'string') {
      throw new AppError(400, 'characterId é obrigatório');
    }
    const party = await partyRepository.findMemberParty(id, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

    const member = party.members.find((m) => m.uid === uid);
    if (member && member.characterIds) {
      member.characterIds = member.characterIds.filter((cid) => cid !== characterId);
      await party.save();
      refs.broadcastPartyRoster(id);
    }
    return toPartyDTO(party.toObject());
  }

  async function leaveParty(id, uid) {
    const party = await partyRepository.findById(id);
    if (!party) throw new AppError(404, 'Party não encontrada');
    if (party.ownerUid === uid) {
      throw new AppError(400, 'O dono não pode sair da party. Delete-a em vez disso.');
    }
    party.members = party.members.filter((m) => m.uid !== uid);
    await party.save();
    refs.broadcastPartyRoster(id);
    return { ok: true };
  }

  async function removeMember(id, memberUid, ownerUid) {
    const party = await partyRepository.findOwnedParty(id, ownerUid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é o dono');
    if (memberUid === party.ownerUid) {
      throw new AppError(400, 'Não é possível remover o dono da party');
    }
    party.members = party.members.filter((m) => m.uid !== memberUid);
    await party.save();
    refs.broadcastPartyRoster(id);
    return toPartyDTO(party.toObject());
  }

  async function regenerateCode(id, ownerUid) {
    const inviteCode = await uniqueInviteCode();
    const party = await partyRepository.updateOwnedParty(id, ownerUid, { inviteCode });
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é o dono');
    return toPartyDTO(party);
  }

  async function listPartyCharacters(id, uid) {
    const party = await partyRepository.findMemberPartyLean(id, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');
    const charIds = party.members.flatMap((m) => m.characterIds || []).filter(Boolean);
    if (charIds.length === 0) return [];
    const characters = await characterRepository.findByIds(charIds);
    return characters.map(toPartyCharacterDTO);
  }

  async function getPartyCharacter(partyId, characterId, uid) {
    const party = await partyRepository.findOwnedParty(partyId, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é o dono');

    const memberCharIds = (party.members || []).flatMap((m) => m.characterIds || []);
    if (!memberCharIds.includes(characterId)) {
      throw new AppError(404, 'Personagem não pertence a esta party');
    }

    const [character, content, logsDoc] = await Promise.all([
      characterRepository.findActiveById(characterId),
      characterContentRepository.findById(characterId),
      characterLogsRepository.findById(characterId),
    ]);
    if (!character) throw new AppError(404, 'Personagem não encontrado');

    return toCharacterDetailDTO(mergeCharacterDocs(character, content, logsDoc));
  }

  async function applyBuff(partyId, body, uid) {
    const { targetCharacterIds, buff } = body || {};
    if (!Array.isArray(targetCharacterIds) || targetCharacterIds.length === 0) {
      throw new AppError(400, 'targetCharacterIds é obrigatório');
    }
    if (!buff || typeof buff !== 'object' || !Array.isArray(buff.effects)) {
      throw new AppError(400, 'buff inválido');
    }
    const hasNegativeHpMp = buff.effects.some(
      (eff) => eff && (isTempHpType(eff.type) || isTempMpType(eff.type)) && Number(eff.value) < 0,
    );
    if (hasNegativeHpMp) {
      throw new AppError(400, 'Efeitos de PV/PM em um buff não podem ser negativos');
    }

    const party = await partyRepository.findMemberPartyLean(partyId, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

    const validIds = new Set(party.members.flatMap((m) => m.characterIds || []));
    const targets = targetCharacterIds.filter((id) => validIds.has(id));
    if (targets.length === 0) throw new AppError(400, 'Nenhum alvo válido neste grupo');

    const entry = {
      name: String(buff.name || ''),
      effects: buff.effects.map((eff) => ({
        type: String(eff.type || ''),
        attributeId: eff.attributeId ? String(eff.attributeId) : undefined,
        skillId: eff.skillId ? String(eff.skillId) : undefined,
        value: String(eff.value ?? ''),
      })),
      mp: 0,
      active: true,
      source: buff.source ? String(buff.source) : undefined,
      // Teste de resistência da magia: quem recebe o buff é quem precisa do tipo e
      // da CD na ficha, então acompanham a entrada em vez de ficar só no conjurador.
      resistance: buff.resistance ? String(buff.resistance) : undefined,
      dc: Number.isFinite(Number(buff.dc)) ? Number(buff.dc) : undefined,
      // Duração normalizada (cena/dia/permanente): o "Fim de cena" do alvo só desliga o que expira.
      duration: ['cena', 'dia', 'permanente'].includes(buff.duration) ? buff.duration : undefined,
    };

    // Ler-mesclar-gravar em vez de $push: buff homônimo já existente na ficha do
    // alvo é SUBSTITUÍDO (não duplicado), com os pools temporários ajustados por
    // diferença — mesma semântica do applyBuffToCharacter no client. Dois casts
    // simultâneos no mesmo alvo podem se atropelar, mas o autosave da ficha já
    // convive com essa janela.
    const results = await Promise.allSettled(
      targets.map(async (id) => {
        const doc = await characterRepository.findActiveById(id);
        if (!doc) throw new Error(`Character ${id} not found or inactive`);
        await characterRepository.setBuffState(id, mergeBuffIntoCharacter(doc, entry));
        refs.broadcastBuffApplied(partyId, { characterId: id, buff: entry });
        return id;
      }),
    );

    const appliedTo = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failed = targets.filter((id) => !appliedTo.includes(id));

    return { ok: true, appliedTo, failed };
  }

  async function proposeSession(partyId, body, req) {
    const { date, time } = body || {};
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError(400, 'Data inválida (esperado YYYY-MM-DD)');
    }
    if (time && (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
      throw new AppError(400, 'Horário inválido (esperado HH:mm)');
    }
    const { timezone } = body || {};
    // undefined/null = "não informado" (cai no DEFAULT_TIMEZONE); qualquer outro valor
    // precisa ser string, dentro do tamanho e usar só os caracteres de um nome IANA
    // (ex.: 'America/Sao_Paulo', 'Etc/GMT+5') — evita mandar lixo pro Google Calendar.
    if (timezone !== undefined && timezone !== null) {
      const isValid =
        typeof timezone === 'string' && timezone.length <= 64 && /^[A-Za-z0-9/_+-]+$/.test(timezone);
      if (!isValid) {
        throw new AppError(400, 'timezone inválido');
      }
    }

    const party = await partyRepository.findMemberParty(partyId, req.user.uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

    const proposal = {
      id: generatePartyId(),
      proposedBy: req.user.uid,
      date,
      time: time || '',
      timezone: timezone || '',
      googleEvents: [],
      createdAt: new Date(),
      responses: [],
    };
    party.sessionProposals.push(proposal);
    await party.save();
    refs.broadcastPartyRoster(partyId);

    sendSessionProposalEmail(party, proposal).catch((err) => {
      console.error('Falha ao enviar e-mail de proposta de sessão:', err.message);
    });

    return toPartyDTO(party.toObject());
  }

  async function respondToSession(partyId, proposalId, body, uid) {
    const { vote } = body || {};
    if (vote !== 'sim' && vote !== 'nao') {
      throw new AppError(400, 'vote deve ser "sim" ou "nao"');
    }

    const party = await partyRepository.findMemberParty(partyId, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

    const proposal = party.sessionProposals.find((p) => p.id === proposalId);
    if (!proposal) throw new AppError(404, 'Proposta não encontrada');

    const existing = proposal.responses.find((r) => r.uid === uid);
    if (existing) {
      existing.vote = vote;
      existing.respondedAt = new Date();
    } else {
      proposal.responses.push({ uid, vote, respondedAt: new Date() });
    }
    await party.save();
    refs.broadcastPartyRoster(partyId);
    return toPartyDTO(party.toObject());
  }

  async function cancelSession(partyId, proposalId, uid) {
    const party = await partyRepository.findMemberParty(partyId, uid);
    if (!party) throw new AppError(404, 'Party não encontrada ou você não é membro');

    const proposal = party.sessionProposals.find((p) => p.id === proposalId);
    if (!proposal) throw new AppError(404, 'Proposta não encontrada');
    if (proposal.proposedBy !== uid && party.ownerUid !== uid) {
      throw new AppError(403, 'Só quem propôs ou o dono do grupo pode cancelar');
    }

    party.sessionProposals = party.sessionProposals.filter((p) => p.id !== proposalId);
    await party.save();
    refs.broadcastPartyRoster(partyId);
    return toPartyDTO(party.toObject());
  }

  return {
    listParties,
    createParty,
    updateParty,
    deleteParty,
    joinParty,
    addCharacterToParty,
    removeCharacterFromParty,
    leaveParty,
    removeMember,
    regenerateCode,
    listPartyCharacters,
    getPartyCharacter,
    applyBuff,
    proposeSession,
    respondToSession,
    cancelSession,
  };
}

module.exports = { createPartyService };
