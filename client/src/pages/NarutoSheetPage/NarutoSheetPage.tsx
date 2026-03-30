import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from '../../components/ui/Toast/Toast';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import { isSectionHidden } from '../../data/constants';
import { NARUTO_SECTION_LABELS } from '../../features/naruto/data/narutoConstants';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import Drawer from '../../components/ui/Drawer/Drawer';
import NarutoBasicInfo from '../../features/naruto/components/NarutoBasicInfo/NarutoBasicInfo';
import NarutoAttributes from '../../features/naruto/components/NarutoAttributes/NarutoAttributes';
import NarutoEnergies from '../../features/naruto/components/NarutoEnergies/NarutoEnergies';
import NarutoCombatStats from '../../features/naruto/components/NarutoCombatStats/NarutoCombatStats';
import NarutoSocial from '../../features/naruto/components/NarutoSocial/NarutoSocial';
import NarutoSkills from '../../features/naruto/components/NarutoSkills/NarutoSkills';
import NarutoPowers from '../../features/naruto/components/NarutoPowers/NarutoPowers';
import NarutoAptitudes from '../../features/naruto/components/NarutoAptitudes/NarutoAptitudes';
import NarutoJutsus from '../../features/naruto/components/NarutoJutsus/NarutoJutsus';
import NarutoAttacks from '../../features/naruto/components/NarutoAttacks/NarutoAttacks';
import NarutoDamageCalc from '../../features/naruto/components/NarutoDamageCalc/NarutoDamageCalc';
import NarutoInventory from '../../features/naruto/components/NarutoInventory/NarutoInventory';
import NarutoConfigDrawer from '../../features/naruto/components/NarutoConfigDrawer/NarutoConfigDrawer';
import NarutoDatabook from '../../features/naruto/components/NarutoDatabook/NarutoDatabook';
import NotesDrawer from '../../components/character/NotesDrawer/NotesDrawer';
import LogsDrawer from '../../components/character/LogsDrawer/LogsDrawer';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './NarutoSheetPage.module.css';

type DrawerKind = 'skills' | 'config' | 'databook' | 'notes' | 'logs' | null;

function NarutoSheetInner() {
  const { character, updateCharacter, loadCharacter, refreshList } = useCharacterContext();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState<DrawerKind>(null);
  const [loadDone, setLoadDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (!idParam) { navigate('/characters', { replace: true }); return; }
    (async () => {
      try { await refreshList(); await loadCharacter(idParam); }
      catch (err) { console.error('Erro ao carregar personagem:', err); }
      finally { setLoadDone(true); }
    })();
  }, []);

  const sections = useMemo(
    () => Object.entries(NARUTO_SECTION_LABELS).map(([id, label]) => ({
      id, label, hidden: isSectionHidden(character?.hiddenSections, id),
    })),
    [character?.hiddenSections],
  );

  const toggleHiddenSection = useCallback(
    (id: string) => {
      updateCharacter((f) => {
        const wasHidden = isSectionHidden(f.hiddenSections, id);
        const next = { ...f.hiddenSections, [id]: !wasHidden };
        return { ...f, hiddenSections: next };
      });
    },
    [updateCharacter],
  );

  const isHidden = (id: string) => isSectionHidden(character?.hiddenSections, id);

  if (loadDone && !character) return <AccessDeniedPage />;
  if (!character) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        Carregando personagem...
      </div>
    );
  }

  return (
    <>
      <Topbar title={`${character.name}`} systemBrand="naruto" />

      <SectionNav
        items={sections}
        useScrollObserver
        hiddenSections={character.hiddenSections}
        onToggleHidden={toggleHiddenSection}
      />

      <main className={styles.container}>
        {!isHidden('secHeader') && <NarutoBasicInfo />}

        <div className={styles.layoutTop}>
          <div className={styles.colLeft}>
            {!isHidden('secAttributes') && <NarutoAttributes />}
            {!isHidden('secCombat') && <NarutoCombatStats />}
          </div>
          <div className={styles.colRight}>
            {!isHidden('secEnergies') && <NarutoEnergies />}
            {!isHidden('secSocial') && <NarutoSocial />}
          </div>
        </div>

        {!isHidden('secJutsus') && <NarutoJutsus />}
        {!isHidden('secAttacks') && <NarutoAttacks />}

        {!isHidden('secPowers') && <NarutoPowers />}
        {!isHidden('secAptitudes') && <NarutoAptitudes />}

        {!isHidden('secDamage') && <NarutoDamageCalc />}
        {!isHidden('secInventory') && <NarutoInventory />}
      </main>

      <div className={styles.drawerTabs}>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('skills')} title="Perícias">🎯</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('databook')} title="Databook">📖</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('config')} title="Configurações">⚙️</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('notes')} title="Anotações">📝</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('logs')} title="Logs">📋</button>
      </div>

      <Drawer open={drawerOpen === 'skills'} onClose={() => setDrawerOpen(null)} title="Perícias">
        <NarutoSkills />
      </Drawer>
      <Drawer open={drawerOpen === 'databook'} onClose={() => setDrawerOpen(null)} title="Databook">
        <NarutoDatabook />
      </Drawer>
      <Drawer open={drawerOpen === 'config'} onClose={() => setDrawerOpen(null)} title="Configurações">
        <NarutoConfigDrawer />
      </Drawer>
      <Drawer open={drawerOpen === 'notes'} onClose={() => setDrawerOpen(null)} title="Anotações">
        <NotesDrawer />
      </Drawer>
      <Drawer open={drawerOpen === 'logs'} onClose={() => setDrawerOpen(null)} title="Logs de Combate">
        <LogsDrawer />
      </Drawer>
    </>
  );
}

export default function NarutoSheetPage() {
  return (
    <ToastProvider>
      <NarutoSheetProviderWrapper>
        <NarutoSheetInner />
      </NarutoSheetProviderWrapper>
    </ToastProvider>
  );
}

function NarutoSheetProviderWrapper({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  return <CharacterProvider showToast={showToast}>{children}</CharacterProvider>;
}
