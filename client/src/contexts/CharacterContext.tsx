import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import type { Character } from '../types/character';
import { createEmptyCharacter, normalizeBuffs, normalizeDamageReductions, applyBuffToCharacter } from '../utils/calculations';
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
  readOnly: boolean;

  updateCharacter: (updater: (prev: Character) => Character) => void;
  setCharacterDirect: (char: Character) => void;
  loadCharacter: (id: string) => Promise<void>;
  createCharacter: (character: Character) => Promise<void>;
  deleteCharacter: () => Promise<void>;
  refreshList: () => Promise<string[]>;
  sendHpUpdate: () => void;
  sendSpellCast: (spellName: string, mpCost: number) => void;

  /** Havia uma leva de edições salva antes desta, que ainda não foi desfeita? */
  canUndo: boolean;
  /**
   * Desfaz a última leva de edições (nível único, só nesta sessão): volta o
   * personagem pro estado de antes dela começar e deixa o autosave existente
   * persistir a reversão. Não conta como uma nova leva "desfazível" — pra
   * desfazer de novo, precisa editar algo primeiro.
   */
  undoLastChange: () => void;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

interface CharacterProviderProps {
  children: React.ReactNode;
  showToast?: (msg: string, variant?: ToastVariant, mpCost?: number) => void;
  readOnly?: boolean;
}

interface BroadcastSnapshot {
  hp: { current: number; max: number };
  mp: { current: number; max: number };
  name: string;
}

