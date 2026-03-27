import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import type { Character } from '../types/character';
import { createEmptyCharacter } from '../utils/calculations';
import {
  apiFetchCharacters,
  apiLoadCharacter,
  apiSaveCharacter,
  apiDeleteCharacter,
} from '../api';
import { useAutoSave } from '../hooks/useAutoSave';
import { useWebSocket } from '../hooks/useWebSocket';
import type { ToastVariant } from '../components/ui/Toast/Toast';

interface CharacterContextValue {
  character: Character | null;
  characterOriginalId: string;
  characterList: string[];
  saveStatus: 'saved' | 'saving' | 'error';

  updateCharacter: (updater: (prev: Character) => Character) => void;
  loadCharacter: (id: string) => Promise<void>;
  createCharacter: (character: Character) => Promise<void>;
  deleteCharacter: () => Promise<void>;
  refreshList: () => Promise<string[]>;
  sendHpUpdate: () => void;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

interface CharacterProviderProps {
  children: React.ReactNode;
  showToast?: (msg: string, variant?: ToastVariant, mpCost?: number) => void;
}

export function CharacterProvider({ children, showToast }: CharacterProviderProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [characterOriginalId, setCharacterOriginalId] = useState('');
  const [characterList, setCharacterList] = useState<string[]>([]);
  const characterRef = useRef<Character | null>(null);
  characterRef.current = character;

  const skipHpBroadcastAfterSaveRef = useRef(false);

  const { send } = useWebSocket((msg) => {
    if (!characterRef.current) return;

    if (msg.type === 'character_hp_sync' && msg.characterId === characterRef.current._id) {
      skipHpBroadcastAfterSaveRef.current = true;
      const hp = msg.hp as { current?: number; max?: number } | undefined;
      const mp = msg.mp as { current?: number; max?: number } | undefined;
      setCharacter((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (hp) {
          next.hp = {
            ...prev.hp,
            current: hp.current ?? prev.hp.current,
            max: hp.max ?? prev.hp.max,
          };
        }
        if (mp) {
          next.mp = {
            ...prev.mp,
            current: mp.current ?? prev.mp.current,
            max: mp.max ?? prev.mp.max,
          };
        }
        return next;
      });
      showToast?.('PV/PM sincronizados de outra aba', 'sync');
    }

    if (msg.type === 'master_hp_sync' && msg.characterId === characterRef.current._id) {
      skipHpBroadcastAfterSaveRef.current = true;
      const currentHp = msg.currentHp as number;
      setCharacter((prev) => {
        if (!prev) return prev;
        return { ...prev, hp: { ...prev.hp, current: currentHp } };
      });
      showToast?.(`PV atualizado pelo mestre: ${currentHp}`, 'info');
    }
  });

  const sendHpUpdate = useCallback(() => {
    const c = characterRef.current;
    if (!c) return;
    skipHpBroadcastAfterSaveRef.current = true;
    send({
      type: 'character_hp_update',
      characterId: c._id,
      name: c.name,
      hp: c.hp,
      mp: c.mp,
    });
  }, [send]);

  const sendHpUpdateRef = useRef(sendHpUpdate);
  sendHpUpdateRef.current = sendHpUpdate;

  const { status: saveStatus } = useAutoSave(character, characterOriginalId, () => {
    if (characterRef.current) {
      setCharacterOriginalId(characterRef.current._id);
    }
    if (skipHpBroadcastAfterSaveRef.current) {
      skipHpBroadcastAfterSaveRef.current = false;
      return;
    }
    sendHpUpdateRef.current();
  });

  const refreshList = useCallback(async () => {
    const list = await apiFetchCharacters();
    setCharacterList(list);
    return list;
  }, []);

  const loadCharacter = useCallback(async (id: string) => {
    const data = await apiLoadCharacter(id);
    if (data) {
      setCharacter(data);
      setCharacterOriginalId(data._id);
      history.replaceState(null, '', `?id=${encodeURIComponent(data._id)}`);
    }
  }, []);

  const createCharacter = useCallback(async (newCharacter: Character) => {
    await apiSaveCharacter(newCharacter._id, newCharacter);
    setCharacter(newCharacter);
    setCharacterOriginalId(newCharacter._id);
    history.replaceState(null, '', `?id=${encodeURIComponent(newCharacter._id)}`);
    await refreshList();
  }, [refreshList]);

  const deleteCharacter = useCallback(async () => {
    if (!characterRef.current) return;
    await apiDeleteCharacter(characterRef.current._id);
    const list = await apiFetchCharacters();
    setCharacterList(list);

    if (list.length > 0) {
      await loadCharacter(list[0]);
    } else {
      const newChar = createEmptyCharacter('Novo Personagem');
      await apiSaveCharacter(newChar._id, newChar);
      setCharacter(newChar);
      setCharacterOriginalId(newChar._id);
      const updatedList = await apiFetchCharacters();
      setCharacterList(updatedList);
    }
  }, [loadCharacter]);

  const updateCharacter = useCallback((updater: (prev: Character) => Character) => {
    skipHpBroadcastAfterSaveRef.current = false;
    setCharacter((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
  }, []);

  const value = useMemo<CharacterContextValue>(() => ({
    character,
    characterOriginalId,
    characterList,
    saveStatus,
    updateCharacter,
    loadCharacter,
    createCharacter,
    deleteCharacter,
    refreshList,
    sendHpUpdate,
  }), [character, characterOriginalId, characterList, saveStatus, updateCharacter, loadCharacter, createCharacter, deleteCharacter, refreshList, sendHpUpdate]);

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}

export function useCharacterContext(): CharacterContextValue {
  const ctx = useContext(CharacterContext);
  if (!ctx) throw new Error('useCharacterContext must be used within CharacterProvider');
  return ctx;
}

export function useCharacterContextOptional(): CharacterContextValue | null {
  return useContext(CharacterContext);
}
