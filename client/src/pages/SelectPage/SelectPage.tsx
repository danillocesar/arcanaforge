import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetchFichasResumo, apiSaveFicha, apiDeleteFicha } from '../../api';
import { criarFichaVazia, criarFichaNarutoVazia } from '../../utils/calculations';
import type { SistemaRPG, FichaResumo } from '../../types/ficha';
import { SISTEMA_ROUTE } from '../../data/constants';
import Topbar from '../../components/layout/Topbar/Topbar';
import SistemaFilter from '../../components/ui/SistemaFilter/SistemaFilter';
import SelectGrid from '../../components/select/SelectGrid/SelectGrid';
import Modal from '../../components/ui/Modal/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';
import styles from './SelectPage.module.css';

type TabFilter = 'todos' | 'tormenta' | 'naruto';

export default function SelectPage() {
  const [resumos, setResumos] = useState<FichaResumo[]>([]);
  const [tab, setTab] = useState<TabFilter>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoSistema, setNovoSistema] = useState<SistemaRPG>('tormenta');
  const [deleteTarget, setDeleteTarget] = useState<FichaResumo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetchFichasResumo().then(setResumos).catch(console.error);
  }, []);

  const filtered = tab === 'todos' ? resumos : resumos.filter((r) => r.sistema === tab);

  const openNewModal = () => {
    setNovoNome('');
    setNovoSistema('tormenta');
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;

    const ficha =
      novoSistema === 'naruto' ? criarFichaNarutoVazia(nome) : criarFichaVazia(nome);
    await apiSaveFicha(ficha._id, ficha);
    setModalOpen(false);
    navigate(`${SISTEMA_ROUTE[novoSistema]}?id=${encodeURIComponent(ficha._id)}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await apiDeleteFicha(deleteTarget._id);
    setResumos((prev) => prev.filter((r) => r._id !== deleteTarget._id));
  };

  return (
    <div className={styles.page}>
      <Topbar title="Seleção de Personagens" />

      <div className={styles.content}>
        <SistemaFilter value={tab} onChange={setTab} />

        <SelectGrid resumos={filtered} onNewCharacter={openNewModal} onDelete={setDeleteTarget} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className={styles.newModal} onSubmit={handleCreate}>
          <h3 className={styles.newModalTitle}>Novo Personagem</h3>

          <span className={styles.newModalLabel}>Sistema de RPG</span>
          <div className={styles.sistemaSelector}>
            <button
              type="button"
              className={`${styles.sistemaOption} ${novoSistema === 'tormenta' ? styles.sistemaActive : ''}`}
              onClick={() => setNovoSistema('tormenta')}
            >
              <span className={styles.sistemaIcon}>⚔️</span>
              <span className={styles.sistemaName}>Tormenta 20</span>
            </button>
            <button
              type="button"
              className={`${styles.sistemaOption} ${novoSistema === 'naruto' ? styles.sistemaActive : ''}`}
              onClick={() => setNovoSistema('naruto')}
            >
              <span className={styles.sistemaIcon}>🍥</span>
              <span className={styles.sistemaName}>Naruto: SnS</span>
            </button>
          </div>

          <label className={styles.newModalLabel} htmlFor="novo-char-nome">
            Nome do personagem
          </label>
          <Input
            id="novo-char-nome"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            autoFocus
            placeholder="Ex: Aragorn, Naruto Uzumaki..."
          />

          <div className={styles.newModalActions}>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={!novoNome.trim()}>
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
        title={`Excluir "${deleteTarget?.nome}"?`}
        message="Esta ação é irreversível. Todos os dados deste personagem serão perdidos."
        confirmLabel="Excluir"
        requireText={deleteTarget?.nome}
        requireTextLabel="Digite o nome do personagem para confirmar:"
      />
    </div>
  );
}
