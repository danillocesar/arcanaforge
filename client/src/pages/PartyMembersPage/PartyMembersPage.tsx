import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import {
  apiFetchParties,
  apiFetchCharacterSummaries,
  apiFetchPartyCharacters,
  apiAddCharacterToParty,
  apiRemoveCharacterFromParty,
  apiRemovePartyMember,
} from '../../api';
import type { PartyCharacter } from '../../api/parties';
import type { Party, PartyMember } from '../../types/party';
import type { CharacterSummary } from '../../types/character';
import { useAuth } from '../../features/auth';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { WsMessage } from '../../hooks/useWebSocket';
import { getInitials, getAvatarColor, formatClassesStr } from '../../utils/formatters';
import Topbar, { systemParamToBrand } from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './PartyMembersPage.module.css';

export default function PartyMembersPage() {
  const { system, partyId } = useParams<{ system: string; partyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [myCharacters, setMyCharacters] = useState<CharacterSummary[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [partyCharacters, setPartyCharacters] = useState<PartyCharacter[]>([]);
  const [removeMember, setRemoveMember] = useState<PartyMember | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const uid = user?.uid ?? '';
  const isOwner = party?.ownerUid === uid;

  const loadData = useCallback(async () => {
    if (!partyId) return;
    try {
      const [parties, allSummaries, pChars] = await Promise.all([
        apiFetchParties(),
        apiFetchCharacterSummaries(),
        apiFetchPartyCharacters(partyId),
      ]);

      const found = parties.find((p) => p.id === partyId);
      if (!found) {
        setAccessDenied(true);
        return;
      }

      setParty(found);
      setMyCharacters(allSummaries.filter((r) => r.system === found.system));
      setPartyCharacters(pChars);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    }
  }, [partyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useWebSocket(
    useCallback(
      (msg: WsMessage) => {
        if (msg.type === 'party_roster_sync' && msg.partyId === partyId) {
          loadDataRef.current();
        }
      },
      [partyId],
    ),
  );

  const handleToggleCharacter = async (characterId: string) => {
    if (!party) return;
    const myMember = party.members.find((m) => m.uid === uid);
    const charIds = myMember?.characterIds ?? [];
    const isAlready = charIds.includes(characterId);

    try {
      const updated = isAlready
        ? await apiRemoveCharacterFromParty(party.id, characterId)
        : await apiAddCharacterToParty(party.id, characterId);
      setParty(updated);
    } catch (err) {
      console.error('Erro ao alterar personagem:', err);
    }
  };

  const handleRemoveMember = async () => {
    if (!party || !removeMember) return;
    try {
      const updated = await apiRemovePartyMember(party.id, removeMember.uid);
      setParty(updated);
    } catch (err) {
      console.error('Erro ao remover membro:', err);
    }
  };

  const copyCode = () => {
    if (!party?.inviteCode) return;
    navigator.clipboard.writeText(party.inviteCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const navItems = useMemo(
    () => [
      { id: 'members', label: 'Membros', active: true },
      { id: 'combat', label: 'Combate', onClick: () => {
        if (system && partyId) navigate(`/${system}/party/${partyId}`);
      }},
    ],
    [navigate, system, partyId],
  );

  const partyCharsMap = useMemo(() => {
    const map = new Map<string, PartyCharacter>();
    for (const c of partyCharacters) map.set(c._id, c);
    return map;
  }, [partyCharacters]);

  if (accessDenied) return <AccessDeniedPage />;

  if (!party) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  const myMember = party.members.find((m) => m.uid === uid);
  const myCharIds = new Set(myMember?.characterIds ?? []);

  return (
    <div className={styles.page}>
      <Topbar title={`Grupo - ${party.name}`} systemBrand={systemParamToBrand(system)} />
      <SectionNav
        items={navItems}
        rightSlot={
          isOwner && party.inviteCode ? (
            <span
              className={`${styles.inviteCode} ${codeCopied ? styles.inviteCodeCopied : ''}`}
              onClick={copyCode}
              title="Clique para copiar"
            >
              {codeCopied ? 'Copiado!' : party.inviteCode}
            </span>
          ) : undefined
        }
      />

      <div className={styles.content}>
        {/* My characters selector (multi-select) */}
        <div className={styles.myCharSection}>
          <h3 className={styles.sectionTitle}>
            Meus Personagens ({myCharIds.size} selecionado{myCharIds.size !== 1 ? 's' : ''})
          </h3>

          {myCharacters.length === 0 ? (
            <div className={styles.empty}>
              Nenhum personagem encontrado para este sistema. Crie personagens primeiro na tela de seleção.
            </div>
          ) : (
            <div className={styles.charGrid}>
              {myCharacters.map((r) => {
                const isSelected = myCharIds.has(r._id);
                const classesStr = formatClassesStr(r.classes);

                return (
                  <button
                    key={r._id}
                    type="button"
                    className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                    onClick={() => handleToggleCharacter(r._id)}
                  >
                    <span className={styles.checkbox}>{isSelected ? '✓' : ''}</span>
                    <div
                      className={styles.avatar}
                      style={r.avatar ? undefined : { background: getAvatarColor(r.name) }}
                    >
                      {r.avatar ? <img src={r.avatar} alt="" /> : getInitials(r.name)}
                    </div>
                    <span className={styles.cardName}>{r.name}</span>
                    <span className={styles.cardClass}>{classesStr}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Members list */}
        <div className={styles.membersSection}>
          <h3 className={styles.sectionTitle}>
            Membros ({party.members.length})
          </h3>

          <div className={styles.membersList}>
            {party.members.map((member) => {
              const isSelf = member.uid === uid;
              const isMemberOwner = member.uid === party.ownerUid;
              const memberCharIds = member.characterIds ?? [];
              const memberCharNames = isSelf
                ? myCharacters.filter((c) => myCharIds.has(c._id)).map((c) => c.name)
                : [];

              const memberChars = isOwner && !isMemberOwner
                ? memberCharIds.map((cid) => partyCharsMap.get(cid)).filter(Boolean) as PartyCharacter[]
                : [];

              return (
                <div key={member.uid} className={styles.memberBlock}>
                  <div className={styles.memberRow}>
                    <div className={styles.memberInfo}>
                      <div
                        className={styles.memberAvatar}
                        style={{ background: getAvatarColor(member.email || member.uid) }}
                      >
                        {getInitials(member.email || member.uid)}
                      </div>
                      <div className={styles.memberDetails}>
                        <span className={styles.memberEmail}>
                          {member.email || member.uid}
                          {isSelf && <span className={styles.selfBadge}>(você)</span>}
                          {isMemberOwner && <span className={styles.ownerBadge}>Mestre</span>}
                        </span>
                        <span className={styles.memberChar}>
                          {memberCharIds.length > 0
                            ? isSelf
                              ? memberCharNames.join(', ')
                              : `${memberCharIds.length} personagem${memberCharIds.length !== 1 ? 's' : ''}`
                            : 'Nenhum personagem selecionado'}
                        </span>
                      </div>
                    </div>
                    {isOwner && !isMemberOwner && (
                      <button
                        type="button"
                        className={styles.removeMemberBtn}
                        title="Remover membro"
                        onClick={() => setRemoveMember(member)}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {memberChars.length > 0 && (
                    <div className={styles.memberCharCards}>
                      {memberChars.map((ch) => (
                        <button
                          key={ch._id}
                          type="button"
                          className={styles.viewCharBtn}
                          onClick={() => navigate(`/${system}/party/${partyId}/char/${ch._id}`)}
                          title={`Ver ficha de ${ch.name}`}
                        >
                          <div
                            className={styles.viewCharAvatar}
                            style={ch.avatar ? undefined : { background: getAvatarColor(ch.name) }}
                          >
                            {ch.avatar ? <img src={ch.avatar} alt="" /> : getInitials(ch.name)}
                          </div>
                          <div className={styles.viewCharInfo}>
                            <span className={styles.viewCharName}>{ch.name}</span>
                            <span className={styles.viewCharClass}>{formatClassesStr(ch.classes)}</span>
                          </div>
                          <Eye size={16} className={styles.viewCharIcon} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <ConfirmModal
        open={removeMember !== null}
        onClose={() => setRemoveMember(null)}
        onConfirm={handleRemoveMember}
        variant="danger"
        icon="✕"
        title="Remover membro?"
        message={`Tem certeza que deseja remover ${removeMember?.email || 'este membro'} do grupo?`}
        confirmLabel="Remover"
      />
    </div>
  );
}
