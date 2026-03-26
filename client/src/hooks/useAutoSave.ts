import { useState, useEffect, useRef, useCallback } from 'react';
import type { Character } from '../types/character';
import { apiSaveCharacter } from '../api';

export function useAutoSave(
  character: Character | null,
  originalId: string,
  onSaved?: () => void,
): {
  status: 'saved' | 'saving' | 'error';
  triggerSave: () => void;
} {
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const timerRef = useRef<number | undefined>(undefined);
  const characterRef = useRef(character);
  const originalIdRef = useRef(originalId);
  const onSavedRef = useRef(onSaved);
  const isInitialRef = useRef(true);

  characterRef.current = character;
  originalIdRef.current = originalId;
  onSavedRef.current = onSaved;

  const doSave = useCallback(async () => {
    const c = characterRef.current;
    if (!c) return;

    setStatus('saving');
    try {
      await apiSaveCharacter(c._id, c);
      setStatus('saved');
      onSavedRef.current?.();
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!character) return;

    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, 800);

    return () => clearTimeout(timerRef.current);
  }, [character, doSave]);

  const triggerSave = useCallback(() => {
    clearTimeout(timerRef.current);
    doSave();
  }, [doSave]);

  return { status, triggerSave };
}
