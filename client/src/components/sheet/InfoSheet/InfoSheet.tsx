import { lazy, Suspense, useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Sheet from '../../ui/Sheet/Sheet';
import TextField from '../../ui/TextField/TextField';
import Select from '../../ui/Select/Select';
import NumberField from '../../ui/NumberField/NumberField';
import styles from './InfoSheet.module.css';

// Os catálogos oficiais de raças/origens/divindades só são usados dentro de
// cada picker — carregam sob demanda, na primeira vez que o respectivo
// "📖 Escolher da lista oficial" é aberto.
const RacePicker = lazy(() => import('../RacePicker/RacePicker'));
const OriginPicker = lazy(() => import('../OriginPicker/OriginPicker'));
const DeityPicker = lazy(() => import('../DeityPicker/DeityPicker'));

interface InfoSheetProps {
  open: boolean;
  onClose: () => void;
}

const SIZE_OPTIONS = [
  'Minúsculo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Colossal',
].map((v) => ({ value: v, label: v }));

function InfoSheet({ open, onClose }: InfoSheetProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();
  const [showRacePicker, setShowRacePicker] = useState(false);
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDeityPicker, setShowDeityPicker] = useState(false);
  const [racePickerLoaded, setRacePickerLoaded] = useState(false);
  const [originPickerLoaded, setOriginPickerLoaded] = useState(false);
  const [deityPickerLoaded, setDeityPickerLoaded] = useState(false);

  // Padrão "adjust state while rendering" do React: computa o derivado direto
  // no render (sem useEffect) — evita o round-trip extra de um efeito só pra
  // ligar um estado que nunca mais desliga.
  if (showRacePicker && !racePickerLoaded) setRacePickerLoaded(true);
  if (showOriginPicker && !originPickerLoaded) setOriginPickerLoaded(true);
  if (showDeityPicker && !deityPickerLoaded) setDeityPickerLoaded(true);

  if (!character) return null;

  const setField = <K extends 'race' | 'origin' | 'deity' | 'alignment' | 'age' | 'size' | 'speed' | 'languages'>(
    field: K,
    value: string,
  ) => updateCharacter((f) => ({ ...f, [field]: value }));

  return (
    <Sheet open={open} onClose={onClose} title="Dados do Personagem">
      <div className={styles.grid}>
        <div className={styles.full}>
          <TextField label="Raça" value={character.race} onChange={(v) => setField('race', v)} readOnly={readOnly} />
          {!readOnly && (
            <button type="button" className={styles.catalogBtn} onClick={() => setShowRacePicker(true)}>
              📖 Escolher da lista oficial
            </button>
          )}
        </div>
        <div className={styles.full}>
          <TextField label="Origem" value={character.origin} onChange={(v) => setField('origin', v)} readOnly={readOnly} />
          {!readOnly && (
            <button type="button" className={styles.catalogBtn} onClick={() => setShowOriginPicker(true)}>
              📖 Escolher da lista oficial
            </button>
          )}
        </div>
        <div className={styles.full}>
          <TextField label="Divindade" value={character.deity} onChange={(v) => setField('deity', v)} readOnly={readOnly} />
          {!readOnly && (
            <button type="button" className={styles.catalogBtn} onClick={() => setShowDeityPicker(true)}>
              📖 Escolher da lista oficial
            </button>
          )}
        </div>
        <TextField label="Conceito" value={character.alignment} onChange={(v) => setField('alignment', v)} readOnly={readOnly} placeholder="Traços de personalidade" />
        <TextField label="Idade" value={character.age} onChange={(v) => setField('age', v)} readOnly={readOnly} />
        <Select
          label="Tamanho"
          options={SIZE_OPTIONS}
          value={character.size}
          onChange={(v) => setField('size', v)}
          disabled={readOnly}
        />
        <TextField label="Deslocamento" value={character.speed} onChange={(v) => setField('speed', v)} readOnly={readOnly} />
        <TextField
          label="Idiomas"
          value={character.languages ?? ''}
          onChange={(v) => setField('languages', v)}
          readOnly={readOnly}
          placeholder="Valkar, ..."
        />
        <NumberField
          label="XP"
          value={character.experience}
          onChange={(n) => updateCharacter((f) => ({ ...f, experience: n }))}
          readOnly={readOnly}
        />
      </div>
      {racePickerLoaded && (
        <Suspense fallback={null}>
          <RacePicker open={showRacePicker} onClose={() => setShowRacePicker(false)} />
        </Suspense>
      )}
      {originPickerLoaded && (
        <Suspense fallback={null}>
          <OriginPicker open={showOriginPicker} onClose={() => setShowOriginPicker(false)} />
        </Suspense>
      )}
      {deityPickerLoaded && (
        <Suspense fallback={null}>
          <DeityPicker open={showDeityPicker} onClose={() => setShowDeityPicker(false)} />
        </Suspense>
      )}
    </Sheet>
  );
}

InfoSheet.displayName = 'InfoSheet';

export default InfoSheet;
