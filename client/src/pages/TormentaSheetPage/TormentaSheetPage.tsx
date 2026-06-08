import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Backpack,
  BookOpen,
  ChevronDown,
  Download,
  EyeOff,
  FileText,
  HeartPulse,
  ScrollText,
  Sparkles,
  Swords,
  Target,
} from 'lucide-react';
import { ToastProvider, useToast } from '../../components/ui/Toast/Toast';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import { SECTION_ID_LEGACY_PT, SECTION_LABELS, isSectionHidden } from '../../data/constants';
import Topbar from '../../components/layout/Topbar/Topbar';
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
import { calcTotalDefense } from '../../utils/calculations';
import { downloadCharacterJson } from '../../utils/exportCharacter';
import styles from './TormentaSheetPage.module.css';

const PLAY_ZONES = [
  { id: 'zone-turn', label: 'Turno', icon: HeartPulse },
  { id: 'zone-combat', label: 'Combate', icon: Swords },
  { id: 'zone-grimoire', label: 'Grimorio', icon: Sparkles },
  { id: 'zone-kit', label: 'Carga', icon: Backpack },
];

type DrawerId = 'progression' | 'notes' | 'logs' | 'skills';

function scrollToZone(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clampPct(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function TormentaSheetInner() {
  const {
    character,
    updateCharacter,
    loadCharacter,
    refreshList,
    saveStatus,
  } = useCharacterContext();

  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState<DrawerId | null>(null);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
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

  const isHidden = (id: string) => isSectionHidden(character?.hiddenSections, id);

  if (loadDone && !character) return <AccessDeniedPage />;

  if (!character) {
    return <div className={styles.loading}>Carregando personagem...</div>;
  }

  const classLine = character.classes.length
    ? character.classes.map((c) => `${c.name || 'Classe'} ${c.level || 1}`).join(' / ')
    : 'Classe indefinida';
  const hpPct = character.hp.max > 0 ? (character.hp.current / character.hp.max) * 100 : 0;
  const mpPct = character.mp.max > 0 ? (character.mp.current / character.mp.max) * 100 : 0;
  const activeBuffs = character.buffs.filter((buff) => buff.active).length;
  const saveLabel = saveStatus === 'saving' ? 'Salvando' : saveStatus === 'error' ? 'Erro ao salvar' : 'Salvo';

  return (
    <div className={styles.tormentaWorkbench}>
      <Topbar title={character.name} systemBrand="tormenta" />

      <nav className={styles.sheetNav} aria-label="Zonas da ficha">
        <div className={styles.zoneRail}>
          {PLAY_ZONES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={styles.zoneButton} onClick={() => scrollToZone(id)}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
          <button type="button" className={styles.zoneButton} onClick={() => setDrawerOpen('skills')}>
            <Target size={18} aria-hidden="true" />
            <span>Pericias</span>
          </button>
        </div>

        <div className={styles.visibilityDock}>
          <button
            type="button"
            className={styles.visibilityButton}
            onClick={() => setVisibilityOpen((open) => !open)}
            aria-expanded={visibilityOpen}
          >
            <EyeOff size={18} aria-hidden="true" />
            <span>Secoes</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>

          {visibilityOpen && (
            <div className={styles.visibilityPanel}>
              {sections.map((item) => (
                <label key={item.id} className={styles.visibilityItem}>
                  <input
                    type="checkbox"
                    checked={!item.hidden}
                    onChange={() => toggleHiddenSection(item.id)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className={styles.container}>
        <section className={styles.commandDeck} aria-label="Resumo de sessao">
          <div className={styles.identityPanel}>
            <div className={styles.avatarFrame}>
              {character.avatar ? (
                <img src={character.avatar} alt={character.name} />
              ) : (
                <span>{character.name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className={styles.identityText}>
              <span className={styles.eyebrow}>Ficha de Tormenta</span>
              <h1>{character.name || 'Personagem sem nome'}</h1>
              <p>{classLine}</p>
              <div className={styles.identityTags}>
                <span>{character.race || 'Raca'}</span>
                <span>{character.origin || 'Origem'}</span>
                <span>{character.size || 'Tamanho'}</span>
              </div>
            </div>
          </div>

          <div className={styles.pulsePanel}>
            <div className={styles.pulseHeader}>
              <span>Estado de mesa</span>
              <strong className={styles[saveStatus]}>{saveLabel}</strong>
            </div>
            <div className={styles.pulseGrid}>
              <div className={styles.pulseCard}>
                <span className={styles.pulseLabel}>PV</span>
                <strong>{character.hp.current}</strong>
                <span>de {character.hp.max}</span>
                <div className={styles.meter}>
                  <i style={{ width: clampPct(hpPct) }} />
                </div>
              </div>
              <div className={styles.pulseCard}>
                <span className={styles.pulseLabel}>PM</span>
                <strong>{character.mp.current}</strong>
                <span>de {character.mp.max}</span>
                <div className={`${styles.meter} ${styles.mana}`}>
                  <i style={{ width: clampPct(mpPct) }} />
                </div>
              </div>
              <div className={styles.pulseCard}>
                <span className={styles.pulseLabel}>CA</span>
                <strong>{calcTotalDefense(character)}</strong>
                <span>defesa</span>
              </div>
              <div className={styles.pulseCard}>
                <span className={styles.pulseLabel}>Ativos</span>
                <strong>{activeBuffs}</strong>
                <span>buffs</span>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.mobileMission}>
          {PLAY_ZONES.map((zone) => (
            <button key={zone.id} type="button" onClick={() => scrollToZone(zone.id)}>
              {zone.label}
            </button>
          ))}
        </div>

        <section id="zone-turn" className={`${styles.playZone} ${styles.turnZone}`}>
          <div className={styles.zoneIntro}>
            <span>Turno agora</span>
            <p>Recursos, efeitos e decisoes rapidas ficam juntos.</p>
          </div>
          <div className={styles.turnGrid}>
            <div className={styles.vitalColumn}>
              {!isHidden('secHpMp') && <HpMp />}
              {!isHidden('secEffects') && <TemporaryEffects />}
            </div>
            <div className={styles.controlColumn}>
              {!isHidden('secAttributes') && <AttributesDefense />}
              {!isHidden('secBuffs') && <BuffsList />}
            </div>
          </div>
        </section>

        <section id="zone-combat" className={styles.playZone}>
          <div className={styles.zoneIntro}>
            <span>Combate</span>
            <p>Acoes ofensivas em uma faixa propria, longe de botoes administrativos.</p>
          </div>
          {!isHidden('secAttacks') && <AttacksList />}
        </section>

        <section id="zone-grimoire" className={`${styles.playZone} ${styles.codexZone}`}>
          <div className={styles.zoneIntro}>
            <span>Grimorio</span>
            <p>Magias e poderes lado a lado no desktop, empilhados no celular.</p>
          </div>
          <div className={styles.codexGrid}>
            {!isHidden('secSpells') && <SpellsList />}
            {!isHidden('secAbilities') && <AbilitiesList />}
          </div>
        </section>

        <section id="zone-kit" className={styles.playZone}>
          <div className={styles.zoneIntro}>
            <span>Carga e identidade</span>
            <p>Dados duradouros da ficha ficam fora do fluxo urgente do turno.</p>
          </div>
          <div className={styles.archiveGrid}>
            {!isHidden('secHeader') && <BasicInfo />}
            {!isHidden('secInventory') && <Inventory />}
            {!isHidden('secProficiencies') && <Proficiencies />}
          </div>
        </section>
      </main>

      <div className={styles.archiveDock} aria-label="Acoes auxiliares">
        <button className={styles.archiveButton} onClick={() => setDrawerOpen('skills')} title="Pericias">
          <Target size={20} aria-hidden="true" />
          <span>Pericias</span>
        </button>
        <button className={styles.archiveButton} onClick={() => setDrawerOpen('progression')} title="Progressao">
          <ScrollText size={20} aria-hidden="true" />
          <span>Progressao</span>
        </button>
        <button className={styles.archiveButton} onClick={() => setDrawerOpen('notes')} title="Anotacoes">
          <BookOpen size={20} aria-hidden="true" />
          <span>Notas</span>
        </button>
        <button className={styles.archiveButton} onClick={() => setDrawerOpen('logs')} title="Logs">
          <FileText size={20} aria-hidden="true" />
          <span>Logs</span>
        </button>
        <button
          className={styles.archiveButton}
          onClick={() => downloadCharacterJson(character)}
          title="Exportar personagem (JSON)"
        >
          <Download size={20} aria-hidden="true" />
          <span>Exportar</span>
        </button>
      </div>

      <Drawer open={drawerOpen === 'skills'} onClose={() => setDrawerOpen(null)} title="Pericias">
        <SkillsList />
      </Drawer>
      <Drawer open={drawerOpen === 'progression'} onClose={() => setDrawerOpen(null)} title="Progressao">
        <ProgressionDrawer />
      </Drawer>
      <Drawer open={drawerOpen === 'notes'} onClose={() => setDrawerOpen(null)} title="Anotacoes">
        <NotesDrawer />
      </Drawer>
      <Drawer open={drawerOpen === 'logs'} onClose={() => setDrawerOpen(null)} title="Logs de Combate">
        <LogsDrawer />
      </Drawer>
    </div>
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
