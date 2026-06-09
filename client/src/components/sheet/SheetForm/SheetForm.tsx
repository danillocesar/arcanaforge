import { useEffect, useState, type ReactNode } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import Button from '../../ui/Button/Button';
import TextField from '../../ui/TextField/TextField';
import Textarea from '../../ui/Textarea/Textarea';
import Select from '../../ui/Select/Select';
import NumberField from '../../ui/NumberField/NumberField';
import styles from './SheetForm.module.css';

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'list';
export type ScalarValue = string | number;
export type ListValue = Array<Record<string, ScalarValue>>;
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
  /** For `list`: the sub-fields of each row (text/number/select only). */
  itemFields?: FieldDescriptor[];
  /** For `list`: label of the add-row button. */
  addLabel?: string;
}

interface SheetFormProps {
  open: boolean;
  title: string;
  fields: FieldDescriptor[];
  initialValues: FormValues;
  submitLabel?: string;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
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
  header,
}: SheetFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues);

  // Reset the draft each time the form is (re)opened.
  useEffect(() => {
    if (open) setValues(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues]);

  const setValue = (key: string, value: FieldValue) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    onSubmit(values);
    onClose();
  };

  const visibleFields = fields.filter((f) => !f.showIf || f.showIf(values));

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} className={styles.flex}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSubmit} className={styles.flex}>
        {submitLabel}
      </Button>
    </>
  );

  const renderListField = (f: FieldDescriptor) => {
    const items = (Array.isArray(values[f.key]) ? values[f.key] : []) as ListValue;
    const subFields = f.itemFields ?? [];

    const addRow = () => {
      const blank: Record<string, ScalarValue> = {};
      subFields.forEach((sf) => {
        blank[sf.key] = sf.type === 'number' ? 0 : '';
      });
      setValue(f.key, [...items, blank]);
    };
    const updateRow = (i: number, key: string, v: ScalarValue) => {
      const next = items.map((row, idx) => (idx === i ? { ...row, [key]: v } : row));
      setValue(f.key, next);
    };
    const removeRow = (i: number) => {
      setValue(f.key, items.filter((_, idx) => idx !== i));
    };

    return (
      <div key={f.key} className={styles.full}>
        <div className={styles.listHead}>
          <span className={styles.listLabel}>{f.label}</span>
          <button type="button" className={styles.listAdd} onClick={addRow}>
            + {f.addLabel ?? 'Adicionar'}
          </button>
        </div>
        {items.length === 0 ? (
          <p className={styles.listEmpty}>Nenhum item.</p>
        ) : (
          items.map((row, i) => (
            <div key={i} className={styles.listRow}>
              {subFields.map((sf) => (
                <div key={sf.key} className={styles.listCell}>
                  <ScalarField
                    field={sf}
                    value={row[sf.key] ?? (sf.type === 'number' ? 0 : '')}
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
          ))
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} title={title} onClose={onClose} footer={footer}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.grid}>
        {visibleFields.map((f) => {
          if (f.type === 'list') return renderListField(f);
          if (f.type === 'textarea') {
            return (
              <div key={f.key} className={styles.full}>
                <ScalarField field={f} value={values[f.key] as ScalarValue} onChange={(v) => setValue(f.key, v)} />
              </div>
            );
          }
          return (
            <div key={f.key} className={f.half ? styles.half : styles.full}>
              <ScalarField field={f} value={values[f.key] as ScalarValue} onChange={(v) => setValue(f.key, v)} />
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

SheetForm.displayName = 'SheetForm';

export default SheetForm;
