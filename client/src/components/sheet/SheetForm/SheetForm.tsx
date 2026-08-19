import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import Button from '../../ui/Button/Button';
import TextField from '../../ui/TextField/TextField';
import Textarea from '../../ui/Textarea/Textarea';
import Select from '../../ui/Select/Select';
import NumberField from '../../ui/NumberField/NumberField';
import { enhancementPatch } from '../../../utils/itemEnhancements';
import type { ItemEnhancementTarget, OfficialItemEnhancement } from '../../../data/itemEnhancements';
import styles from './SheetForm.module.css';

// O catálogo de melhorias/encantos só é usado dentro do picker — carrega sob
// demanda, como já fazem PowerPicker e SpellPicker.
const ItemEnhancementPicker = lazy(() => import('../ItemEnhancementPicker/ItemEnhancementPicker'));

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'list' | 'enhancementPicker';
export type ScalarValue = string | number;
export interface ListRow {
  [key: string]: ScalarValue | ListValue;
}
export type ListValue = ListRow[];
export type FieldValue = ScalarValue | ListValue;
export type FormValues = Record<string, FieldValue>;

export interface FieldDescriptor {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  /** Half-width on desktop (two fields share a row). */
  half?: boolean;
  /** Only render when this predicate passes for the current draft. */
  showIf?: (values: FormValues) => boolean;
  /**
   * When this field changes, derive a patch to apply to other fields — e.g. auto-fill
   * "Custo (PM)" from "Círculo" without overwriting a value the player already edited.
   * Receives the new value, the draft after this field's own update, and the draft before it.
   */
  onValueChange?: (value: FieldValue, nextValues: FormValues, prevValues: FormValues) => Partial<FormValues> | void;
  /** For `list`: the sub-fields of each row (text/number/select only). */
  itemFields?: FieldDescriptor[];
  /** For `list`: label of the add-row button. */
  addLabel?: string;
  /** For `enhancementPicker`: which catalogue slice to offer. */
  enhancementTarget?: ItemEnhancementTarget;
}

interface SheetFormProps {
  open: boolean;
  title: string;
  fields: FieldDescriptor[];
  initialValues: FormValues;
  submitLabel?: string;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  onRemove?: () => void;
  /** Optional control rendered above the fields (e.g. an item-type selector). */
  header?: ReactNode;
}

/** Renders a single scalar control (text/textarea/number/select). */
function ScalarField({
  field,
  value,
  onChange,
}: {
  field: FieldDescriptor;
  value: ScalarValue;
  onChange: (v: ScalarValue) => void;
}) {
  if (field.type === 'textarea') {
    return (
      <Textarea
        label={field.label}
        placeholder={field.placeholder}
        value={String(value ?? '')}
        onChange={onChange}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <Select
        label={field.label}
        options={field.options ?? []}
        placeholder={field.placeholder}
        value={String(value ?? '')}
        onChange={onChange}
      />
    );
  }
  if (field.type === 'number') {
    return (
      <NumberField
        label={field.label}
        value={Number(value ?? 0)}
        onChange={onChange}
      />
    );
  }
  return (
    <TextField
      label={field.label}
      placeholder={field.placeholder}
      value={String(value ?? '')}
      onChange={onChange}
    />
  );
}

interface ListFieldProps {
  field: FieldDescriptor;
  items: ListValue;
  onChange: (items: ListValue) => void;
}

