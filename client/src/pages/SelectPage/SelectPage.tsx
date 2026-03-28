import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetchCharacterSummaries, apiSaveCharacter, apiDeleteCharacter } from '../../api';
import { apiRestoreCharacter } from '../../api/billing';
import { createEmptyCharacter, createEmptyNarutoCharacter } from '../../utils/calculations';
import type { RPGSystem, CharacterSummary } from '../../types/character';
import { SYSTEM_ROUTES } from '../../data/constants';
import { usePlan } from '../../contexts/PlanContext';
import Topbar from '../../components/layout/Topbar/Topbar';
import SystemFilter from '../../components/ui/SystemFilter/SystemFilter';
import SelectGrid from '../../components/select/SelectGrid/SelectGrid';
import Modal from '../../components/ui/Modal/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';
import styles from './SelectPage.module.css';

type TabFilter = 'todos' | 'tormenta' | 'naruto';

function hoursUntilDelete(pendingDeleteAt: string): number {
  const ms = new Date(pendingDeleteAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60)));
}

export default function SelectPage() {
  const [resumos, setResumos] = useState<CharacterSummary[]>([]);
  const [tab, setTab] = useState<TabFilter>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSystem, setNewSystem] = useState<RPGSystem>('tormenta');
  const [deleteTarget, setDeleteTarget] = useState<CharacterSummary | null>(null);
  const navigate = useNavigate();
  const { status, setSlotsUsed } = usePlan();

  useEffect(() => {
    apiFetchCharacterSummaries()
      .then((data) => {
        setResumos(data);
        const activeCount = data.filter((r) => !r.deletedAt).length;
        setSlotsUsed(activeCount);
      })
      .catch(console.error);
  }, [setSlotsUsed]);

  const activeChars = resumos.filter((r) => !r.deletedAt);
  const pendingDeleteChars = resumos.filter((r) => r.deletedAt);
  const filtered = tab === 'todos' ? activeChars : activeChars.filter((r) => r.system === tab);

  const slotLimit = status?.characterSlots ?? null;
  const slotsUsedCount = activeChars.length;
  const atLimit = slotLimit !== null && slotsUsedCount >= slotLimit;

  const openNewModal = () => {
    setNewName('');
    setNewSystem('tormenta');
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    const character =
      newSystem === 'naruto' ? createEmptyNarutoCharacter(name) : createEmptyCharacter(name);
    await apiSaveCharacter(character._id, character);
    setModalOpen(false);
    navigate(`${SYSTEM_ROUTES[newSystem]}?id=${encodeURIComponent(character._id)}`);
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
    setSlotsUsed(activeChars.length - 1);
  };

  const handleRestore = async (char: CharacterSummary) => {
    await apiRestoreCharacter(char._id);
    setResumos((prev) =>
      prev.map((r) =>
        r._id === char._id ? { ...r, deletedAt: null, pendingDeleteAt: null } : r,
      ),
    );
    setSlotsUsed(activeChars.length + 1);
  };

  const trialBanner = status?.isTrial && !status.isExpired && status.trialDaysLeft <= 7;
  const expiredBanner = status?.isExpired;

  return (
    <div className={styles.page}>
      <Topbar title="Seleção de Personagens" />

      <div className={styles.content}>
        {expiredBanner && (
          <div className={styles.bannerExpired}>
            ⚠️ Seu plano expirou. <a href="/billing">Renove agora</a> para criar e editar personagens.
          </div>
        )}

        {trialBanner && !expiredBanner && (
          <div className={styles.bannerTrial}>
            🕐 Seu trial expira em <strong>{status!.trialDaysLeft} dia(s)</strong>.{' '}
            <a href="/billing">Assine o Pro</a> para continuar com acesso completo.
          </div>
        )}

        {slotLimit !== null && (
          <div className={styles.slotCounter}>
            <span>
              Personagens: <strong>{slotsUsedCount}</strong> / <strong>{slotLimit}</strong>
            </span>
            {atLimit && (
              <a href="/billing" className={styles.slotBuyLink}>
                + Comprar slot
              </a>
            )}
          </div>
        )}

        <SystemFilter value={tab} onChange={setTab} />

        <SelectGrid
          resumos={filtered}
          onNewCharacter={openNewModal}
          onDelete={setDeleteTarget}
          newDisabled={atLimit || !!expiredBanner}
          newDisabledTooltip={
            expiredBanner
              ? 'Plano expirado'
              : atLimit
                ? `Limite de ${slotLimit} personagem(ns) atingido`
                : undefined
          }
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

          <label className={styles.newModalLabel} htmlFor="new-char-name">
            Nome do personagem
          </label>
          <Input
            id="new-char-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            placeholder="Ex: Aragorn, Naruto Uzumaki..."
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
