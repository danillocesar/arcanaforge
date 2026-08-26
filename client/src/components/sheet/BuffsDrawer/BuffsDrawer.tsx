import { useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { toggleBuffState, deactivateAllBuffs, removeInactiveBuffs } from '../../../utils/calculations';
import { formatResistanceLine } from '../../../utils/castAction';
import { useSheetForm } from '../SheetForm/SheetFormProvider';
import Sheet from '../../ui/Sheet/Sheet';
import ConfirmModal from '../../ui/ConfirmModal/ConfirmModal';
import EmptyState from '../../ui/EmptyState/EmptyState';
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

const DURATION_LABEL: Record<NonNullable<Buff['duration']>, string> = {
  cena: 'Até o fim da cena',
  dia: 'Até o novo dia',
  permanente: 'Permanente',
};

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
  const [confirmClear, setConfirmClear] = useState(false);

  if (!character) return null;

  const buffs = character.buffs ?? [];
  const activeCount = buffs.filter((b) => b.active).length;
  const inactiveCount = buffs.length - activeCount;
  // Limpezas pequenas são reversíveis pelo Desfazer; a partir de 4 itens pede confirmação.
  const CONFIRM_CLEAR_FROM = 4;

  const clearInactive = () => updateCharacter((f) => removeInactiveBuffs(f));

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
    <div className={styles.footerGroup}>
      {buffs.length > 0 && (
        <div className={styles.footerRow}>
          <button
            type="button"
            className={styles.btnGhost}
            disabled={activeCount === 0}
            onClick={() => updateCharacter((f) => deactivateAllBuffs(f))}
          >
            Desligar todos{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            disabled={inactiveCount === 0}
            onClick={() => (inactiveCount >= CONFIRM_CLEAR_FROM ? setConfirmClear(true) : clearInactive())}
          >
            Limpar desligados{inactiveCount > 0 ? ` (${inactiveCount})` : ''}
          </button>
        </div>
      )}
      <button type="button" className={styles.btnAdd} onClick={() => openAfterClose(() => setShowPicker(true))}>
        + Buff
      </button>
    </div>
  ) : undefined;

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Buffs & Condições" footer={footer}>
        {buffs.length === 0 ? (
          <EmptyState icon="✨" title="Nenhum buff ou condição ativo." />
        ) : (
          <div className={styles.list}>
            {buffs.map((buff, idx) => {
              const variant = inferVariant(buff);
              const signed = buildSummary(buff);
              const resistanceLine = formatResistanceLine(buff.resistance, buff.dc);

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
                    <span className={styles.sourceText}>{DURATION_LABEL[buff.duration ?? 'cena']}</span>
                    {resistanceLine && <span className={styles.resistText}>{resistanceLine}</span>}
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
      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearInactive}
        icon="🧹"
        title="Limpar buffs desligados?"
        message={`${inactiveCount} buffs desligados serão removidos da lista. Dá para desfazer logo em seguida.`}
        confirmLabel="Limpar"
      />
    </>
  );
}

BuffsDrawer.displayName = 'BuffsDrawer';

export default BuffsDrawer;
