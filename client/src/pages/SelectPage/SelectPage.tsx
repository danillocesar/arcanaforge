import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiFetchCharacterSummaries,
  apiSaveCharacter,
  apiDeleteCharacter,
  apiRestoreCharacter,
} from '../../api';
import { createEmptyCharacter } from '../../utils/calculations';
import { normalizeSearch } from '../../utils/formatters';
import type { CharacterSummary } from '../../types/character';
import { SYSTEM_ROUTES } from '../../data/constants';
import Topbar from '../../components/layout/Topbar/Topbar';
import SelectGrid from '../../components/select/SelectGrid/SelectGrid';
import Modal from '../../components/ui/Modal/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import styles from './SelectPage.module.css';

function hoursUntilDelete(pendingDeleteAt: string): number {
  const ms = new Date(pendingDeleteAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60)));
}

export default function SelectPage() {
  const [resumos, setResumos] = useState<CharacterSummary[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CharacterSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetchCharacterSummaries()
      .then(setResumos)
      .catch(console.error);
  }, []);

  const activeChars = resumos.filter((r) => !r.deletedAt);
  const pendingDeleteChars = resumos.filter((r) => r.deletedAt);
  const query = normalizeSearch(search);
  const visibleChars = query
    ? activeChars.filter((r) => normalizeSearch(r.name).includes(query))
    : activeChars;

  const openNewModal = () => {
    setNewName('');
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    const character = createEmptyCharacter(name);
    await apiSaveCharacter(character._id, character);
    setModalOpen(false);
    navigate(`${SYSTEM_ROUTES.tormenta}?id=${encodeURIComponent(character._id)}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await apiDeleteCharacter(deleteTarget._id);
    setResumos((prev) =>
      prev.map((r) =>
        r._id === deleteTarget._id
          ? { ...r, deletedAt: new Date().toISOString(), pendingDeleteAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() }
          : r,
      ),
    );
  };

  const handleRestore = async (char: CharacterSummary) => {
    await apiRestoreCharacter(char._id);
    setResumos((prev) =>
      prev.map((r) =>
        r._id === char._id ? { ...r, deletedAt: null, pendingDeleteAt: null } : r,
      ),
    );
  };

  return (
    <div className={styles.page}>
      <Topbar title="Seleção de Personagens" />

      <div className={styles.content}>
        {activeChars.length > 0 && (
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar personagem por nome..."
            className={styles.searchInput}
            aria-label="Buscar personagem por nome"
          />
        )}

        {query && visibleChars.length === 0 && (
          <EmptyState compact icon="🔍" title={`Nenhum personagem encontrado para "${search}".`} />
        )}

        <SelectGrid
          resumos={visibleChars}
          onNewCharacter={openNewModal}
          onDelete={setDeleteTarget}
        />

        {pendingDeleteChars.length > 0 && (
          <div className={styles.pendingSection}>
            <h4 className={styles.pendingSectionTitle}>Em processo de exclusão</h4>
            <div className={styles.pendingList}>
              {pendingDeleteChars.map((char) => (
                <div key={char._id} className={styles.pendingItem}>
                  <span className={styles.pendingName}>{char.name}</span>
                  {char.pendingDeleteAt && (
                    <span className={styles.pendingTimer}>
                      Removido em ~{hoursUntilDelete(char.pendingDeleteAt)}h
                    </span>
                  )}
                  <button
                    className={styles.restoreBtn}
                    onClick={() => handleRestore(char)}
                    type="button"
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className={styles.newModal} onSubmit={handleCreate}>
          <h3 className={styles.newModalTitle}>Novo Personagem</h3>

          <label className={styles.newModalLabel} htmlFor="new-char-name">
            Nome do personagem
          </label>
          <Input
            id="new-char-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            placeholder="Ex: Aragorn, Kael..."
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

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        variant="danger"
        icon="🗑️"
        title={`Excluir "${deleteTarget?.name}"?`}
        message="O personagem ficará em processo de exclusão por 2 dias. Você pode restaurá-lo durante esse período."
        confirmLabel="Excluir"
        requireText={deleteTarget?.name}
        requireTextLabel="Digite o nome do personagem para confirmar:"
      />
    </div>
  );
}
