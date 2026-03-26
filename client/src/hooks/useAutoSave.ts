import { useState, useEffect, useRef, useCallback } from 'react';
import type { Ficha } from '../types/ficha';
import { apiSaveFicha } from '../api';

export function useAutoSave(
  ficha: Ficha | null,
  originalId: string,
  onSaved?: () => void,
): {
  status: 'saved' | 'saving' | 'error';
  triggerSave: () => void;
} {
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const timerRef = useRef<number | undefined>(undefined);
  const fichaRef = useRef(ficha);
  const originalIdRef = useRef(originalId);
  const onSavedRef = useRef(onSaved);
  const isInitialRef = useRef(true);

  fichaRef.current = ficha;
  originalIdRef.current = originalId;
  onSavedRef.current = onSaved;

  const doSave = useCallback(async () => {
    const f = fichaRef.current;
    if (!f) return;

    setStatus('saving');
    try {
      await apiSaveFicha(f._id, f);
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
