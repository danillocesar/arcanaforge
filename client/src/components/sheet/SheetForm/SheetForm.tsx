import { useEffect, useState, type ReactNode } from 'react';
import Sheet from '../../ui/Sheet/Sheet';
import Button from '../../ui/Button/Button';
import TextField from '../../ui/TextField/TextField';
import Textarea from '../../ui/Textarea/Textarea';
import Select from '../../ui/Select/Select';
import NumberField from '../../ui/NumberField/NumberField';
import styles from './SheetForm.module.css';

export type FieldType = 'text' | 'textarea' | 'number' | 'select';
export type FieldValue = string | number;
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

  return (
    <Sheet open={open} title={title} onClose={onClose} footer={footer}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.grid}>
        {visibleFields.map((f) => {
          const cls = f.half ? styles.half : styles.full;
          if (f.type === 'textarea') {
            return (
              <div key={f.key} className={styles.full}>
                <Textarea
                  label={f.label}
                  placeholder={f.placeholder}
                  value={String(values[f.key] ?? '')}
                  onChange={(v) => setValue(f.key, v)}
                />
              </div>
            );
          }
          if (f.type === 'select') {
            return (
              <div key={f.key} className={cls}>
                <Select
                  label={f.label}
                  options={f.options ?? []}
                  placeholder={f.placeholder}
                  value={String(values[f.key] ?? '')}
                  onChange={(v) => setValue(f.key, v)}
                />
              </div>
            );
          }
          if (f.type === 'number') {
            return (
              <div key={f.key} className={cls}>
                <NumberField
                  label={f.label}
                  value={Number(values[f.key] ?? 0)}
                  onChange={(n) => setValue(f.key, n)}
                />
              </div>
            );
          }
          return (
            <div key={f.key} className={cls}>
              <TextField
                label={f.label}
                placeholder={f.placeholder}
                value={String(values[f.key] ?? '')}
                onChange={(v) => setValue(f.key, v)}
              />
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

SheetForm.displayName = 'SheetForm';

export default SheetForm;
