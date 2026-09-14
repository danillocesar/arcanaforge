import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import SegmentedControl from '../../ui/SegmentedControl/SegmentedControl';
import SheetForm, { type FormValues } from './SheetForm';
import { ENTITY_FORMS, ITEM_KINDS, type EntityKind } from './entityForms';

type OpenKind = EntityKind | 'item';

interface SheetFormApi {
  openCreate: (kind: OpenKind) => void;
  /** Como openCreate, mas pré-preenche o formulário (ex.: condição escolhida no catálogo). */
  openCreateWithValues: (kind: EntityKind, values: FormValues) => void;
  openEdit: (kind: EntityKind, index: number) => void;
}

interface FormState {
  mode: 'create' | 'edit';
  kind: OpenKind;
  index?: number;
}

const SheetFormContext = createContext<SheetFormApi | null>(null);

export function useSheetForm(): SheetFormApi {
  const ctx = useContext(SheetFormContext);
  if (!ctx) throw new Error('useSheetForm must be used within SheetFormProvider');
  return ctx;
}

export function SheetFormProvider({ children }: { children: ReactNode }) {
  const { character, updateCharacter } = useCharacterContext();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState | null>(null);
  const [itemKind, setItemKind] = useState<EntityKind>('arma');
  const [valuesOverride, setValuesOverride] = useState<FormValues | null>(null);

  const openCreate = useCallback((kind: OpenKind) => {
    if (kind === 'item') setItemKind('arma');
    setValuesOverride(null);
    setState({ mode: 'create', kind });
    setOpen(true);
  }, []);

  const openCreateWithValues = useCallback((kind: EntityKind, values: FormValues) => {
    setValuesOverride(values);
    setState({ mode: 'create', kind });
    setOpen(true);
  }, []);

  const openEdit = useCallback((kind: EntityKind, index: number) => {
    setValuesOverride(null);
    setState({ mode: 'edit', kind, index });
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const api = useMemo<SheetFormApi>(
    () => ({ openCreate, openCreateWithValues, openEdit }),
    [openCreate, openCreateWithValues, openEdit],
  );

  const editing = state?.mode === 'edit';
  const isItemPicker = state?.kind === 'item' && !editing;
  const concreteKind: EntityKind | null = state
    ? state.kind === 'item'
      ? itemKind
      : (state.kind as EntityKind)
    : null;
  const config = concreteKind ? ENTITY_FORMS[concreteKind] : null;

  const initialValues = useMemo<FormValues>(() => {
    if (!config || !character) return {};
    if (editing && state?.index != null) {
      // The entity at this index may have just been removed (e.g. deleting the
      // last item in a list) while the sheet is still playing its close
      // animation — fall back to an empty draft instead of crashing on a
      // stale/out-of-range index.
      try {
        return config.fromEntry(character, state.index);
      } catch {
        return config.empty();
      }
    }
    // O override é mesclado sobre o rascunho vazio, não o substitui: assim um
    // pré-preenchimento parcial (ex.: só o nome digitado na busca) ainda vem com
    // todos os campos do formulário definidos.
    return valuesOverride ? { ...config.empty(), ...valuesOverride } : config.empty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, character, editing, state?.index, itemKind, open, valuesOverride]);

  const handleSubmit = useCallback(
    (values: FormValues) => {
      if (!config) return;
      const idx = editing ? state?.index : undefined;
      updateCharacter((c) => config.apply(c, values, idx));
    },
    [config, editing, state?.index, updateCharacter],
  );

  const handleRemove = useCallback(() => {
    if (!config || state?.index == null) return;
    const idx = state.index;
    updateCharacter((c) => config.remove(c, idx));
  }, [config, state?.index, updateCharacter]);

  const title = config ? (editing ? `Editar ${config.title}` : config.title) : '';

  const header = isItemPicker ? (
    <SegmentedControl
      options={ITEM_KINDS.map((k) => ({ value: k.kind, label: k.label }))}
      value={itemKind}
      onChange={(v) => setItemKind(v as EntityKind)}
    />
  ) : undefined;

  return (
    <SheetFormContext.Provider value={api}>
      {children}
      {config && (
        <SheetForm
          open={open}
          title={title}
          fields={config.fields}
          initialValues={initialValues}
          header={header}
          onSubmit={handleSubmit}
          onClose={close}
          onRemove={editing && state?.index != null ? handleRemove : undefined}
        />
      )}
    </SheetFormContext.Provider>
  );
}
