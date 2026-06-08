import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from '../../components/ui/Toast/Toast';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import VitalBar from '../../components/sheet/VitalBar/VitalBar';
import TabNav from '../../components/sheet/TabNav/TabNav';
import AttributesPanel from '../../components/sheet/AttributesPanel/AttributesPanel';
import BuffsPanel from '../../components/sheet/BuffsPanel/BuffsPanel';
import SkillsPanel from '../../components/sheet/SkillsPanel/SkillsPanel';
import PoderesPanel from '../../components/sheet/PoderesPanel/PoderesPanel';
import MagiasPanel from '../../components/sheet/MagiasPanel/MagiasPanel';
import EquipamentosPanel from '../../components/sheet/EquipamentosPanel/EquipamentosPanel';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import styles from './CharacterSheetPage.module.css';

type SectionId = 'atributos' | 'pericias' | 'poderes' | 'magias' | 'equipamentos';

const SECTIONS: Array<{ id: SectionId; label: string; icon: string }> = [
  { id: 'atributos', label: 'Atributos', icon: '◈' },
  { id: 'pericias', label: 'Perícias', icon: '✓' },
  { id: 'poderes', label: 'Poderes', icon: '✦' },
  { id: 'magias', label: 'Magias', icon: '🜂' },
  { id: 'equipamentos', label: 'Equipamentos', icon: '🜸' },
];

function renderSection(id: SectionId, editMode: boolean) {
  switch (id) {
    case 'atributos':
      return (
        <>
          <AttributesPanel editMode={editMode} />
          <BuffsPanel editMode={editMode} />
        </>
      );
    case 'pericias':
      return <SkillsPanel editMode={editMode} />;
    case 'poderes':
      return <PoderesPanel editMode={editMode} />;
    case 'magias':
      return <MagiasPanel editMode={editMode} />;
    case 'equipamentos':
      return <EquipamentosPanel editMode={editMode} />;
    default:
      return null;
  }
}

function CharacterSheetInner() {
  const { character, loadCharacter, refreshList } = useCharacterContext();
  const navigate = useNavigate();
  const [loadDone, setLoadDone] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [active, setActive] = useState<SectionId>('atributos');
  const isDesktop = useMediaQuery('(min-width: 900px)');

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

  if (loadDone && !character) return <AccessDeniedPage />;

  if (!character) {
    return <div className={styles.loading}>Carregando personagem...</div>;
  }

  const panel = renderSection(active, editMode);

  return (
    <div className={styles.shell}>
      <VitalBar
        editMode={editMode}
        onToggleEdit={() => setEditMode((e) => !e)}
        onOpenMenu={() => { /* identity/notes/logs menu — Phase G */ }}
      />

      {isDesktop ? (
        <div className={styles.desktopBody}>
          <aside className={styles.sidebar}>
            <TabNav sections={SECTIONS} active={active} onChange={(id) => setActive(id as SectionId)} variant="sidebar" />
          </aside>
          <main className={styles.detail}>{panel}</main>
        </div>
      ) : (
        <>
          <main className={styles.mobileBody}>{panel}</main>
          <TabNav sections={SECTIONS} active={active} onChange={(id) => setActive(id as SectionId)} variant="tabs" />
        </>
      )}
    </div>
  );
}

function CharacterSheetProviderWrapper({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  return <CharacterProvider showToast={showToast}>{children}</CharacterProvider>;
}

export default function CharacterSheetPage() {
  return (
    <ToastProvider>
      <CharacterSheetProviderWrapper>
        <CharacterSheetInner />
      </CharacterSheetProviderWrapper>
    </ToastProvider>
  );
}
