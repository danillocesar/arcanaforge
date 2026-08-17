import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import Sheet from '../../ui/Sheet/Sheet';
import TextField from '../../ui/TextField/TextField';
import Select from '../../ui/Select/Select';
import NumberField from '../../ui/NumberField/NumberField';
import RacePicker from '../RacePicker/RacePicker';
import OriginPicker from '../OriginPicker/OriginPicker';
import DeityPicker from '../DeityPicker/DeityPicker';
import styles from './InfoSheet.module.css';

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
      <RacePicker open={showRacePicker} onClose={() => setShowRacePicker(false)} />
      <OriginPicker open={showOriginPicker} onClose={() => setShowOriginPicker(false)} />
      <DeityPicker open={showDeityPicker} onClose={() => setShowDeityPicker(false)} />
    </Sheet>
  );
}

InfoSheet.displayName = 'InfoSheet';

export default InfoSheet;
