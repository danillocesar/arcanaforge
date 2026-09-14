import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { DAMAGE_TYPES } from '../../../data/constants';
import { applicableRds, computeDamageTaken } from '../../../utils/vitals';
import { showToast } from '../../../services/toastService';
import Sheet from '../../ui/Sheet/Sheet';
import Button from '../../ui/Button/Button';
import Chip from '../../ui/Chip/Chip';
import Switch from '../../ui/Switch/Switch';
import styles from './TakeDamageSheet.module.css';

interface TakeDamageSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Tomar dano": valor + tipo → RDs pré-selecionadas (Geral sempre; a do tipo) → prévia
 * "12 − RD 7 (Geral 5 + fogo 2) = 5 · 3 do PV temporário · 2 do PV" → aplica, registra no
 * Histórico e avisa o grupo. Regra da mesa: RDs somam. Toda a conta é
 * `computeDamageTaken` (utils/vitals.ts); aqui só se renderiza o resultado.
 */
function TakeDamageSheet({ open, onClose }: TakeDamageSheetProps) {
  const { character, updateCharacter, sendHpUpdate } = useCharacterContext();
  const [draft, setDraft] = useState('');
  const [damageType, setDamageType] = useState('');
  const [selected, setSelected] = useState<boolean[]>([]);
  const [ignoreRd, setIgnoreRd] = useState(false);

  const rds = character?.damageReductions ?? [];

  // Cada abertura começa limpa: valor vazio, sem tipo, só a RD Geral ligada. Padrão
  // "adjust state while rendering" do React (sem useEffect), como no PoderesPanel.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft('');
      setDamageType('');
      setIgnoreRd(false);
      setSelected(applicableRds(rds, undefined));
    }
  }

  if (!character) return null;

  const amount = Number(draft);
  const valid = draft.trim() !== '' && Number.isFinite(amount) && amount > 0;

  const pickType = (type: string) => {
    const next = type === damageType ? '' : type;
    setDamageType(next);
    setSelected(applicableRds(rds, next || undefined));
  };
  const toggleRd = (i: number) => setSelected((prev) => prev.map((on, idx) => (idx === i ? !on : on)));

  const input = { amount, damageType: damageType || undefined, selected, ignoreRd };
  const preview = valid ? computeDamageTaken(character, input) : null;

  const confirm = () => {
    if (!preview) return;
    const typeLabel = damageType || undefined;
    updateCharacter((f) => {
      const r = computeDamageTaken(f, input);
      return {
        ...r.character,
        logs: [
          ...f.logs,
          {
            type: 'damage',
            name: 'Dano recebido',
            mpSpent: 0,
            timestamp: Date.now(),
            details: {
              amount: r.gross,
              damageType: typeLabel,
              rdApplied: r.rdApplied.map((rd) => `${rd.name || 'Geral'} ${rd.value}`),
              rdTotal: r.rdTotal,
              net: r.net,
              fromTemp: r.split.fromTemp,
              fromCurrent: r.split.fromCurrent,
            },
          },
        ],
      };
    });
    setTimeout(sendHpUpdate, 50);
    showToast(
      `−${preview.net} PV${preview.split.fromTemp > 0 ? ` (${preview.split.fromTemp} do temporário)` : ''}`,
      'default',
    );
    onClose();
  };

  const footer = (
    <>
      <Button variant="ghost" className={styles.flex} onClick={onClose}>Cancelar</Button>
      <Button variant="primary" className={styles.flex} onClick={confirm} disabled={!preview}>💥 Aplicar</Button>
    </>
  );

  const rdLabel = (rd: { name: string; value: number }) => `${rd.name || 'Geral'} ${rd.value}`;

  return (
    <Sheet open={open} onClose={onClose} title="Tomar dano" footer={footer}>
      <label className={styles.label} htmlFor="take-damage-amount">Dano</label>
      <input
        id="take-damage-amount"
        className={styles.amount}
        type="text"
        inputMode="numeric"
        value={draft}
        autoFocus
        placeholder="0"
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            confirm();
          }
        }}
      />

      <div className={styles.label}>Tipo</div>
      <div className={styles.chips}>
        {DAMAGE_TYPES.map((t) => (
          <Chip key={t} label={t} active={damageType === t} onToggle={() => pickType(t)} />
        ))}
      </div>

      {rds.length > 0 && (
        <>
          <div className={styles.rdHead}>
            <span className={styles.label}>Redução de dano</span>
            <label className={styles.ignore}>
              <Switch checked={ignoreRd} onChange={setIgnoreRd} aria-label="Ignora RD" />
              <span>Ignora RD</span>
            </label>
          </div>
          <div className={`${styles.chips} ${ignoreRd ? styles.chipsOff : ''}`.trim()}>
            {rds.map((rd, i) => (
              <Chip
                key={i}
                label={rdLabel(rd)}
                variant="warn"
                active={Boolean(selected[i]) && !ignoreRd}
                onToggle={ignoreRd ? undefined : () => toggleRd(i)}
              />
            ))}
          </div>
        </>
      )}

      <div className={styles.preview} aria-live="polite">
        {preview ? (
          <>
            <b>{preview.gross}</b>
            {preview.rdTotal > 0 && (
              <> − RD {preview.rdTotal} ({preview.rdApplied.map(rdLabel).join(' + ')})</>
            )}
            {' = '}
            <b className={styles.net}>{preview.net}</b>
            {preview.net > 0 && (
              <span className={styles.split}>
                {preview.split.fromTemp > 0 && ` · ${preview.split.fromTemp} do PV temporário`}
                {preview.split.fromCurrent > 0 && ` · ${preview.split.fromCurrent} do PV`}
              </span>
            )}
            {preview.net === 0 && <span className={styles.split}> · a RD absorve tudo</span>}
          </>
        ) : (
          <span className={styles.hint}>Digite o dano recebido.</span>
        )}
      </div>
    </Sheet>
  );
}

TakeDamageSheet.displayName = 'TakeDamageSheet';

export default TakeDamageSheet;
