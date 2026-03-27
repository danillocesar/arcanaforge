import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import type { CombatData, CombatPlayer, CombatRow, Enemy } from '../types/combat';
import {
  apiLoadCombat,
  apiSaveCombat,
  apiFetchPartyCharacters,
  apiLoadCharacter,
  apiSaveCharacter,
} from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WsMessage } from '../hooks/useWebSocket';
import { useToast } from '../components/ui/Toast/Toast';
import { useAuth } from '../features/auth';

interface CombatContextValue {
  combatData: CombatData;
  players: CombatPlayer[];
  turnIndex: number;
  ordered: CombatRow[];
  orderActive: boolean;
  isMaster: boolean;

  addEnemy: (name: string, maxHp: number) => void;
  removeEnemy: (idx: number) => void;
  updateInitiative: (id: string, type: string, val: number | string) => void;
  updateEnemyName: (idx: number, name: string) => void;
  updateEnemyMaxHp: (idx: number, maxHp: number) => void;
  sortInitiative: () => void;
  nextTurn: () => void;
  resetTurn: () => void;
  applyHpChange: (type: string, characterId: string, enemyIdx: number | undefined, delta: number) => Promise<void>;
  loadCombat: () => Promise<void>;
}

const DEFAULT_COMBAT: CombatData = {
  enemies: [],
  initiatives: {},
  turnIndex: -1,
  ordered: false,
  round: 1,
};

const CombatContext = createContext<CombatContextValue | null>(null);

