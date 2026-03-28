import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from '../../components/ui/Toast/Toast';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import { SECTION_LABELS, isSectionHidden, SECTION_ID_LEGACY_PT } from '../../data/constants';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import Drawer from '../../components/ui/Drawer/Drawer';
import BasicInfo from '../../components/character/BasicInfo/BasicInfo';
import AttributesDefense from '../../components/character/AttributesDefense/AttributesDefense';
import BuffsList from '../../components/character/BuffsList/BuffsList';
import HpMp from '../../components/character/HpMp/HpMp';
import TemporaryEffects from '../../components/character/TemporaryEffects/TemporaryEffects';
import AttacksList from '../../components/character/AttacksList/AttacksList';
import SpellsList from '../../components/character/SpellsList/SpellsList';
import AbilitiesList from '../../components/character/AbilitiesList/AbilitiesList';
import Inventory from '../../components/character/Inventory/Inventory';
import Proficiencies from '../../components/character/Proficiencies/Proficiencies';
import SkillsList from '../../components/character/SkillsList/SkillsList';
import ProgressionDrawer from '../../components/character/ProgressionDrawer/ProgressionDrawer';
import NotesDrawer from '../../components/character/NotesDrawer/NotesDrawer';
import LogsDrawer from '../../components/character/LogsDrawer/LogsDrawer';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './TormentaSheetPage.module.css';

function TormentaSheetInner() {
  const {
    character,
    updateCharacter,
    loadCharacter,
    refreshList,
  } = useCharacterContext();

  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState<'progression' | 'notes' | 'logs' | 'skills' | null>(null);
  const [loadDone, setLoadDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');

    if (!idParam) {
      navigate('/characters', { replace: true });
      return;
    }

    (async () => {
      try {
        await refreshList();
        await loadCharacter(idParam);
      } catch (err) {
        console.error('Erro ao carregar personagem:', err);
      } finally {
        setLoadDone(true);
      }
    })();
  }, []);

  const sections = useMemo(() => {
    return Object.entries(SECTION_LABELS).map(([id, label]) => ({
      id,
      label,
      hidden: isSectionHidden(character?.hiddenSections, id),
    }));
  }, [character?.hiddenSections]);

  const toggleHiddenSection = useCallback(
    (id: string) => {
      updateCharacter((f) => {
        const wasHidden = isSectionHidden(f.hiddenSections, id);
        const next = { ...f.hiddenSections };
        const legacyPtKey = Object.entries(SECTION_ID_LEGACY_PT).find(([, en]) => en === id)?.[0];
        if (legacyPtKey) delete next[legacyPtKey];
        next[id] = !wasHidden;
        return { ...f, hiddenSections: next };
      });
    },
    [updateCharacter],
  );

  const handleSkillsClick = useCallback(() => {
    setDrawerOpen('skills');
  }, []);

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
      <Topbar
        title={`${character.name}`}
        systemBrand="tormenta"
      />

      <SectionNav
        items={sections.map((s) =>
          s.id === 'secSkills' ? { ...s, onClick: handleSkillsClick } : s,
        )}
        useScrollObserver
        hiddenSections={character.hiddenSections}
        onToggleHidden={toggleHiddenSection}
      />

      <main className={styles.container}>
        {!isHidden('secHeader') && (
          <BasicInfo />
        )}

        <div className={styles.layoutTop}>
          <div className={styles.colInfo}>
            {!isHidden('secAttributes') && (
              <AttributesDefense />
            )}
            {!isHidden('secBuffs') && (
              <BuffsList />
            )}
          </div>
          <div className={styles.colStats}>
            {!isHidden('secHpMp') && (
              <HpMp />
            )}
            {!isHidden('secEffects') && (
              <TemporaryEffects />
            )}
          </div>
        </div>

        {!isHidden('secAttacks') && (
          <AttacksList />
        )}

        <div className={styles.layoutMiddle}>
          {!isHidden('secSpells') && (
            <SpellsList />
          )}
          {!isHidden('secAbilities') && (
            <AbilitiesList />
          )}
        </div>

        {!isHidden('secInventory') && (
          <Inventory />
        )}

        {!isHidden('secProficiencies') && (
          <Proficiencies />
        )}

      </main>

      <div className={styles.drawerTabs}>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('skills')} title="Perícias">🎯</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('progression')} title="Progressão">📜</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('notes')} title="Anotações">📝</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('logs')} title="Logs">📋</button>
      </div>

      <Drawer open={drawerOpen === 'skills'} onClose={() => setDrawerOpen(null)} title="Perícias">
        <SkillsList />
      </Drawer>
      <Drawer open={drawerOpen === 'progression'} onClose={() => setDrawerOpen(null)} title="Progressão">
        <ProgressionDrawer />
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

export default function TormentaSheetPage() {
  return (
    <ToastProvider>
      <TormentaSheetProviderWrapper>
        <TormentaSheetInner />
      </TormentaSheetProviderWrapper>
    </ToastProvider>
  );
}

function TormentaSheetProviderWrapper({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  return <CharacterProvider showToast={showToast}>{children}</CharacterProvider>;
}
