import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast/Toast';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import TormentaSheetBody from '../../components/sheet/TormentaSheetBody/TormentaSheetBody';
import SheetSkeleton from '../../components/sheet/SheetSkeleton/SheetSkeleton';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './CharacterSheetPage.module.css';

function CharacterSheetInner() {
  const { character, loadCharacter, refreshList } = useCharacterContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loadDone, setLoadDone] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');

    if (!idParam) {
      navigate('/characters', { replace: true });
      return;
    }

    setLoadDone(false);
    setLoadError(false);

    (async () => {
      try {
        await refreshList();
        await loadCharacter(idParam);
      } catch (err) {
        // apiLoadCharacter só retorna null (sem lançar) quando o personagem não
        // existe ou não é do usuário — chegar aqui é sempre falha de rede/servidor,
        // nunca "acesso negado". Ver [[ficha-v2-migration]] / memória do projeto.
        console.error('Erro ao carregar personagem:', err);
        setLoadError(true);
        showToast('Não foi possível carregar a ficha. Verifique sua conexão.', 'default');
      } finally {
        setLoadDone(true);
      }
    })();
  };

  useEffect(load, []);

  if (loadError) {
    return (
      <div className={styles.loading}>
        Não foi possível carregar a ficha.
        <button type="button" onClick={load} className={styles.retryButton}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (loadDone && !character) return <AccessDeniedPage />;

  if (!character) {
    return <SheetSkeleton />;
  }

  return <TormentaSheetBody />;
}

function CharacterSheetProviderWrapper({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  return <CharacterProvider showToast={showToast}>{children}</CharacterProvider>;
}

// O ToastProvider vive no root (main.tsx), não aqui: aninhar dois faria o
// cleanup do de dentro apagar o handler global registrado pelo de fora.
export default function CharacterSheetPage() {
  return (
    <CharacterSheetProviderWrapper>
      <CharacterSheetInner />
    </CharacterSheetProviderWrapper>
  );
}
