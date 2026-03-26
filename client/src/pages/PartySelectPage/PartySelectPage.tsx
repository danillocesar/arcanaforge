import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetchParties, apiCreateParty, apiDeleteParty } from '../../api';
import type { Party } from '../../types/party';
import type { RPGSystem } from '../../types/character';
import Topbar from '../../components/layout/Topbar/Topbar';
import SistemaFilter from '../../components/ui/SystemFilter/SystemFilter';
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
  const [parties, setParties] = useState<Party[]>([]);
  const [tab, setTab] = useState<TabFilter>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoSistema, setNovoSistema] = useState<RPGSystem>('tormenta');
  const [deleteTarget, setDeleteTarget] = useState<Party | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetchParties().then(setParties).catch(console.error);
  }, []);

  const filtered = tab === 'todos' ? parties : parties.filter((p) => p.system === tab);

  const openModal = () => {
    setNovoNome('');
    setNovoSistema('tormenta');
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;

    const party = await apiCreateParty({ name: nome, system: novoSistema, members: [] });
    setModalOpen(false);
    navigate(`/parties/new/${party.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await apiDeleteParty(deleteTarget.id);
    setParties((prev) => prev.filter((p) => p.id !== deleteTarget.id));
  };

  return (
    <div className={styles.page}>
      <Topbar title="Seleção de Grupos" />

      <div className={styles.content}>
        <SistemaFilter value={tab} onChange={setTab} />

        <div className={styles.grid}>
          <button className={styles.newCard} onClick={openModal}>
            <span className={styles.newIcon}>+</span>
            <span className={styles.newLabel}>Novo Grupo</span>
          </button>

          {filtered.map((p) => (
            <button
              key={p.id}
              className={styles.card}
              onClick={() => navigate(`/${p.system}/party/${p.id}`)}
            >
              <span className={styles.systemBadge}>{SISTEMA_BADGE[p.system]}</span>
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
              <span className={styles.cardIcon}>🎲</span>
              <span className={styles.cardName}>{p.name}</span>
              <span className={styles.cardMeta}>
                {SISTEMA_LABEL[p.system]} &middot; {p.members.length} membro{p.members.length !== 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className={styles.newModal} onSubmit={handleCreate}>
          <h3 className={styles.newModalTitle}>Novo Grupo</h3>

          <span className={styles.newModalLabel}>Sistema de RPG</span>
          <div className={styles.systemSelector}>
            <button
              type="button"
              className={`${styles.systemOption} ${novoSistema === 'tormenta' ? styles.systemActive : ''}`}
              onClick={() => setNovoSistema('tormenta')}
            >
              <span className={styles.systemIcon}>⚔️</span>
              <span className={styles.systemName}>Tormenta 20</span>
            </button>
            <button
              type="button"
              className={`${styles.systemOption} ${novoSistema === 'naruto' ? styles.systemActive : ''}`}
              onClick={() => setNovoSistema('naruto')}
            >
              <span className={styles.systemIcon}>🍥</span>
              <span className={styles.systemName}>Naruto: SnS</span>
            </button>
          </div>

          <label className={styles.newModalLabel} htmlFor="novo-party-nome">
            Nome da party
          </label>
          <Input
            id="novo-party-nome"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            autoFocus
            placeholder="Ex: Campanha do Mestre João..."
          />

          <div className={styles.newModalActions}>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={!novoNome.trim()}>
              Próximo
            </Button>
          </div>
        </form>
      </Modal>

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
    </div>
  );
}
