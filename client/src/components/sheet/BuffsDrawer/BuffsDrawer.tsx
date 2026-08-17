import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { toggleBuffState } from '../../../utils/calculations';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import Sheet from '../../ui/Sheet/Sheet';
import ConditionPicker from '../ConditionPicker/ConditionPicker';
import type { FormValues } from '../SheetForm/SheetForm';
import type { Buff } from '../../../types/character';
import styles from './BuffsDrawer.module.css';

interface BuffsDrawerProps {
  open: boolean;
  onClose: () => void;
}

type BuffVariant = 'buff' | 'warn' | 'danger';

function inferVariant(buff: Buff): BuffVariant {
  const effects = buff.effects || [];
  if (effects.length === 0) return 'warn';
  const isNegative = effects.some((eff) => {
    const raw = (eff.value ?? '').toString().trim();
    return raw.startsWith('-') || Number(raw) < 0;
  });
  return isNegative ? 'danger' : 'buff';
}

function formatEffectValue(raw: string): string | null {
  const trimmed = (raw ?? '').toString().trim();
  if (!trimmed || trimmed === '0') return null;
  return /^[+-]/.test(trimmed) ? trimmed : `+${trimmed}`;
}

function buildSummary(buff: Buff): string | null {
  const values = (buff.effects || [])
    .map((eff) => formatEffectValue(eff.value))
    .filter((v): v is string => v != null);
  return values.length > 0 ? values.join('/') : null;
}

function BuffsDrawer({ open, onClose }: BuffsDrawerProps) {
  const { character, updateCharacter, readOnly } = useCharacterContext();
  const { openEdit, openCreate, openCreateWithValues } = useSheetForm();
  const [showPicker, setShowPicker] = useState(false);

  if (!character) return null;

  const buffs = character.buffs ?? [];

  const handleToggle = (index: number) =>
    updateCharacter((f) => toggleBuffState(f, index));

  const openAfterClose = (fn: () => void) => {
    onClose();
    setTimeout(fn, 320);
  };

  const handlePick = (values: FormValues | null) => {
    setShowPicker(false);
    setTimeout(() => {
      if (values) openCreateWithValues('buff', values);
      else openCreate('buff');
    }, 320);
  };

  const footer = !readOnly ? (
    <button type="button" className={styles.btnAdd} onClick={() => openAfterClose(() => setShowPicker(true))}>
      + Buff
    </button>
  ) : undefined;

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Buffs & Condições" footer={footer}>
        {buffs.length === 0 ? (
          <p className={styles.empty}>Nenhum buff ou condição ativo.</p>
        ) : (
          <div className={styles.list}>
            {buffs.map((buff, idx) => {
              const variant = inferVariant(buff);
              const signed = buildSummary(buff);

              return (
                <div key={idx} className={`${styles.card} ${styles[variant]}`}>
                  <button
                    type="button"
                    className={`${styles.dot} ${buff.active ? styles.dotOn : ''}`}
                    aria-label={buff.active ? 'Desativar' : 'Ativar'}
                    onClick={readOnly ? undefined : () => handleToggle(idx)}
                    disabled={readOnly}
                  />
                  <div className={styles.info}>
                    <span className={styles.name}>{buff.name || 'Sem nome'}</span>
                    {buff.source && <span className={styles.sourceText}>{buff.source}</span>}
                    {buff.description && <span className={styles.descText}>{buff.description}</span>}
                    {buff.mp > 0 && <span className={styles.source}>{buff.mp} PM</span>}
                  </div>
                  {signed && (
                    <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>
                      {signed}
                    </span>
                  )}
                  {!readOnly && (
                    <button
                      type="button"
                      className={styles.btnEdit}
                      aria-label="Editar"
                      onClick={() => openAfterClose(() => openEdit('buff', idx))}
                    >
                      ✎
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Sheet>
      <ConditionPicker open={showPicker} onClose={() => setShowPicker(false)} onPick={handlePick} />
    </>
  );
}

BuffsDrawer.displayName = 'BuffsDrawer';

export default BuffsDrawer;
