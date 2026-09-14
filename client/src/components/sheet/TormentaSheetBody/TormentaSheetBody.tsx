import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import Topbar from '../../layout/Topbar/Topbar';
import VitalBar from '../VitalBar/VitalBar';
import SheetBackground from '../SheetBackground/SheetBackground';
import TabNav from '../TabNav/TabNav';
import MobileAppMenu from '../MobileAppMenu/MobileAppMenu';
import AttributesPanel from '../AttributesPanel/AttributesPanel';
import BuffsPanel from '../BuffsPanel/BuffsPanel';
import FixedBonusesPanel from '../FixedBonusesPanel/FixedBonusesPanel';
import AcoesPanel from '../AcoesPanel/AcoesPanel';
import SkillsPanel from '../SkillsPanel/SkillsPanel';
import PoderesPanel from '../PoderesPanel/PoderesPanel';
import MagiasPanel from '../MagiasPanel/MagiasPanel';
import EquipamentosPanel from '../EquipamentosPanel/EquipamentosPanel';
import { SheetFormProvider } from '../SheetForm/SheetFormProvider';
import styles from './TormentaSheetBody.module.css';

type SectionId = 'atributos' | 'pericias' | 'poderes' | 'magias' | 'equipamentos';

const SECTIONS: Array<{ id: SectionId; label: string; icon: string }> = [
  { id: 'atributos', label: 'Atributos', icon: '◈' },
  { id: 'pericias', label: 'Perícias', icon: '✓' },
  { id: 'poderes', label: 'Poderes', icon: '✦' },
  { id: 'magias', label: 'Magias', icon: '🜂' },
  { id: 'equipamentos', label: 'Equipamentos', icon: '🜸' },
];

function renderSection(id: SectionId) {
  switch (id) {
    case 'atributos':
      return (
        <>
          <div className={styles.atributosRow}>
            <div className={styles.atributosMain}>
              <AttributesPanel />
            </div>
            <div className={styles.atributosBuffs}>
              <BuffsPanel />
            </div>
          </div>
          <FixedBonusesPanel />
          <AcoesPanel />
        </>
      );
    case 'pericias':
      return <SkillsPanel />;
    case 'poderes':
      return <PoderesPanel />;
    case 'magias':
      return <MagiasPanel />;
    case 'equipamentos':
      return <EquipamentosPanel />;
    default:
      return null;
  }
}

interface TormentaSheetBodyProps {
  /** Extra banner rendered above the vitals (e.g. read-only indicator for party view). */
  topBanner?: ReactNode;
}

/**
 * Toast flutuante de "desfazer última alteração" — fica no canto da tela em vez
 * de empurrar o conteúdo da ficha. Some quando não há mais nada pra desfazer, ou
 * quando o próprio usuário fecha (reaparece na próxima edição, já que `canUndo`
 * fica true por toda a leva de edições, não só na primeira).
 */
function UndoBar() {
  const { canUndo, undoLastChange } = useCharacterContext();
  const [dismissed, setDismissed] = useState(false);
  const prevCanUndo = useRef(canUndo);

  useEffect(() => {
    if (canUndo && !prevCanUndo.current) {
      setDismissed(false);
    }
    prevCanUndo.current = canUndo;
  }, [canUndo]);

  if (!canUndo || dismissed) return null;

  return (
    <div className={styles.undoToast} role="status">
      <span>Última alteração salva</span>
      <button type="button" className={styles.undoButton} onClick={undoLastChange}>
        ↺ Desfazer
      </button>
      <button
        type="button"
        className={styles.undoDismiss}
        onClick={() => setDismissed(true)}
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Shared Tormenta sheet shell (vitals + tab navigation + panels), used both by the
 * owner's editable sheet and the read-only party-member view.
 */
function TormentaSheetBody({ topBanner }: TormentaSheetBodyProps) {
  const { character } = useCharacterContext();
  const [active, setActive] = useState<SectionId>('atributos');
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 900px)');

  if (!character) return null;

  const panel = renderSection(active);

  if (isDesktop) {
    return (
      <SheetFormProvider>
        <div className={styles.shell}>
          <SheetBackground url={character.avatar} />
          <Topbar title={character.name} />
          <div className={styles.desktopBody}>
            {topBanner}
            <UndoBar />
            <VitalBar desktop />
            <div className={styles.desktopGrid}>
              <aside className={styles.sidebar}>
                <TabNav sections={SECTIONS} active={active} onChange={(id) => setActive(id as SectionId)} variant="sidebar" />
              </aside>
              <main className={styles.detail}>{panel}</main>
            </div>
          </div>
        </div>
      </SheetFormProvider>
    );
  }

  return (
    <SheetFormProvider>
      <div className={styles.shell}>
        <SheetBackground url={character.avatar} />
        <VitalBar />
        {topBanner && <div className={styles.bannerSlot}>{topBanner}</div>}
        <UndoBar />
        <main className={styles.mobileBody}>{panel}</main>
        <TabNav
          sections={SECTIONS}
          active={active}
          onChange={(id) => setActive(id as SectionId)}
          variant="tabs"
          trailing={{ label: 'Menu', icon: '☰', onClick: () => setMenuOpen(true), active: menuOpen }}
        />
        <MobileAppMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </SheetFormProvider>
  );
}

TormentaSheetBody.displayName = 'TormentaSheetBody';

export default TormentaSheetBody;
