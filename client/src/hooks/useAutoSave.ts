import { useState, useEffect, useRef, useCallback } from 'react';
import type { Ficha } from '../types/ficha';
import { apiSaveFicha, apiRenomear } from '../api/api';

export function useAutoSave(
  ficha: Ficha | null,
  originalName: string,
  onSaved?: () => void,
): {
  status: 'saved' | 'saving' | 'error';
  triggerSave: () => void;
} {
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const fichaRef = useRef(ficha);
  const originalNameRef = useRef(originalName);
  const onSavedRef = useRef(onSaved);
  const isInitialRef = useRef(true);

  fichaRef.current = ficha;
  originalNameRef.current = originalName;
  onSavedRef.current = onSaved;

  const doSave = useCallback(async () => {
    const f = fichaRef.current;
    if (!f) return;

    setStatus('saving');
    try {
      if (f.nome !== originalNameRef.current && originalNameRef.current) {
        await apiRenomear(originalNameRef.current, f.nome);
        originalNameRef.current = f.nome;
      }
      await apiSaveFicha(f.nome, f);
      setStatus('saved');
      onSavedRef.current?.();
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!ficha) return;

    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, 800);

    return () => clearTimeout(timerRef.current);
  }, [ficha, doSave]);

  const triggerSave = useCallback(() => {
    clearTimeout(timerRef.current);
    doSave();
  }, [doSave]);

  return { status, triggerSave };
}
