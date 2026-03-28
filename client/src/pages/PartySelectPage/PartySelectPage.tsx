import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetchParties, apiCreateParty, apiDeleteParty, apiJoinParty, apiLeaveParty } from '../../api';
import type { Party } from '../../types/party';
import type { RPGSystem } from '../../types/character';
import { useAuth } from '../../features/auth';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { WsMessage } from '../../hooks/useWebSocket';
import Topbar from '../../components/layout/Topbar/Topbar';
import SystemFilter from '../../components/ui/SystemFilter/SystemFilter';
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';
import Modal from '../../components/ui/Modal/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import styles from './PartySelectPage.module.css';

type TabFilter = 'todos' | 'tormenta' | 'naruto';

const SISTEMA_BADGE: Record<RPGSystem, string> = {
  tormenta: '⚔️',
  naruto: '🍥',
};

const SISTEMA_LABEL: Record<RPGSystem, string> = {
  tormenta: 'Tormenta 20',
  naruto: 'Naruto: SnS',
};

export default function PartySelectPage() {
  const { user } = useAuth();
  const [parties, setParties] = useState<Party[]>([]);
  const [tab, setTab] = useState<TabFilter>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSystem, setNewSystem] = useState<RPGSystem>('tormenta');
  const [deleteTarget, setDeleteTarget] = useState<Party | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<Party | null>(null);
  const navigate = useNavigate();

  const uid = user?.uid ?? '';

  const loadParties = useCallback(() => {
    apiFetchParties().then(setParties).catch(console.error);
  }, []);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  const loadPartiesRef = useRef(loadParties);
  loadPartiesRef.current = loadParties;

  useWebSocket(
    useCallback((msg: WsMessage) => {
      if (msg.type === 'party_roster_sync') {
        loadPartiesRef.current();
      }
    }, []),
  );

  const myParties = parties.filter((p) => p.ownerUid === uid);
  const joinedParties = parties.filter((p) => p.ownerUid !== uid);

  const filterByTab = (list: Party[]) =>
    tab === 'todos' ? list : list.filter((p) => p.system === tab);

  const openModal = () => {
    setNewName('');
    setNewSystem('tormenta');
    setModalOpen(true);
  };

  const openJoinModal = () => {
    setJoinCode('');
    setJoinError('');
    setJoinModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    const party = await apiCreateParty({ name, system: newSystem });
    setModalOpen(false);
    navigate(`/${party.system}/party/${party.id}`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;

    setJoinLoading(true);
    setJoinError('');
    try {
      const party = await apiJoinParty(code);
      setJoinModalOpen(false);
      setParties((prev) => {
        if (prev.some((p) => p.id === party.id)) return prev;
        return [...prev, party];
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar na party';
      setJoinError(msg);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await apiDeleteParty(deleteTarget.id);
    setParties((prev) => prev.filter((p) => p.id !== deleteTarget.id));
  };

  const handleLeaveConfirm = async () => {
    if (!leaveTarget) return;
    await apiLeaveParty(leaveTarget.id);
    setParties((prev) => prev.filter((p) => p.id !== leaveTarget.id));
  };

  const copyInviteCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).catch(() => {});
  };

  const renderPartyCard = (p: Party, isOwner: boolean) => (
    <div
      key={p.id}
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/${p.system}/party/${p.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/${p.system}/party/${p.id}`);
      }}
    >
      <span className={styles.systemBadge}>{SISTEMA_BADGE[p.system]}</span>

      {isOwner ? (
        <button
          type="button"
          className={styles.deleteBtn}
          title="Excluir"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(p);
          }}
        >
          ✕
        </button>
      ) : (
        <button
          type="button"
          className={styles.deleteBtn}
          title="Sair"
          onClick={(e) => {
            e.stopPropagation();
            setLeaveTarget(p);
          }}
        >
          ↩
        </button>
      )}

      <span className={styles.cardIcon}>🎲</span>
      <span className={styles.cardName}>{p.name}</span>
      <span className={styles.cardMeta}>
        {SISTEMA_LABEL[p.system]} &middot; {p.members.length} membro{p.members.length !== 1 ? 's' : ''}
      </span>

      {isOwner && p.inviteCode && (
        <span
          className={styles.inviteCode}
          title="Clique para copiar código de convite"
          onClick={(e) => copyInviteCode(p.inviteCode, e)}
        >
          {p.inviteCode}
        </span>
      )}
    </div>
  );

  const filteredMy = filterByTab(myParties);
  const filteredJoined = filterByTab(joinedParties);

  return (
    <div className={styles.page}>
      <Topbar title="Seleção de Grupos" />

      <div className={styles.content}>
        <SystemFilter value={tab} onChange={setTab} />

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Meus Grupos</h2>
        </div>

        <div className={styles.grid}>
          <button className={styles.newCard} onClick={openModal}>
            <span className={styles.newIcon}>+</span>
            <span className={styles.newLabel}>Novo Grupo</span>
          </button>

          {filteredMy.map((p) => renderPartyCard(p, true))}
        </div>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Grupos que participo</h2>
        </div>

        <div className={styles.grid}>
          <button className={styles.newCard} onClick={openJoinModal}>
            <span className={styles.newIcon}>🔑</span>
            <span className={styles.newLabel}>Entrar com código</span>
          </button>

          {filteredJoined.length === 0 ? (
            <div className={styles.emptyHint}>
              Use um código de convite para entrar em um grupo.
            </div>
          ) : (
            filteredJoined.map((p) => renderPartyCard(p, false))
          )}
        </div>
      </div>

      {/* Create party modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className={styles.newModal} onSubmit={handleCreate}>
          <h3 className={styles.newModalTitle}>Novo Grupo</h3>

          <span className={styles.newModalLabel}>Sistema de RPG</span>
          <div className={styles.systemSelector}>
            <button
              type="button"
              className={`${styles.systemOption} ${newSystem === 'tormenta' ? styles.systemActive : ''}`}
              onClick={() => setNewSystem('tormenta')}
            >
              <span className={styles.systemIcon}>⚔️</span>
              <span className={styles.systemName}>Tormenta 20</span>
            </button>
            <button
              type="button"
              className={`${styles.systemOption} ${newSystem === 'naruto' ? styles.systemActive : ''}`}
              onClick={() => setNewSystem('naruto')}
            >
              <span className={styles.systemIcon}>🍥</span>
              <span className={styles.systemName}>Naruto: SnS</span>
            </button>
          </div>

          <label className={styles.newModalLabel} htmlFor="new-party-name">
            Nome da party
          </label>
          <Input
            id="new-party-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            placeholder="Ex: Campanha do Mestre João..."
          />

          <div className={styles.newModalActions}>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={!newName.trim()}>
              Criar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join party modal */}
      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)}>
        <form className={styles.newModal} onSubmit={handleJoin}>
          <h3 className={styles.newModalTitle}>Entrar em um Grupo</h3>

          <label className={styles.newModalLabel} htmlFor="join-code">
            Código de convite
          </label>
          <Input
            id="join-code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            autoFocus
            placeholder="Ex: X3K9F2"
            maxLength={8}
          />

          {joinError && <p className={styles.joinError}>{joinError}</p>}

          <div className={styles.newModalActions}>
            <Button type="button" variant="ghost" onClick={() => setJoinModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={!joinCode.trim() || joinLoading}>
              {joinLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        variant="danger"
        icon="🗑️"
        title={`Excluir "${deleteTarget?.name}"?`}
        message="Esta ação é irreversível. Todos os dados deste grupo serão perdidos."
        confirmLabel="Excluir"
        requireText={deleteTarget?.name}
        requireTextLabel="Digite o nome do grupo para confirmar:"
      />

      {/* Leave confirmation */}
      <ConfirmModal
        open={leaveTarget !== null}
        onClose={() => setLeaveTarget(null)}
        onConfirm={handleLeaveConfirm}
        variant="danger"
        icon="↩️"
        title={`Sair de "${leaveTarget?.name}"?`}
        message="Você deixará de fazer parte deste grupo."
        confirmLabel="Sair"
      />
    </div>
  );
}
