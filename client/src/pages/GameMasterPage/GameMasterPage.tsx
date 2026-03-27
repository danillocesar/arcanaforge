import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CombatProvider, useCombatContext } from '../../contexts/CombatContext';
import { ToastProvider } from '../../components/ui/Toast/Toast';
import { apiFetchParties } from '../../api';
import type { Party } from '../../types/party';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import CombatToolbar from '../../components/combat/CombatToolbar/CombatToolbar';
import CombatCard from '../../components/combat/CombatCard/CombatCard';
import MiniOrder from '../../components/combat/MiniOrder/MiniOrder';
import Modal from '../../components/ui/Modal/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './GameMasterPage.module.css';

function GameMasterContent({ party, system }: { party: Party; system: string }) {
  const navigate = useNavigate();
  const {
    ordered,
    orderActive,
    players,
    combatData,
    turnIndex,
    isMaster,
    addEnemy,
    loadCombat,
  } = useCombatContext();

  const [newEnemyModalOpen, setNewEnemyModalOpen] = useState(false);
  const [newEnemyName, setNewEnemyName] = useState('');
  const [newEnemyHp, setNewEnemyHp] = useState('20');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    loadCombat();
  }, [loadCombat]);

  useEffect(() => {
    document.title = 'Combate Tracker — ArcanaForge';
  }, []);

  const openNewEnemyModal = () => {
    const n = combatData.enemies.length + 1;
    setNewEnemyName(`Inimigo ${n}`);
    setNewEnemyHp('20');
    setNewEnemyModalOpen(true);
  };

  const handleSubmitNewEnemy = (e: React.FormEvent) => {
    e.preventDefault();
    const hp = Math.max(1, Math.floor(Number(newEnemyHp) || 1));
    const name = newEnemyName.trim() || `Inimigo ${combatData.enemies.length + 1}`;
    addEnemy(name, hp);
    setNewEnemyModalOpen(false);
  };

  const copyInviteCode = () => {
    if (!party.inviteCode) return;
    navigator.clipboard.writeText(party.inviteCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const navItems = useMemo(
    () => [
      { id: 'members', label: 'Membros', onClick: () => navigate(`/${system}/party/${party.id}/members`) },
      { id: 'combat', label: 'Combate', active: true },
    ],
    [navigate, party.id, system],
  );

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

  const isActiveTurn = (i: number) => turnIndex >= 0 && i === turnIndex;

  return (
    <>
      {isMaster && <div className={styles.gmStrip} aria-hidden />}
      <Topbar title={party.name ? `Grupo - ${party.name}` : 'Grupo'} />
      <SectionNav
        items={navItems}
        rightSlot={
          isMaster && party.inviteCode ? (
            <span
              className={`${styles.inviteCode} ${codeCopied ? styles.inviteCodeCopied : ''}`}
              onClick={copyInviteCode}
              title="Clique para copiar"
            >
              {codeCopied ? 'Copiado!' : party.inviteCode}
            </span>
          ) : undefined
        }
      />
      <div className={styles.gmContainer}>
        {isMaster && (
          <div className={styles.gmBadge}>
            <span className={styles.gmBadgeDot} aria-hidden />
            MESTRE
          </div>
        )}
        <div className={styles.gmSection}>
          {isMaster && <CombatToolbar />}
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
                <CombatCard key={row.id} row={row} isActiveTurn={isActiveTurn(i)} />
              ))}
            </div>
          )}
          {isMaster && (
            <button type="button" className={styles.addEnemy} onClick={openNewEnemyModal}>
              <span className={styles.addIcon}>+</span> Adicionar Inimigo
            </button>
          )}
        </div>
      </div>

      <Modal open={newEnemyModalOpen} onClose={() => setNewEnemyModalOpen(false)}>
        <form className={styles.newEnemyModal} onSubmit={handleSubmitNewEnemy}>
          <h3 className={styles.newEnemyTitle}>Novo inimigo</h3>
          <label className={styles.newEnemyLabel} htmlFor="new-enemy-name">
            Nome
          </label>
          <Input
            id="new-enemy-name"
            value={newEnemyName}
            onChange={(e) => setNewEnemyName(e.target.value)}
            autoFocus
          />
          <label className={styles.newEnemyLabel} htmlFor="new-enemy-hp">
            PV total
          </label>
          <Input
            id="new-enemy-hp"
            type="number"
            min={1}
            value={newEnemyHp}
            onChange={(e) => setNewEnemyHp(e.target.value)}
          />
          <div className={styles.newEnemyActions}>
            <Button type="button" variant="ghost" onClick={() => setNewEnemyModalOpen(false)}>
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

export default function GameMasterPage() {
  const { system, partyId } = useParams<{ system: string; partyId: string }>();
  const navigate = useNavigate();
  const [party, setParty] = useState<Party | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!partyId) {
      navigate('/parties', { replace: true });
      return;
    }
    apiFetchParties()
      .then((parties) => {
        const found = parties.find((p) => p.id === partyId);
        if (found) setParty(found);
        else setAccessDenied(true);
      })
      .catch(console.error);
  }, [partyId, navigate]);

  if (accessDenied) return <AccessDeniedPage />;
  if (!partyId || !party) return null;

  return (
    <ToastProvider>
      <CombatProvider partyId={partyId} ownerUid={party.ownerUid}>
        <GameMasterContent party={party} system={system!} />
      </CombatProvider>
    </ToastProvider>
  );
}
