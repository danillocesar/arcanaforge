import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CombatProvider, useCombatContext } from '../../contexts/CombatContext';
import { ToastProvider } from '../../components/ui/Toast/Toast';
import { apiFetchParties } from '../../api';
import Topbar from '../../components/layout/Topbar/Topbar';
import CombateToolbar from '../../components/combat/CombatToolbar/CombatToolbar';
import CombateCard from '../../components/combat/CombatCard/CombatCard';
import MiniOrder from '../../components/combat/MiniOrder/MiniOrder';
import Modal from '../../components/ui/Modal/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import styles from './GameMasterPage.module.css';

function MestreContent({ partyNome }: { partyNome: string }) {
  const {
    ordered,
    orderActive,
    players,
    combatData,
    turnIndex,
    masterMode,
    setMasterMode,
    addEnemy,
    loadCombat,
  } = useCombatContext();

  const [modalNovoInimigo, setModalNovoInimigo] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoPv, setNovoPv] = useState('20');

  useEffect(() => {
    loadCombat();
  }, [loadCombat]);

  useEffect(() => {
    document.title = 'Combate Tracker — ArcanaForge';
  }, []);

  const abrirModalNovoInimigo = () => {
    const n = combatData.enemies.length + 1;
    setNovoNome(`Inimigo ${n}`);
    setNovoPv('20');
    setModalNovoInimigo(true);
  };

  const handleSubmitNovoInimigo = (e: React.FormEvent) => {
    e.preventDefault();
    const pv = Math.max(1, Math.floor(Number(novoPv) || 1));
    const nome = novoNome.trim() || `Inimigo ${combatData.enemies.length + 1}`;
    addEnemy(nome, pv);
    setModalNovoInimigo(false);
  };

  const rows = orderActive
    ? ordered
    : [
        ...players.map((p) => ({
          type: 'player' as const,
          id: `player_${p._id}`,
          characterId: p._id,
          name: p.name,
          initiative: Number(combatData.initiatives[`player_${p._id}`]) || 0,
          maxHp: p.maxHp,
          currentHp: p.currentHp,
          maxMp: p.maxMp,
          currentMp: p.currentMp,
          avatar: p.avatar,
          classes: p.classes,
        })),
        ...combatData.enemies.map((enemy, idx) => ({
          type: 'enemy' as const,
          id: `enemy_${idx}`,
          name: enemy.name,
          initiative: enemy.initiative ?? 0,
          maxHp: enemy.maxHp,
          currentHp: enemy.currentHp,
          woundThreshold: enemy.woundThreshold,
          criticalThreshold: enemy.criticalThreshold,
        })),
      ];

  const isTurno = (i: number) => turnIndex >= 0 && i === turnIndex;

  return (
    <>
      {masterMode && <div className={styles.gmStrip} aria-hidden />}
      <Topbar
        title={partyNome ? `Grupo - ${partyNome}` : 'Grupo'}
        right={
          <button
            type="button"
            className={`${styles.gmToggle} ${masterMode ? styles.gmToggleActive : ''}`}
            onClick={() => setMasterMode(!masterMode)}
            title="Ativar/desativar visão do Mestre"
          >
            {masterMode ? '🔓 Modo Mestre' : '🔒 Modo Mestre'}
          </button>
        }
      />
      <div className={styles.gmContainer}>
        {masterMode && (
          <div className={styles.gmBadge}>
            <span className={styles.gmBadgeDot} aria-hidden />
            MODO MESTRE
          </div>
        )}
        <div className={styles.gmSection}>
          {masterMode && <CombateToolbar />}
          {rows.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🎲</span>
              <p>Nenhum participante no combate ainda.</p>
              <p className={styles.emptyHint}>
                Os personagens salvos aparecerão automaticamente. Use o botão abaixo para adicionar inimigos.
              </p>
            </div>
          ) : (
            <div className={styles.cardsWrapper}>
              {rows.map((row, i) => (
                <CombateCard key={row.id} row={row} isTurno={isTurno(i)} />
              ))}
            </div>
          )}
          {masterMode && (
            <button type="button" className={styles.addEnemy} onClick={abrirModalNovoInimigo}>
              <span className={styles.addIcon}>+</span> Adicionar Inimigo
            </button>
          )}
        </div>
      </div>

      <Modal open={modalNovoInimigo} onClose={() => setModalNovoInimigo(false)}>
        <form className={styles.newEnemyModal} onSubmit={handleSubmitNovoInimigo}>
          <h3 className={styles.newEnemyTitle}>Novo inimigo</h3>
          <label className={styles.newEnemyLabel} htmlFor="novo-inimigo-nome">
            Nome
          </label>
          <Input
            id="novo-inimigo-nome"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            autoFocus
          />
          <label className={styles.newEnemyLabel} htmlFor="novo-inimigo-pv">
            PV total
          </label>
          <Input
            id="novo-inimigo-pv"
            type="number"
            min={1}
            value={novoPv}
            onChange={(e) => setNovoPv(e.target.value)}
          />
          <div className={styles.newEnemyActions}>
            <Button type="button" variant="ghost" onClick={() => setModalNovoInimigo(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Adicionar
            </Button>
          </div>
        </form>
      </Modal>

      <MiniOrder rows={rows} />
    </>
  );
}

export default function MestrePage() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const [partyNome, setPartyNome] = useState('');

  useEffect(() => {
    if (!partyId) {
      navigate('/parties', { replace: true });
      return;
    }
    apiFetchParties()
      .then((parties) => {
        const found = parties.find((p) => p.id === partyId);
        if (found) setPartyNome(found.name);
      })
      .catch(console.error);
  }, [partyId, navigate]);

  if (!partyId) return null;

  return (
    <ToastProvider>
      <CombatProvider partyId={partyId}>
        <MestreContent partyNome={partyNome} />
      </CombatProvider>
    </ToastProvider>
  );
}
