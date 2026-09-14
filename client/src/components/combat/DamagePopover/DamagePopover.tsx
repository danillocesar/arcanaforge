import { useState, useEffect, useRef, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { DamageReduction } from '../../../types/character';
import { DAMAGE_TYPES } from '../../../data/constants';
import { applicableRds, damageVital, reduceDamage } from '../../../utils/vitals';
import styles from './DamagePopover.module.css';

interface DamagePopoverProps {
  barRef: RefObject<HTMLElement | null>;
  onApply: (delta: number) => void;
  onClose: () => void;
  /** Jogador: RDs do alvo — o dano desconta as RDs selecionadas (somadas, regra da mesa)
   * e o mestre vê a prévia antes de aplicar. Inimigo não tem RD cadastrada: fica como antes. */
  damageReductions?: DamageReduction[];
  /** PV temporário e atual do alvo, só pra prévia "X do temporário". */
  temporaryHp?: number;
  currentHp?: number;
}

export default function DamagePopover({
  barRef,
  onApply,
  onClose,
  damageReductions,
  temporaryHp,
  currentHp,
}: DamagePopoverProps) {
  const [value, setValue] = useState('');
  const [damageType, setDamageType] = useState('');
  const rds = damageReductions ?? [];
  const hasRds = rds.length > 0;
  const [selected, setSelected] = useState<boolean[]>(() => applicableRds(rds, undefined));
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const parseAmount = (): number => {
    const t = value.trim();
    if (t === '') return 0;
    const n = Number(t);
    return Number.isFinite(n) ? Math.abs(n) : 0;
  };

  useEffect(() => {
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      const popW = hasRds ? 300 : 200;
      let left = rect.left + rect.width / 2 - popW / 2;
      let top = rect.bottom + 6;
      if (left < 8) left = 8;
      if (left + popW > window.innerWidth - 8) left = window.innerWidth - 8 - popW;
      const popH = hasRds ? 300 : 140;
      if (top + popH > window.innerHeight - 8) top = rect.top - popH - 6;
      setPos({ top, left });
    }
  }, [barRef, hasRds]);

  const pickType = (type: string) => {
    const next = type === damageType ? '' : type;
    setDamageType(next);
    setSelected(applicableRds(rds, next || undefined));
  };
  const toggleRd = (i: number) => setSelected((prev) => prev.map((on, idx) => (idx === i ? !on : on)));

  const gross = parseAmount();
  const { rdTotal, net } = reduceDamage(gross, rds.filter((_, i) => selected[i]));
  const split = damageVital(
    { current: currentHp ?? 0, max: Number.MAX_SAFE_INTEGER, temp: temporaryHp ?? 0 },
    net,
  ).split;

  const applyDamage = () => onApply(-net);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        ref={popRef}
        className={`${styles.popover} ${hasRds ? styles.popoverWide : ''}`.trim()}
        style={{ top: pos.top, left: pos.left }}
      >
        <label className={styles.label} htmlFor="combat-damage-input">
          Alterar PV:
        </label>
        <input
          id="combat-damage-input"
          type="text"
          inputMode="numeric"
          className={styles.input}
          placeholder=""
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyDamage();
            }
          }}
          autoFocus
        />

        {hasRds && (
          <>
            <div className={styles.section}>Tipo</div>
            <div className={styles.chips}>
              {DAMAGE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.chip} ${damageType === t ? styles.chipOn : ''}`.trim()}
                  aria-pressed={damageType === t}
                  onClick={() => pickType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className={styles.section}>RD do alvo (somam)</div>
            <div className={styles.chips}>
              {rds.map((rd, i) => (
                <button
                  key={i}
                  type="button"
                  className={`${styles.chip} ${styles.chipRd} ${selected[i] ? styles.chipOn : ''}`.trim()}
                  aria-pressed={Boolean(selected[i])}
                  onClick={() => toggleRd(i)}
                >
                  {rd.name || 'Geral'} {rd.value}
                </button>
              ))}
            </div>
            <div className={styles.preview}>
              {gross > 0 ? (
                <>
                  {gross}
                  {rdTotal > 0 && <> − RD {rdTotal}</>}
                  {' = '}<b>{net}</b>
                  {split.fromTemp > 0 && <span className={styles.previewNote}> · {split.fromTemp} do temporário</span>}
                </>
              ) : (
                <span className={styles.previewNote}>Digite o dano para ver o líquido.</span>
              )}
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button
            className={styles.btnDamage}
            onClick={applyDamage}
          >
            - Dano
          </button>
          <button
            className={styles.btnHeal}
            onClick={() => onApply(parseAmount())}
          >
            + Cura
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
