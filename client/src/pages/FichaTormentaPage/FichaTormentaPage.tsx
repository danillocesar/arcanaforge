import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from '../../components/ui/Toast/Toast';
import { FichaProvider, useFichaContext } from '../../contexts/FichaContext';
import { SEC_NOMES } from '../../data/constants';
import Topbar, { topbarStyles } from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';
import Drawer from '../../components/ui/Drawer/Drawer';
import InfoBasica from '../../components/ficha/InfoBasica/InfoBasica';
import AtributosDefesa from '../../components/ficha/AtributosDefesa/AtributosDefesa';
import BuffsList from '../../components/ficha/BuffsList/BuffsList';
import VidaMana from '../../components/ficha/VidaMana/VidaMana';
import EfeitosTemporarios from '../../components/ficha/EfeitosTemporarios/EfeitosTemporarios';
import AtaquesList from '../../components/ficha/AtaquesList/AtaquesList';
import MagiasList from '../../components/ficha/MagiasList/MagiasList';
import HabilidadesList from '../../components/ficha/HabilidadesList/HabilidadesList';
import Inventario from '../../components/ficha/Inventario/Inventario';
import Proficiencias from '../../components/ficha/Proficiencias/Proficiencias';
import PericiasList from '../../components/ficha/PericiasList/PericiasList';
import ProgressaoDrawer from '../../components/ficha/ProgressaoDrawer/ProgressaoDrawer';
import AnotacoesDrawer from '../../components/ficha/AnotacoesDrawer/AnotacoesDrawer';
import LogsDrawer from '../../components/ficha/LogsDrawer/LogsDrawer';
import styles from './FichaTormentaPage.module.css';

function FichaTormentaInner() {
  const {
    ficha,
    saveStatus,
    updateFicha,
    loadFicha,
    refreshList,
  } = useFichaContext();

  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState<'progressao' | 'anotacoes' | 'logs' | 'pericias' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');

    if (!idParam) {
      navigate('/personagens', { replace: true });
      return;
    }

    (async () => {
      try {
        await refreshList();
        await loadFicha(idParam);
      } catch (err) {
        console.error('Erro ao carregar ficha:', err);
      }
    })();
  }, []);

  const sections = useMemo(() => {
    const ocultas = ficha?.secoesOcultas || {};
    return Object.entries(SEC_NOMES).map(([id, label]) => ({
      id,
      label,
      hidden: !!ocultas[id],
    }));
  }, [ficha?.secoesOcultas]);

  const toggleOculta = useCallback(
    (id: string) => {
      updateFicha((f) => ({
        ...f,
        secoesOcultas: {
          ...f.secoesOcultas,
          [id]: !f.secoesOcultas?.[id],
        },
      }));
    },
    [updateFicha],
  );

  const handlePericiasClick = useCallback(() => {
    setDrawerOpen('pericias');
  }, []);

  const isHidden = (id: string) => !!ficha?.secoesOcultas?.[id];

  const saveStatusText =
    saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'error' ? 'Erro!' : 'Salvo';
  const saveStatusClass =
    saveStatus === 'saving'
      ? topbarStyles.saving
      : saveStatus === 'error'
        ? topbarStyles.error
        : topbarStyles.saved;

  if (!ficha) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        Carregando ficha...
      </div>
    );
  }

  return (
    <>
      <Topbar
        title={`Tormenta - ${ficha.nome}`}
        right={
          <span className={`${topbarStyles.saveStatus} ${saveStatusClass}`}>{saveStatusText}</span>
        }
      />

      <SectionNav
        sections={sections}
        onPericiasClick={handlePericiasClick}
        secoesOcultas={ficha.secoesOcultas}
        onToggleOculta={toggleOculta}
      />

      <main className={styles.container}>
        {!isHidden('secCabecalho') && (
          <InfoBasica />
        )}

        <div className={styles.layoutTopo}>
          <div className={styles.colInfo}>
            {!isHidden('secAtributos') && (
              <AtributosDefesa />
            )}
            {!isHidden('secBuffs') && (
              <BuffsList />
            )}
          </div>
          <div className={styles.colStats}>
            {!isHidden('secVidaMana') && (
              <VidaMana />
            )}
            {!isHidden('secEfeitos') && (
              <EfeitosTemporarios />
            )}
          </div>
        </div>

        {!isHidden('secAtaques') && (
          <AtaquesList />
        )}

        <div className={styles.layoutMeio}>
          {!isHidden('secMagias') && (
            <MagiasList />
          )}
          {!isHidden('secHabilidades') && (
            <HabilidadesList />
          )}
        </div>

        {!isHidden('secInventario') && (
          <Inventario />
        )}

        {!isHidden('secProficiencias') && (
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
  return <FichaProvider showToast={showToast}>{children}</FichaProvider>;
}