export function CombatProvider({
  children,
  partyId,
  ownerUid,
}: {
  children: React.ReactNode;
  partyId?: string;
  ownerUid?: string;
}) {
  const { user } = useAuth();
  const isMaster = Boolean(ownerUid && user?.uid && ownerUid === user.uid);

  const [combatData, setCombatData] = useState<CombatData>({ ...DEFAULT_COMBAT });
  const [players, setPlayers] = useState<CombatPlayer[]>([]);
  const [turnIndex, setTurnIndex] = useState(-1);
  const [orderedList, setOrderedList] = useState<CombatRow[]>([]);
  const [orderActive, setOrderActive] = useState(false);

  const combatDataRef = useRef(combatData);
  combatDataRef.current = combatData;
  const playersRef = useRef(players);
  playersRef.current = players;

  const { showToast } = useToast();

  const reloadPlayersRef = useRef<() => void>(() => {});

  const buildOrdered = useCallback((data: CombatData, currentPlayers: CombatPlayer[]) => {
    const rows: CombatRow[] = [];

    currentPlayers.forEach((p) => {
      rows.push({
        type: 'player',
        id: `player_${p._id}`,
        characterId: p._id,
        name: p.name,
        initiative: Number(data.initiatives[`player_${p._id}`]) || 0,
        maxHp: p.maxHp,
        currentHp: p.currentHp,
        maxMp: p.maxMp,
        currentMp: p.currentMp,
        avatar: p.avatar,
        classes: p.classes,
      });
    });

    data.enemies.forEach((enemy, idx) => {
      rows.push({
        type: 'enemy',
        id: `enemy_${idx}`,
        name: enemy.name,
        initiative: enemy.initiative,
        maxHp: enemy.maxHp,
        currentHp: enemy.currentHp,
        woundThreshold: enemy.woundThreshold,
        criticalThreshold: enemy.criticalThreshold,
      });
    });

    rows.sort((a, b) => b.initiative - a.initiative);
    setOrderedList(rows);
    setOrderActive(true);
  }, []);

  const { send } = useWebSocket(
    useCallback(
      (msg: WsMessage) => {
        if (msg.type === 'combat_sync' && msg.data) {
          if (partyId && msg.partyId && msg.partyId !== partyId) return;
          const d = msg.data as CombatData;
          setCombatData({ ...d, round: d.round ?? 1 });
          if (d.turnIndex !== undefined) setTurnIndex(d.turnIndex);
          if (d.ordered) {
            buildOrdered(d, playersRef.current);
          } else {
            setOrderActive(false);
            setOrderedList([]);
          }
        }
        if (msg.type === 'character_hp_sync' && msg.characterId) {
          const charId = msg.characterId as string;
          const hp = msg.hp as { current?: number; max?: number } | undefined;
          const mp = msg.mp as { current?: number; max?: number } | undefined;
          setPlayers((prev) => {
            const next = prev.map((p) =>
              p._id === charId
                ? {
                    ...p,
                    currentHp: hp?.current ?? p.currentHp,
                    currentMp: mp?.current ?? p.currentMp,
                  }
                : p,
            );
            queueMicrotask(() => {
              if (combatDataRef.current.ordered) {
                buildOrdered(combatDataRef.current, next);
              }
            });
            return next;
          });
          showToast(`PV/PM de ${(msg.name as string) || 'jogador'} atualizado`, 'sync');
        }
        if (msg.type === 'master_hp_sync' && msg.characterId) {
          const charId = msg.characterId as string;
          const currentHp = msg.currentHp as number;
          setPlayers((prev) => {
            const next = prev.map((p) =>
              p._id === charId ? { ...p, currentHp } : p,
            );
            queueMicrotask(() => {
              if (combatDataRef.current.ordered) {
                buildOrdered(combatDataRef.current, next);
              }
            });
            return next;
          });
          showToast(`PV de ${(msg.name as string) || 'jogador'} atualizado pelo Mestre`, 'info');
        }
        if (msg.type === 'party_roster_sync') {
          if (partyId && msg.partyId && msg.partyId !== partyId) return;
          reloadPlayersRef.current();
        }
        if (msg.type === 'character_spell_cast_sync' && msg.characterId) {
          const charId = msg.characterId as string;
          const isParticipant = playersRef.current.some((p) => p._id === charId);
          if (!isParticipant) return;
          const casterName = (msg.name as string) || 'Personagem';
          const spellName = (msg.spellName as string) || 'Jutsu';
          const mpCost = Number(msg.mpCost) || 0;
          showToast(`${casterName} usou ${spellName}!`, 'attack', mpCost);
        }
      },
      [buildOrdered, showToast, partyId],
    ),
  );

  const broadcastCombatData = useCallback(
    (data: CombatData) => {
      send({ type: 'combat_update', data, partyId });
      if (partyId) apiSaveCombat(partyId, data);
    },
    [send, partyId],
  );

  const reloadPlayers = useCallback(async () => {
    if (!partyId) return;
    const partyChars = await apiFetchPartyCharacters(partyId);

    const loadedPlayers: CombatPlayer[] = partyChars.map((r) => ({
      _id: r._id,
      name: r.name,
      avatar: r.avatar || '',
      classes: r.classes,
      maxHp: r.hp?.max ?? 0,
      currentHp: r.hp?.current ?? 0,
      maxMp: r.mp?.max ?? 0,
      currentMp: r.mp?.current ?? 0,
    }));
    setPlayers(loadedPlayers);

    const cd = combatDataRef.current;
    if (cd.ordered) {
      buildOrdered(cd, loadedPlayers);
    }
  }, [buildOrdered, partyId]);
  reloadPlayersRef.current = reloadPlayers;

  const loadCombat = useCallback(async () => {
    if (!partyId) return;
    const data = await apiLoadCombat(partyId);
    const normalized = { ...data, round: data.round ?? 1 };
    setCombatData(normalized);
    if (normalized.turnIndex !== undefined) setTurnIndex(normalized.turnIndex);

    const partyChars = await apiFetchPartyCharacters(partyId);

    const loadedPlayers: CombatPlayer[] = partyChars.map((r) => ({
      _id: r._id,
      name: r.name,
      avatar: r.avatar || '',
      classes: r.classes,
      maxHp: r.hp?.max ?? 0,
      currentHp: r.hp?.current ?? 0,
      maxMp: r.mp?.max ?? 0,
      currentMp: r.mp?.current ?? 0,
    }));
    setPlayers(loadedPlayers);

    if (normalized.ordered) {
      buildOrdered(normalized, loadedPlayers);
    } else {
      setOrderActive(false);
      setOrderedList([]);
    }
  }, [buildOrdered, partyId]);

  const addEnemy = useCallback((name: string, maxHp: number) => {
    const max = Math.max(1, Math.floor(Number(maxHp)) || 1);
    const label = name.trim() || `Inimigo ${combatDataRef.current.enemies.length + 1}`;
    const newEnemy: Enemy = {
      id: `enemy_${Date.now()}`,
      name: label,
      maxHp: max,
      currentHp: max,
      initiative: 0,
      woundThreshold: 76,
      criticalThreshold: 28,
    };
    const updated = {
      ...combatDataRef.current,
      enemies: [...combatDataRef.current.enemies, newEnemy],
    };
    setCombatData(updated);
    broadcastCombatData(updated);
  }, [broadcastCombatData]);

  const removeEnemy = useCallback(
    (idx: number) => {
      const updated = {
        ...combatDataRef.current,
        enemies: combatDataRef.current.enemies.filter((_, i) => i !== idx),
      };
      setCombatData(updated);
      broadcastCombatData(updated);
    },
    [broadcastCombatData],
  );

  const updateInitiative = useCallback(
    (id: string, rowType: string, val: number | string) => {
      if (rowType === 'enemy') {
        const parts = id.split('_');
        const idx = parseInt(parts[parts.length - 1], 10);
        const enemies = combatDataRef.current.enemies.map((enemy, i) =>
          i === idx ? { ...enemy, initiative: Number(val) || 0 } : enemy,
        );
        const updated = { ...combatDataRef.current, enemies };
        setCombatData(updated);
        broadcastCombatData(updated);
      } else {
        const initiatives = { ...combatDataRef.current.initiatives, [id]: Number(val) || 0 };
        const updated = { ...combatDataRef.current, initiatives };
        setCombatData(updated);
        broadcastCombatData(updated);
      }
    },
    [broadcastCombatData],
  );

  const updateEnemyName = useCallback(
    (idx: number, name: string) => {
      const enemies = combatDataRef.current.enemies.map((enemy, i) =>
        i === idx ? { ...enemy, name } : enemy,
      );
      const updated = { ...combatDataRef.current, enemies };
      setCombatData(updated);
      broadcastCombatData(updated);
    },
    [broadcastCombatData],
  );

  const updateEnemyMaxHp = useCallback(
    (idx: number, maxHp: number) => {
      const max = Math.max(1, Math.floor(Number(maxHp)) || 1);
      const enemies = combatDataRef.current.enemies.map((enemy, i) => {
        if (i !== idx) return enemy;
        return {
          ...enemy,
          maxHp: max,
          currentHp: Math.min(enemy.currentHp, max),
        };
      });
      const updated = { ...combatDataRef.current, enemies };
      setCombatData(updated);
      broadcastCombatData(updated);
      if (updated.ordered) {
        buildOrdered(updated, playersRef.current);
      }
    },
    [broadcastCombatData, buildOrdered],
  );

  const sortInitiative = useCallback(() => {
    const updated = { ...combatDataRef.current, ordered: true, turnIndex: 0, round: 1 };
    setCombatData(updated);
    setTurnIndex(0);
    broadcastCombatData(updated);
    buildOrdered(updated, playersRef.current);
  }, [broadcastCombatData, buildOrdered]);

  const nextTurn = useCallback(() => {
    const total = playersRef.current.length + combatDataRef.current.enemies.length;
    if (total === 0) return;
    let next: number;
    if (turnIndex < 0) {
      next = 0;
    } else {
      next = (turnIndex + 1) % total;
    }
    let round = combatDataRef.current.round ?? 1;
    if (turnIndex >= 0 && turnIndex === total - 1 && next === 0) {
      round += 1;
    }
    setTurnIndex(next);
    const updated = { ...combatDataRef.current, turnIndex: next, round };
    setCombatData(updated);
    broadcastCombatData(updated);
  }, [turnIndex, broadcastCombatData]);

  const resetTurn = useCallback(() => {
    const updated = {
      ...combatDataRef.current,
      ordered: false,
      turnIndex: -1,
      round: 1,
    };
    setCombatData(updated);
    setTurnIndex(-1);
    setOrderedList([]);
    setOrderActive(false);
    broadcastCombatData(updated);
  }, [broadcastCombatData]);

  const applyHpChange = useCallback(
    async (rowType: string, characterId: string, enemyIdx: number | undefined, delta: number) => {
      if (rowType === 'player') {
        const character = await apiLoadCharacter(characterId);
        if (!character) return;
        character.hp.current = Math.max(0, Math.min(character.hp.max, character.hp.current + delta));
        await apiSaveCharacter(characterId, character);
        send({
          type: 'master_hp_update',
          characterId,
          name: character.name,
          currentHp: character.hp.current,
        });
        setPlayers((prev) => {
          const next = prev.map((p) =>
            p._id === characterId ? { ...p, currentHp: character.hp.current } : p,
          );
          queueMicrotask(() => {
            if (combatDataRef.current.ordered) {
              buildOrdered(combatDataRef.current, next);
            }
          });
          return next;
        });
      } else if (rowType === 'enemy' && enemyIdx !== undefined) {
        const enemies = combatDataRef.current.enemies.map((enemy, i) => {
          if (i !== enemyIdx) return enemy;
          return {
            ...enemy,
            currentHp: Math.max(0, Math.min(enemy.maxHp, enemy.currentHp + delta)),
          };
        });
        const updated = { ...combatDataRef.current, enemies };
        setCombatData(updated);
        broadcastCombatData(updated);
        if (updated.ordered) {
          buildOrdered(updated, playersRef.current);
        }
      }
    },
    [send, broadcastCombatData, buildOrdered],
  );

  const value = useMemo<CombatContextValue>(() => ({
    combatData,
    players,
    turnIndex,
    ordered: orderedList,
    orderActive,
    isMaster,
    addEnemy,
    removeEnemy,
    updateInitiative,
    updateEnemyName,
    updateEnemyMaxHp,
    sortInitiative,
    nextTurn,
    resetTurn,
    applyHpChange,
    loadCombat,
  }), [combatData, players, turnIndex, orderedList, orderActive, isMaster, addEnemy, removeEnemy, updateInitiative, updateEnemyName, updateEnemyMaxHp, sortInitiative, nextTurn, resetTurn, applyHpChange, loadCombat]);

  return <CombatContext.Provider value={value}>{children}</CombatContext.Provider>;
}

export function useCombatContext(): CombatContextValue {
  const ctx = useContext(CombatContext);
  if (!ctx) throw new Error('useCombatContext must be used within CombatProvider');
  return ctx;
}
