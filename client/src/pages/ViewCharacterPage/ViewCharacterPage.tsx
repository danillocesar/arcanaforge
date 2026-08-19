import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import { apiLoadPartyCharacter } from '../../api';
import type { Character } from '../../types/character';
import TormentaSheetBody from '../../components/sheet/TormentaSheetBody/TormentaSheetBody';
import SheetSkeleton from '../../components/sheet/SheetSkeleton/SheetSkeleton';

import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './ViewCharacterPage.module.css';

function ViewCharacterInner({ system }: { system: string }) {
  const { character } = useCharacterContext();

  if (!character) {
    return <SheetSkeleton />;
  }

  if (system !== 'tormenta') {
    return (
      <div className={styles.readOnlyBanner}>
        Este grupo usa um sistema que não é mais suportado.
      </div>
    );
  }

  return (
    <TormentaSheetBody
      topBanner={
        <div className={styles.readOnlyBanner}>
          <Eye size={16} />
          MODO SOMENTE LEITURA
        </div>
      }
    />
  );
}

function ViewCharacterLoader({ system, partyId, characterId }: { system: string; partyId: string; characterId: string }) {
  const { setCharacterDirect } = useCharacterContext();
  const [loadDone, setLoadDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiLoadPartyCharacter(partyId, characterId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError(true);
        } else {
          setCharacterDirect(data as unknown as Character);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadDone(true);
      });
    return () => { cancelled = true; };
  }, [partyId, characterId, setCharacterDirect]);

  if (error) return <AccessDeniedPage />;
  if (!loadDone) return <div className={styles.loading}>Carregando ficha...</div>;

  return <ViewCharacterInner system={system} />;
}

export default function ViewCharacterPage() {
  const { system, partyId, characterId } = useParams<{ system: string; partyId: string; characterId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!partyId || !characterId) {
      navigate('/parties', { replace: true });
    }
  }, [partyId, characterId, navigate]);

  if (!system || !partyId || !characterId) return null;

  return (
    <CharacterProvider readOnly>
      <ViewCharacterLoader system={system} partyId={partyId} characterId={characterId} />
    </CharacterProvider>
  );
}
