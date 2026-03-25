import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import styles from './FichaPage.module.css';

function FichaInner() {
  const {
    ficha,
    fichasList,
    saveStatus,
    updateFicha,
    loadFicha,
    novoPersonagem,
    excluirPersonagem,
    refreshList,
  } = useFichaContext();

  const { showToast } = useToast();
  const navigate = useNavigate();
  const [secvisOpen, setSecvisOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState<'progressao' | 'anotacoes' | 'logs' | 'pericias' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const charParam = params.get('char');

    if (!charParam) {
      navigate('/select', { replace: true });
      return;
    }

    (async () => {
      await refreshList();
      await loadFicha(charParam);
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

  const toggleSecao = useCallback(
    (id: string) => {
      updateFicha((f) => ({
        ...f,
        secoesFechadas: {
          ...f.secoesFechadas,
          [id]: !f.secoesFechadas[id],
        },
      }));
    },
    [updateFicha],
  );

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

  const handleNovoPersonagem = () => {
    const nome = prompt('Nome do novo personagem:');
    if (nome?.trim()) {
      novoPersonagem(nome.trim());
    }
  };

  const handleExcluir = () => {
    if (ficha && confirm(`Excluir "${ficha.nome}"?`)) {
      excluirPersonagem();
    }
  };

  const handlePericiasClick = useCallback(() => {
    setDrawerOpen('pericias');
  }, []);

  const isHidden = (id: string) => !!ficha?.secoesOcultas?.[id];
  const isCollapsed = (id: string) => !!ficha?.secoesFechadas?.[id];

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
        left={
          <>
            <span className={topbarStyles.logo}>ArcanaForge</span>
            <Link to="/mestre" className={topbarStyles.modeLink}>
              ⚔ Combate
            </Link>
          </>
        }
        center={
          <>
            <select
              className={topbarStyles.select}
              value={ficha.nome}
              onChange={(e) => loadFicha(e.target.value)}
            >
              {fichasList.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button type="button" className={topbarStyles.iconBtn} onClick={handleNovoPersonagem} title="Novo Personagem">
              +
            </button>
            <button type="button" className={topbarStyles.iconBtn} onClick={handleExcluir} title="Excluir Personagem">
              🗑
            </button>
            <Link to="/select" className={topbarStyles.iconBtn} title="Tela de Seleção">
              ⚙
            </Link>
          </>
        }
        right={
          <>
            <span className={`${topbarStyles.saveStatus} ${saveStatusClass}`}>{saveStatusText}</span>
            <div className={styles.secvisWrapper}>
              <button
                type="button"
                className={styles.secvisBtn}
                onClick={() => setSecvisOpen(!secvisOpen)}
                title="Seções visíveis"
              >
                ☰
              </button>
              {secvisOpen && (
                <div className={styles.secvisPanel}>
                  {Object.entries(SEC_NOMES).map(([id, label]) => (
                    <label key={id} className={styles.secvisItem}>
                      <input
                        type="checkbox"
                        checked={!ficha.secoesOcultas?.[id]}
                        onChange={() => toggleOculta(id)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <select
              className={styles.animSelect}
              value={ficha.animacaoAtaque}
              onChange={(e) => updateFicha((f) => ({ ...f, animacaoAtaque: e.target.value }))}
            >
              <option value="personagem">⚔ Personagem</option>
              <option value="toast">💬 Toast</option>
              <option value="floating">✨ Flutuante</option>
            </select>
          </>
        }
      />

      <SectionNav sections={sections} onPericiasClick={handlePericiasClick} />

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

export default function FichaPage() {
  return (
    <ToastProvider>
      <FichaProviderWrapper>
        <FichaInner />
      </FichaProviderWrapper>
    </ToastProvider>
  );
}

function FichaProviderWrapper({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  return <FichaProvider showToast={showToast}>{children}</FichaProvider>;
}
