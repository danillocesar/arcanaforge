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

const VALID_SYSTEMS = ['tormenta', 'naruto'];

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
  };
}

module.exports = { createPartyService };
