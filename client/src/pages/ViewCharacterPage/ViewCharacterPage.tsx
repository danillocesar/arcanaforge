import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext';
import { apiLoadPartyCharacter } from '../../api';
import { isSectionHidden } from '../../data/constants';
import { SECTION_LABELS } from '../../data/constants';
import { NARUTO_SECTION_LABELS } from '../../features/naruto/data/narutoConstants';
import type { Character } from '../../types/character';
import Topbar, { systemParamToBrand } from '../../components/layout/Topbar/Topbar';
import SectionNav from '../../components/layout/SectionNav/SectionNav';

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

import NarutoBasicInfo from '../../features/naruto/components/NarutoBasicInfo/NarutoBasicInfo';
import NarutoAttributes from '../../features/naruto/components/NarutoAttributes/NarutoAttributes';
import NarutoEnergies from '../../features/naruto/components/NarutoEnergies/NarutoEnergies';
import NarutoCombatStats from '../../features/naruto/components/NarutoCombatStats/NarutoCombatStats';
import NarutoSocial from '../../features/naruto/components/NarutoSocial/NarutoSocial';
import NarutoPowers from '../../features/naruto/components/NarutoPowers/NarutoPowers';
import NarutoAptitudes from '../../features/naruto/components/NarutoAptitudes/NarutoAptitudes';
import NarutoJutsus from '../../features/naruto/components/NarutoJutsus/NarutoJutsus';
import NarutoAttacks from '../../features/naruto/components/NarutoAttacks/NarutoAttacks';
import NarutoDamageCalc from '../../features/naruto/components/NarutoDamageCalc/NarutoDamageCalc';
import NarutoInventory from '../../features/naruto/components/NarutoInventory/NarutoInventory';

import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './ViewCharacterPage.module.css';

function ViewCharacterInner({ system }: { system: string }) {
  const { character } = useCharacterContext();

  const isTormenta = system === 'tormenta';
  const labels = isTormenta ? SECTION_LABELS : NARUTO_SECTION_LABELS;

  const sections = useMemo(
    () =>
      Object.entries(labels).map(([id, label]) => ({
        id,
        label,
        hidden: isSectionHidden(character?.hiddenSections, id),
      })),
    [character?.hiddenSections, labels],
  );

  const isHidden = (id: string) => isSectionHidden(character?.hiddenSections, id);

  if (!character) {
    return <div className={styles.loading}>Carregando ficha...</div>;
  }

  return (
    <>
      <Topbar
        title={`Visualizando — ${character.name}`}
        systemBrand={systemParamToBrand(system)}
      />

      <SectionNav items={sections} useScrollObserver hiddenSections={character.hiddenSections} />

      <main className={styles.container}>
        <div className={styles.readOnlyBanner}>
          <Eye size={16} />
          MODO SOMENTE LEITURA
        </div>

        <div className="readOnlySheet">
          {isTormenta ? (
            <TormentaSections isHidden={isHidden} />
          ) : (
            <NarutoSections isHidden={isHidden} />
          )}
        </div>
      </main>
    </>
  );
}

function TormentaSections({ isHidden }: { isHidden: (id: string) => boolean }) {
  return (
    <>
      {!isHidden('secHeader') && <BasicInfo />}
      <div className={styles.layoutTop}>
        <div className={styles.colLeft}>
          {!isHidden('secAttributes') && <AttributesDefense />}
          {!isHidden('secBuffs') && <BuffsList />}
        </div>
        <div className={styles.colRight}>
          {!isHidden('secHpMp') && <HpMp />}
          {!isHidden('secEffects') && <TemporaryEffects />}
        </div>
      </div>
      {!isHidden('secAttacks') && <AttacksList />}
      <div className={styles.layoutMiddle}>
        {!isHidden('secSpells') && <SpellsList />}
        {!isHidden('secAbilities') && <AbilitiesList />}
      </div>
      {!isHidden('secInventory') && <Inventory />}
      {!isHidden('secProficiencies') && <Proficiencies />}
    </>
  );
}

function NarutoSections({ isHidden }: { isHidden: (id: string) => boolean }) {
  return (
    <>
      {!isHidden('secHeader') && <NarutoBasicInfo />}
      <div className={styles.layoutTop}>
        <div className={styles.colLeft}>
          {!isHidden('secAttributes') && <NarutoAttributes />}
          {!isHidden('secCombat') && <NarutoCombatStats />}
        </div>
        <div className={styles.colRight}>
          {!isHidden('secEnergies') && <NarutoEnergies />}
          {!isHidden('secSocial') && <NarutoSocial />}
        </div>
      </div>
      {!isHidden('secJutsus') && <NarutoJutsus />}
      {!isHidden('secAttacks') && <NarutoAttacks />}
      {!isHidden('secPowers') && <NarutoPowers />}
      {!isHidden('secAptitudes') && <NarutoAptitudes />}
      {!isHidden('secDamage') && <NarutoDamageCalc />}
      {!isHidden('secInventory') && <NarutoInventory />}
    </>
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
