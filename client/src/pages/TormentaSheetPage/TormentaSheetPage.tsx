import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from '../../components/ui/Toast/Toast';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import { SECTION_LABELS } from '../../data/constants';
import Topbar from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import Drawer from '../../components/ui/Drawer/Drawer';
import InfoBasica from '../../components/character/BasicInfo/BasicInfo';
import AtributosDefesa from '../../components/character/AttributesDefense/AttributesDefense';
import BuffsList from '../../components/character/BuffsList/BuffsList';
import VidaMana from '../../components/character/HpMp/HpMp';
import EfeitosTemporarios from '../../components/character/TemporaryEffects/TemporaryEffects';
import AtaquesList from '../../components/character/AttacksList/AttacksList';
import MagiasList from '../../components/character/SpellsList/SpellsList';
import HabilidadesList from '../../components/character/AbilitiesList/AbilitiesList';
import Inventario from '../../components/character/Inventory/Inventory';
import Proficiencias from '../../components/character/Proficiencies/Proficiencies';
import PericiasList from '../../components/character/SkillsList/SkillsList';
import ProgressaoDrawer from '../../components/character/ProgressionDrawer/ProgressionDrawer';
import AnotacoesDrawer from '../../components/character/NotesDrawer/NotesDrawer';
import LogsDrawer from '../../components/character/LogsDrawer/LogsDrawer';
import styles from './TormentaSheetPage.module.css';

function FichaTormentaInner() {
  const {
    character,
    updateCharacter,
    loadCharacter,
    refreshList,
  } = useCharacterContext();

  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState<'progressao' | 'anotacoes' | 'logs' | 'pericias' | null>(null);

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
      }
    })();
  }, []);

  const sections = useMemo(() => {
    const ocultas = character?.hiddenSections || {};
    return Object.entries(SECTION_LABELS).map(([id, label]) => ({
      id,
      label,
      hidden: !!ocultas[id],
    }));
  }, [character?.hiddenSections]);

  const toggleOculta = useCallback(
    (id: string) => {
      updateCharacter((f) => ({
        ...f,
        hiddenSections: {
          ...f.hiddenSections,
          [id]: !f.hiddenSections?.[id],
        },
      }));
    },
    [updateCharacter],
  );

  const handlePericiasClick = useCallback(() => {
    setDrawerOpen('pericias');
  }, []);

  const isHidden = (id: string) => !!character?.hiddenSections?.[id];

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
        title={`Tormenta - ${character.name}`}
      />

      <SectionNav
        sections={sections}
        onPericiasClick={handlePericiasClick}
        secoesOcultas={character.hiddenSections}
        onToggleOculta={toggleOculta}
      />

      <main className={styles.container}>
        {!isHidden('secHeader') && (
          <InfoBasica />
        )}

        <div className={styles.layoutTop}>
          <div className={styles.colInfo}>
            {!isHidden('secAttributes') && (
              <AtributosDefesa />
            )}
            {!isHidden('secBuffs') && (
              <BuffsList />
            )}
          </div>
          <div className={styles.colStats}>
            {!isHidden('secHpMp') && (
              <VidaMana />
            )}
            {!isHidden('secEffects') && (
              <EfeitosTemporarios />
            )}
          </div>
        </div>

        {!isHidden('secAttacks') && (
          <AtaquesList />
        )}

        <div className={styles.layoutMiddle}>
          {!isHidden('secSpells') && (
            <MagiasList />
          )}
          {!isHidden('secAbilities') && (
            <HabilidadesList />
          )}
        </div>

        {!isHidden('secInventory') && (
          <Inventario />
        )}

        {!isHidden('secProficiencies') && (
          <Proficiencias />
        )}

      </main>

      <div className={styles.drawerTabs}>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('pericias')} title="Perícias">🎯</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('progressao')} title="Progressão">📜</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('anotacoes')} title="Anotações">📝</button>
        <button className={styles.drawerTab} onClick={() => setDrawerOpen('logs')} title="Logs">📋</button>
      </div>

      <Drawer open={drawerOpen === 'pericias'} onClose={() => setDrawerOpen(null)} title="Perícias">
        <PericiasList />
      </Drawer>
      <Drawer open={drawerOpen === 'progressao'} onClose={() => setDrawerOpen(null)} title="Progressão">
        <ProgressaoDrawer />
      </Drawer>
      <Drawer open={drawerOpen === 'anotacoes'} onClose={() => setDrawerOpen(null)} title="Anotações">
        <AnotacoesDrawer />
      </Drawer>
      <Drawer open={drawerOpen === 'logs'} onClose={() => setDrawerOpen(null)} title="Logs de Combate">
        <LogsDrawer />
      </Drawer>

    </>
  );
}

export default function FichaTormentaPage() {
  return (
    <ToastProvider>
      <FichaTormentaProviderWrapper>
        <FichaTormentaInner />
      </FichaTormentaProviderWrapper>
    </ToastProvider>
  );
}

function FichaTormentaProviderWrapper({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  return <CharacterProvider showToast={showToast}>{children}</CharacterProvider>;
}
