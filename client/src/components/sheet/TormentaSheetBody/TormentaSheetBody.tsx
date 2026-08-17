import { useState, type ReactNode } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import Topbar from '../../layout/Topbar/Topbar';
import VitalBar from '../VitalBar/VitalBar';
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
          <Topbar title={character.name} systemBrand="tormenta" />
          <div className={styles.desktopBody}>
            {topBanner}
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
        <VitalBar />
        {topBanner && <div className={styles.bannerSlot}>{topBanner}</div>}
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
