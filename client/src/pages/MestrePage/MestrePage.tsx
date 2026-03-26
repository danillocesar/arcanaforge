import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CombateProvider, useCombateContext } from '../../contexts/CombateContext';
import { ToastProvider } from '../../components/ui/Toast/Toast';
import Topbar, { topbarStyles } from '../../components/layout/Topbar/Topbar';
import CombateToolbar from '../../components/combate/CombateToolbar/CombateToolbar';
import CombateCard from '../../components/combate/CombateCard/CombateCard';
import MiniOrder from '../../components/combate/MiniOrder/MiniOrder';
import Modal from '../../components/ui/Modal/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import styles from './MestrePage.module.css';

function MestreContent() {
  const {
    ordenado,
    ordenadoAtivo,
    jogadores,
    mestreData,
    turnoIdx,
    modoMestre,
    setModoMestre,
    adicionarInimigo,
    loadCombate,
  } = useCombateContext();

  const [modalNovoInimigo, setModalNovoInimigo] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoPv, setNovoPv] = useState('20');

  useEffect(() => {
    loadCombate();
  }, [loadCombate]);

  useEffect(() => {
    document.title = 'Combate Tracker — ArcanaForge';
  }, []);

  const abrirModalNovoInimigo = () => {
    const n = mestreData.inimigos.length + 1;
    setNovoNome(`Inimigo ${n}`);
    setNovoPv('20');
    setModalNovoInimigo(true);
  };

  const handleSubmitNovoInimigo = (e: React.FormEvent) => {
    e.preventDefault();
    const pv = Math.max(1, Math.floor(Number(novoPv) || 1));
    const nome = novoNome.trim() || `Inimigo ${mestreData.inimigos.length + 1}`;
    adicionarInimigo(nome, pv);
    setModalNovoInimigo(false);
  };

  const rows = ordenadoAtivo
    ? ordenado
    : [
        ...jogadores.map((j) => ({
          tipo: 'jogador' as const,
          id: `jogador_${j.nome}`,
          nome: j.nome,
          iniciativa: Number(mestreData.iniciativas[`jogador_${j.nome}`]) || 0,
          pvMax: j.pvMax,
          pvAtual: j.pvAtual,
          pmMax: j.pmMax,
          pmAtual: j.pmAtual,
          avatar: j.avatar,
          classes: j.classes,
        })),
        ...mestreData.inimigos.map((ini, idx) => ({
          tipo: 'inimigo' as const,
          id: `inimigo_${idx}`,
          nome: ini.nome,
          iniciativa: ini.iniciativa ?? 0,
          pvMax: ini.pvMax,
          pvAtual: ini.pvAtual,
          limiarAlerta: ini.limiarAlerta,
          limiarCritico: ini.limiarCritico,
        })),
      ];

  const isTurno = (i: number) => turnoIdx >= 0 && i === turnoIdx;

  return (
    <>
      {modoMestre && <div className={styles.mestreStrip} aria-hidden />}
      <Topbar
        left={
          <>
            <span className={topbarStyles.logo}>ArcanaForge</span>
            <Link to="/" className={topbarStyles.modeLink} title="Fichas de Personagem">
              Personagens
            </Link>
          </>
        }
        right={
          <button
            type="button"
            className={`${styles.mestreToggle} ${modoMestre ? styles.mestreToggleActive : ''}`}
            onClick={() => setModoMestre(!modoMestre)}
            title="Ativar/desativar visão do Mestre"
          >
            {modoMestre ? '🔓 Modo Mestre' : '🔒 Modo Mestre'}
          </button>
        }
      />
      <div className={styles.mestreContainer}>
        {modoMestre && (
          <div className={styles.mestreBadge}>
            <span className={styles.mestreBadgeDot} aria-hidden />
            MODO MESTRE
          </div>
        )}
        <div className={styles.mestreSection}>
          {modoMestre && <CombateToolbar />}
          {rows.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🎲</span>
              <p>Nenhum participante no combate ainda.</p>
              <p className={styles.emptyHint}>
                Os personagens salvos aparecerão automaticamente. Use o botão abaixo para adicionar inimigos.
              </p>
            </div>
          ) : (
            <div className={styles.cardsWrapper}>
              {rows.map((row, i) => (
                <CombateCard key={row.id} row={row} isTurno={isTurno(i)} />
              ))}
            </div>
          )}
          {modoMestre && (
            <button type="button" className={styles.addInimigo} onClick={abrirModalNovoInimigo}>
              <span className={styles.addIcon}>+</span> Adicionar Inimigo
            </button>
          )}
        </div>
      </div>

      <Modal open={modalNovoInimigo} onClose={() => setModalNovoInimigo(false)}>
        <form className={styles.novoInimigoModal} onSubmit={handleSubmitNovoInimigo}>
          <h3 className={styles.novoInimigoTitle}>Novo inimigo</h3>
          <label className={styles.novoInimigoLabel} htmlFor="novo-inimigo-nome">
            Nome
          </label>
          <Input
            id="novo-inimigo-nome"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            autoFocus
          />
          <label className={styles.novoInimigoLabel} htmlFor="novo-inimigo-pv">
            PV total
          </label>
          <Input
            id="novo-inimigo-pv"
            type="number"
            min={1}
            value={novoPv}
            onChange={(e) => setNovoPv(e.target.value)}
          />
          <div className={styles.novoInimigoActions}>
            <Button type="button" variant="ghost" onClick={() => setModalNovoInimigo(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Adicionar
            </Button>
          </div>
        </form>
      </Modal>

      <MiniOrder rows={rows} />
    </>
  );
}

export default function MestrePage() {
  return (
    <ToastProvider>
      <CombateProvider>
        <MestreContent />
      </CombateProvider>
    </ToastProvider>
  );
}