/** Editor de lista genérico e recursivo — um sub-campo pode ele mesmo ser `type: 'list'`. */
function ListField({ field, items, onChange }: ListFieldProps) {
  const subFields = field.itemFields ?? [];

  const blankRow = (): ListRow => {
    const blank: ListRow = {};
    subFields.forEach((sf) => {
      blank[sf.key] = sf.type === 'list' ? [] : sf.type === 'number' ? 0 : '';
    });
    return blank;
  };

  const addRow = () => onChange([...items, blankRow()]);
  const updateRow = (i: number, key: string, v: ScalarValue | ListValue) => {
    onChange(items.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));
  };
  const removeRow = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className={styles.full}>
      <div className={styles.listHead}>
        <span className={styles.listLabel}>{field.label}</span>
        <button type="button" className={styles.listAdd} onClick={addRow}>
          + {field.addLabel ?? 'Adicionar'}
        </button>
      </div>
      {items.length === 0 ? (
        <p className={styles.listEmpty}>Nenhum item.</p>
      ) : (
        items.map((row, i) => {
          const rowValues = row as FormValues;
          const visible = subFields.filter((sf) => !sf.showIf || sf.showIf(rowValues));
          const inlineFields = visible.filter((sf) => sf.type !== 'textarea' && sf.type !== 'list');
          const blockFields = visible.filter((sf) => sf.type === 'textarea');
          const listFields = visible.filter((sf) => sf.type === 'list');
          return (
            <div key={i} className={styles.listItem}>
              <div className={styles.listRow}>
                {inlineFields.map((sf) => (
                  <div key={sf.key} className={styles.listCell}>
                    <ScalarField
                      field={sf}
                      value={(row[sf.key] as ScalarValue) ?? (sf.type === 'number' ? 0 : '')}
                      onChange={(v) => updateRow(i, sf.key, v)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.listRemove}
                  onClick={() => removeRow(i)}
                  aria-label="Remover"
                >
                  ×
                </button>
              </div>
              {blockFields.map((sf) => (
                <Textarea
                  key={sf.key}
                  label={sf.label}
                  placeholder={sf.placeholder}
                  value={String(row[sf.key] ?? '')}
                  onChange={(v) => updateRow(i, sf.key, v)}
                  compact
                />
              ))}
              {listFields.map((sf) => (
                <ListField
                  key={sf.key}
                  field={sf}
                  items={(Array.isArray(row[sf.key]) ? (row[sf.key] as ListValue) : [])}
                  onChange={(next) => updateRow(i, sf.key, next)}
                />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * Descriptor-driven form rendered inside a responsive Sheet (bottom-sheet on
 * mobile, modal on desktop). Owns the draft state; on submit hands the values
 * back to the caller, which maps them onto the Character via updateCharacter.
 */
function SheetForm({
  open,
  title,
  fields,
  initialValues,
  submitLabel = 'Salvar',
  onSubmit,
  onClose,
  onRemove,
  header,
}: SheetFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [enhancementField, setEnhancementField] = useState<FieldDescriptor | null>(null);

  // Reset draft and confirm state each time the form is (re)opened.
  useEffect(() => {
    setConfirmRemove(false);
    setEnhancementField(null);
    if (open) setValues(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues]);

  const setValue = (key: string, value: FieldValue) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleFieldChange = (field: FieldDescriptor, value: FieldValue) =>
    setValues((prev) => {
      const next = { ...prev, [field.key]: value };
      const patch = field.onValueChange?.(value, next, prev);
      return patch ? ({ ...next, ...patch } as FormValues) : next;
    });

  const applyEnhancement = (entry: OfficialItemEnhancement) =>
    setValues((prev) => ({ ...prev, ...enhancementPatch(entry, prev) } as FormValues));

  /** Nomes do catálogo já registrados no texto de efeito deste item. */
  const appliedEnhancements = String(values.effect ?? '')
    .split(' · ')
    .map((part) => part.split(':')[0].trim())
    .filter(Boolean);

  const handleSubmit = () => {
    onSubmit(values);
    onClose();
  };

  const visibleFields = fields.filter((f) => !f.showIf || f.showIf(values));

  const footer = confirmRemove ? (
    <>
      <span className={styles.confirmTxt}>Remover este item?</span>
      <Button variant="ghost" className={styles.flex} onClick={() => setConfirmRemove(false)}>
        Não
      </Button>
      <button
        type="button"
        className={`${styles.flex} ${styles.btnDel}`}
        onClick={() => { onRemove?.(); onClose(); }}
      >
        Sim, remover
      </button>
    </>
  ) : (
    <>
      {onRemove && (
        <button type="button" className={styles.btnDelGhost} onClick={() => setConfirmRemove(true)}>
          Remover
        </button>
      )}
      <Button variant="ghost" onClick={onClose} className={styles.flex}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSubmit} className={styles.flex}>
        {submitLabel}
      </Button>
    </>
  );

  const renderListField = (f: FieldDescriptor) => (
    <ListField
      key={f.key}
      field={f}
      items={(Array.isArray(values[f.key]) ? values[f.key] : []) as ListValue}
      onChange={(next) => setValue(f.key, next)}
    />
  );

  return (
    <Sheet open={open} title={title} onClose={onClose} footer={footer}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.grid}>
        {visibleFields.map((f) => {
          if (f.type === 'list') return renderListField(f);
          if (f.type === 'enhancementPicker') {
            return (
              <div key={f.key} className={styles.full}>
                <button
                  type="button"
                  className={styles.catalogBtn}
                  onClick={() => setEnhancementField(f)}
                >
                  + {f.label}
                </button>
              </div>
            );
          }
          if (f.type === 'textarea') {
            return (
              <div key={f.key} className={styles.full}>
                <ScalarField field={f} value={values[f.key] as ScalarValue} onChange={(v) => handleFieldChange(f, v)} />
              </div>
            );
          }
          return (
            <div key={f.key} className={f.half ? styles.half : styles.full}>
              <ScalarField field={f} value={values[f.key] as ScalarValue} onChange={(v) => handleFieldChange(f, v)} />
            </div>
          );
        })}
      </div>

      {enhancementField && (
        <Suspense fallback={null}>
          <ItemEnhancementPicker
            open
            target={enhancementField.enhancementTarget ?? 'arma'}
            applied={appliedEnhancements}
            onPick={applyEnhancement}
            onClose={() => setEnhancementField(null)}
          />
        </Suspense>
      )}
    </Sheet>
  );
}

SheetForm.displayName = 'SheetForm';

export default SheetForm;
