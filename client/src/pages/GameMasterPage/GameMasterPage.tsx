import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { CombatProvider, useCombatContext } from '../../contexts/CombatContext';
import { ToastProvider } from '../../components/ui/Toast/Toast';
import { apiFetchParties } from '../../api';
import type { Party } from '../../types/party';
import type { CombatRow } from '../../types/combat';
import { buildCombatRows } from '../../utils/combatRows';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import CombatToolbar from '../../components/combat/CombatToolbar/CombatToolbar';
import CombatCard from '../../components/combat/CombatCard/CombatCard';
import MiniOrder from '../../components/combat/MiniOrder/MiniOrder';
import Modal from '../../components/ui/Modal/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import SegmentedControl from '../../components/ui/SegmentedControl/SegmentedControl';
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

  const [combatTab, setCombatTab] = useState<'active' | 'inactive'>('active');
  const [newEnemyModalOpen, setNewEnemyModalOpen] = useState(false);
  const [newEnemyName, setNewEnemyName] = useState('');
  const [newEnemyHp, setNewEnemyHp] = useState('20');
  const [codeCopied, setCodeCopied] = useState(false);
  const [spectatorMode, setSpectatorMode] = useState(false);

  useEffect(() => {
    loadCombat();
  }, [loadCombat]);

  useEffect(() => {
    document.title = 'Combate Tracker — ArcanaForge';
  }, []);

  const inactiveSet = useMemo(
    () => new Set(combatData.inactiveCharacterIds ?? []),
    [combatData.inactiveCharacterIds],
  );

  const activeRows: CombatRow[] = useMemo(() => {
    if (orderActive) return ordered;
    return buildCombatRows(combatData, players, { sort: false });
  }, [orderActive, ordered, combatData, players]);

  const inactiveRows: CombatRow[] = useMemo(
    () =>
      players
        .filter((p) => inactiveSet.has(p._id))
        .map((p) => ({
          type: 'player' as const,
          id: `player_${p._id}`,
          characterId: p._id,
          name: p.name,
          initiative: Number(combatData.initiatives[`player_${p._id}`]) || 0,
          maxHp: p.maxHp,
          currentHp: p.currentHp,
          maxMp: p.maxMp,
          currentMp: p.currentMp,
          temporaryHp: p.temporaryHp,
          damageReductions: p.damageReductions,
          avatar: p.avatar,
          classes: p.classes,
          ownerUid: p.ownerUid,
          combatVisual: combatData.gmCharacterVisual?.[p._id] ?? 'ally',
        })),
    [players, inactiveSet, combatData],
  );

  const activeTurnId =
    orderActive && turnIndex >= 0 && activeRows[turnIndex] ? activeRows[turnIndex].id : null;

  const rows = combatTab === 'active' ? activeRows : inactiveRows;

  const isActiveTurn = (i: number) => {
    if (combatTab !== 'active') return false;
    const row = rows[i];
    if (!row) return false;
    if (orderActive && activeTurnId) return row.id === activeTurnId;
    return turnIndex >= 0 && i === turnIndex;
  };

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
      { id: 'calendar', label: 'Calendário', onClick: () => navigate(`/${system}/party/${party.id}/calendar`) },
    ],
    [navigate, party.id, system],
  );

  const showEmptyActive = combatTab === 'active' && rows.length === 0;
  const showEmptyInactive = combatTab === 'inactive' && rows.length === 0;

  const showGm = isMaster && !spectatorMode;

  return (
    <>
      {showGm && <div className={styles.gmStrip} aria-hidden />}
      <Topbar title={party.name ? `Grupo - ${party.name}` : 'Grupo'} />
      {!spectatorMode && (
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
      )}
      <div className={styles.gmContainer}>
        {showGm && (
          <div className={styles.gmBadge}>
            <span className={styles.gmBadgeDot} aria-hidden />
            MESTRE
          </div>
        )}
        <div className={styles.gmSection}>
          {showGm && <CombatToolbar />}
          {showGm && (
            <SegmentedControl
              className={styles.combatTabs}
              options={[
                { value: 'active', label: 'Ativos' },
                {
                  value: 'inactive',
                  label: inactiveRows.length > 0 ? `Inativos (${inactiveRows.length})` : 'Inativos',
                },
              ]}
              value={combatTab}
              onChange={(v) => setCombatTab(v as 'active' | 'inactive')}
            />
          )}
          {showEmptyActive ? (
            <EmptyState
              icon="🎲"
              title="Nenhum participante ativo no combate."
              hint="Os personagens da party aparecem aqui. Inativos ficam na aba Inativos. Use o botão abaixo para inimigos."
            />
          ) : showEmptyInactive ? (
            <EmptyState
              icon="💤"
              title="Nenhum personagem inativo."
              hint="Use Inativar no card de um personagem na aba Ativos."
            />
          ) : (
            <div className={styles.cardsWrapper}>
              {rows.map((row, i) => (
                <CombatCard
                  key={row.id}
                  row={row}
                  isActiveTurn={isActiveTurn(i)}
                  listVariant={combatTab === 'inactive' ? 'inactive' : 'active'}
                  spectatorMode={spectatorMode}
                />
              ))}
            </div>
          )}
          {showGm && combatTab === 'active' && (
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
            type="text"
            inputMode="numeric"
            value={newEnemyHp}
            onChange={(e) => setNewEnemyHp(e.target.value)}
            onFocus={(e) => e.target.select()}
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

      {combatTab === 'active' ? <MiniOrder rows={activeRows} /> : null}

      {isMaster && (
        <button
          type="button"
          className={`${styles.spectatorFab} ${spectatorMode ? styles.spectatorFabActive : ''}`}
          onClick={() => setSpectatorMode((prev) => !prev)}
          title={spectatorMode ? 'Sair do Modo Espectador' : 'Modo Espectador'}
          aria-label={spectatorMode ? 'Sair do Modo Espectador' : 'Ativar Modo Espectador'}
        >
          {spectatorMode ? <EyeOff size={22} /> : <Eye size={22} />}
        </button>
      )}
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

