import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from '../../components/ui/Toast/Toast';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import TormentaSheetBody from '../../components/sheet/TormentaSheetBody/TormentaSheetBody';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './CharacterSheetPage.module.css';

function CharacterSheetInner() {
  const { character, loadCharacter, refreshList } = useCharacterContext();
  const navigate = useNavigate();
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

  if (loadDone && !character) return <AccessDeniedPage />;

  if (!character) {
    return <div className={styles.loading}>Carregando personagem...</div>;
  }

  return <TormentaSheetBody />;
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