export function CharacterProvider({ children, showToast, readOnly = false }: CharacterProviderProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [characterOriginalId, setCharacterOriginalId] = useState('');
  const [characterList, setCharacterList] = useState<string[]>([]);
  const characterRef = useRef<Character | null>(null);
  characterRef.current = character;

  const lastBroadcastRef = useRef<BroadcastSnapshot | null>(null);
  const skipNextSaveRef = useRef<() => void>(() => {});

  // Undo de nível único: `undoSnapshotRef` guarda o personagem como estava
  // antes da leva de edições atual começar. `hasPendingEditsRef` marca se já
  // estamos "dentro" de uma leva (snapshot já capturado) — vira false de novo
  // quando o autosave dessa leva termina, então a PRÓXIMA edição captura um
  // snapshot novo (avança o ponto de desfazer, não empilha histórico).
  const undoSnapshotRef = useRef<Character | null>(null);
  const hasPendingEditsRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);

  const resetUndoState = useCallback(() => {
    undoSnapshotRef.current = null;
    hasPendingEditsRef.current = false;
    setCanUndo(false);
  }, []);

  const { send } = useWebSocket((msg) => {
    if (!characterRef.current) return;

    if (msg.type === 'character_hp_sync' && msg.characterId === characterRef.current._id) {
      const hp = msg.hp as { current?: number; max?: number } | undefined;
      const mp = msg.mp as { current?: number; max?: number } | undefined;
      skipNextSaveRef.current();
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
        lastBroadcastRef.current = {
          hp: { ...next.hp },
          mp: { ...next.mp },
          name: next.name,
        };
        return next;
      });
      showToast?.('PV/PM sincronizados de outra aba', 'sync');
    }

    if (msg.type === 'master_hp_sync' && msg.characterId === characterRef.current._id) {
      const currentHp = msg.currentHp as number;
      skipNextSaveRef.current();
      setCharacter((prev) => {
        if (!prev) return prev;
        const next = { ...prev, hp: { ...prev.hp, current: currentHp } };
        lastBroadcastRef.current = {
          hp: { ...next.hp },
          mp: { ...next.mp },
          name: next.name,
        };
        return next;
      });
      showToast?.(`PV atualizado pelo mestre: ${currentHp}`, 'info');
    }

    if (msg.type === 'character_spell_cast_sync' && msg.characterId === characterRef.current._id) {
      const spellName = (msg.spellName as string) || 'Magia';
      const mpCost = Number(msg.mpCost) || 0;
      const casterName = (msg.name as string) || characterRef.current.name;
      showToast?.(`${casterName} usou ${spellName}!`, 'attack', mpCost);
    }

    if (msg.type === 'buff_applied' && msg.characterId === characterRef.current._id) {
      const buff = msg.buff as Character['buffs'][number] | undefined;
      if (buff && Array.isArray(buff.effects)) {
        skipNextSaveRef.current();
        setCharacter((prev) => (prev ? applyBuffToCharacter(prev, buff) : prev));
        showToast?.(`Você recebeu o buff "${buff.name}"${buff.source ? ` ${buff.source}` : ''}!`, 'info');
      }
    }
  });

  const sendHpUpdate = useCallback(() => {
    if (readOnly) return;
    const c = characterRef.current;
    if (!c) return;
    lastBroadcastRef.current = {
      hp: { ...c.hp },
      mp: { ...c.mp },
      name: c.name,
    };
    send({
      type: 'character_hp_update',
      characterId: c._id,
      name: c.name,
      hp: c.hp,
      mp: c.mp,
    });
  }, [send, readOnly]);

  const sendSpellCast = useCallback((spellName: string, mpCost: number) => {
    if (readOnly) return;
    const c = characterRef.current;
    if (!c) return;
    send({
      type: 'character_spell_cast',
      characterId: c._id,
      name: c.name,
      spellName,
      mpCost,
    });
  }, [send, readOnly]);

  const sendHpUpdateRef = useRef(sendHpUpdate);
  sendHpUpdateRef.current = sendHpUpdate;

  const { status: saveStatus, skipNextSave } = useAutoSave(readOnly ? null : character, characterOriginalId, () => {
    // Essa leva de edições terminou de salvar — a próxima edição já captura um
    // snapshot novo (avança o ponto de desfazer). `canUndo` continua true: o
    // usuário ainda pode desfazer a leva que acabou de ser salva.
    hasPendingEditsRef.current = false;

    if (characterRef.current) {
      setCharacterOriginalId(characterRef.current._id);
    }

    const c = characterRef.current;
    if (!c) return;

    const last = lastBroadcastRef.current;
    const changed = !last
      || c.hp.current !== last.hp.current
      || c.hp.max !== last.hp.max
      || c.mp.current !== last.mp.current
      || c.mp.max !== last.mp.max
      || c.name !== last.name;

    if (changed) {
      sendHpUpdateRef.current();
    }
  });
  skipNextSaveRef.current = skipNextSave;

  const refreshList = useCallback(async () => {
    const list = await apiFetchCharacters();
    setCharacterList(list);
    return list;
  }, []);

  const loadCharacter = useCallback(async (id: string) => {
    const data = await apiLoadCharacter(id);
    if (data) {
      const normalized = {
        ...data,
        buffs: normalizeBuffs(data.buffs),
        damageReductions: normalizeDamageReductions(data.damageReductions, data.damageReduction),
      };
      setCharacter(normalized);
      setCharacterOriginalId(data._id);
      resetUndoState();
      lastBroadcastRef.current = {
        hp: { ...data.hp },
        mp: { ...data.mp },
        name: data.name,
      };
      history.replaceState(null, '', `?id=${encodeURIComponent(data._id)}`);
    }
  }, [resetUndoState]);

  const createCharacter = useCallback(async (newCharacter: Character) => {
    await apiSaveCharacter(newCharacter._id, newCharacter);
    setCharacter(newCharacter);
    setCharacterOriginalId(newCharacter._id);
    resetUndoState();
    lastBroadcastRef.current = {
      hp: { ...newCharacter.hp },
      mp: { ...newCharacter.mp },
      name: newCharacter.name,
    };
    history.replaceState(null, '', `?id=${encodeURIComponent(newCharacter._id)}`);
    await refreshList();
  }, [refreshList, resetUndoState]);

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
      resetUndoState();
      const updatedList = await apiFetchCharacters();
      setCharacterList(updatedList);
    }
  }, [loadCharacter, resetUndoState]);

  const updateCharacter = useCallback((updater: (prev: Character) => Character) => {
    if (readOnly) return;
    setCharacter((prev) => {
      if (!prev) return prev;
      if (!hasPendingEditsRef.current) {
        undoSnapshotRef.current = prev;
        hasPendingEditsRef.current = true;
        setCanUndo(true);
      }
      return updater(prev);
    });
  }, [readOnly]);

  const undoLastChange = useCallback(() => {
    if (readOnly) return;
    const snapshot = undoSnapshotRef.current;
    if (!snapshot) return;
    resetUndoState();
    setCharacter(snapshot);
  }, [readOnly, resetUndoState]);

  const setCharacterDirect = useCallback((char: Character) => {
    setCharacter({
      ...char,
      buffs: normalizeBuffs(char.buffs),
      damageReductions: normalizeDamageReductions(char.damageReductions, char.damageReduction),
    });
    setCharacterOriginalId(char._id);
    resetUndoState();
  }, [resetUndoState]);

  const value = useMemo<CharacterContextValue>(() => ({
    character,
    characterOriginalId,
    characterList,
    saveStatus: readOnly ? 'saved' : saveStatus,
    readOnly,
    updateCharacter,
    setCharacterDirect,
    loadCharacter,
    createCharacter,
    deleteCharacter,
    refreshList,
    sendHpUpdate,
    sendSpellCast,
    canUndo,
    undoLastChange,
  }), [character, characterOriginalId, characterList, saveStatus, readOnly, updateCharacter, setCharacterDirect, loadCharacter, createCharacter, deleteCharacter, refreshList, sendHpUpdate, sendSpellCast, canUndo, undoLastChange]);

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
