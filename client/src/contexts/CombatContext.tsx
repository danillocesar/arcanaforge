import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
import { shouldAlert } from '../utils/alertThrottle';
import { useAuth } from '../features/auth';
import {
  normalizeCombatData,
  buildCombatRows,
  adjustTurnIndexAfterRowChange,
  getActivePlayers,
} from '../utils/combatRows';
import { normalizeBuffs, normalizeDamageReductions } from '../utils/calculations';
import { applyDamage, applyHeal, normalizeVitals } from '../utils/vitals';

interface CombatContextValue {
  combatData: CombatData;
  players: CombatPlayer[];
  turnIndex: number;
  ordered: CombatRow[];
  orderActive: boolean;
  isMaster: boolean;
  partyOwnerUid?: string;

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
  setCharacterInactive: (characterId: string, inactive: boolean) => void;
  cycleGmVisual: (characterId: string) => void;
}

const DEFAULT_COMBAT: CombatData = normalizeCombatData({});

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

  const [combatData, setCombatData] = useState<CombatData>(DEFAULT_COMBAT);
  const [players, setPlayers] = useState<CombatPlayer[]>([]);
  const [turnIndex, setTurnIndex] = useState(-1);
  const [orderedList, setOrderedList] = useState<CombatRow[]>([]);
  const [orderActive, setOrderActive] = useState(false);

  const combatDataRef = useRef(combatData);
  combatDataRef.current = combatData;
  const playersRef = useRef(players);
  playersRef.current = players;
  const orderedListRef = useRef<CombatRow[]>([]);
  const turnIndexRef = useRef(-1);

  useEffect(() => {
    turnIndexRef.current = turnIndex;
  }, [turnIndex]);

  const { showToast } = useToast();

  const reloadPlayersRef = useRef<() => void>(() => {});

  const buildOrdered = useCallback((data: CombatData, currentPlayers: CombatPlayer[]) => {
    const rows = buildCombatRows(data, currentPlayers, { sort: true });
    orderedListRef.current = rows;
    setOrderedList(rows);
    setOrderActive(true);
  }, []);

  const { send } = useWebSocket(
    useCallback(
      (msg: WsMessage) => {
        if (msg.type === 'combat_sync' && msg.data) {
          if (partyId && msg.partyId && msg.partyId !== partyId) return;
          const d = normalizeCombatData(msg.data as CombatData);
          setCombatData(d);
          if (d.turnIndex !== undefined) setTurnIndex(d.turnIndex);
          if (d.ordered) {
            buildOrdered(d, playersRef.current);
          } else {
            setOrderActive(false);
            setOrderedList([]);
            orderedListRef.current = [];
          }
        }
        if (msg.type === 'character_hp_sync' && msg.characterId) {
          const charId = msg.characterId as string;
          const hp = msg.hp as { current?: number; max?: number } | undefined;
          const mp = msg.mp as { current?: number; max?: number } | undefined;
          setPlayers((prev) => {
            const existing = prev.find((p) => p._id === charId);
            if (!existing) return prev;

            const tempHp = typeof msg.temporaryHp === 'number' ? msg.temporaryHp : undefined;
            const hpCurChanged = hp?.current !== undefined && hp.current !== existing.currentHp;
            const hpMaxChanged = hp?.max !== undefined && hp.max !== existing.maxHp;
            const mpCurChanged = mp?.current !== undefined && mp.current !== existing.currentMp;
            const mpMaxChanged = mp?.max !== undefined && mp.max !== existing.maxMp;
            const tempChanged = tempHp !== undefined && tempHp !== (existing.temporaryHp ?? 0);

            if (!hpCurChanged && !hpMaxChanged && !mpCurChanged && !mpMaxChanged && !tempChanged) return prev;

            const next = prev.map((p) =>
              p._id === charId
                ? {
                    ...p,
                    currentHp: hp?.current ?? p.currentHp,
                    maxHp: hp?.max ?? p.maxHp,
                    currentMp: mp?.current ?? p.currentMp,
                    maxMp: mp?.max ?? p.maxMp,
                    temporaryHp: tempHp ?? p.temporaryHp,
                  }
                : p,
            );
            queueMicrotask(() => {
              if (combatDataRef.current.ordered) {
                buildOrdered(combatDataRef.current, next);
              }
            });
            // Arrastar a barra de PV dispara vários syncs — alerta 1× a cada 10s
            // por personagem; o estado acima aplica sempre.
            if (shouldAlert(`hp-sync:${charId}`)) {
              showToast(`PV/PM de ${(msg.name as string) || 'jogador'} atualizado`, 'sync');
            }
            return next;
          });
        }
        if (msg.type === 'master_hp_sync' && msg.characterId) {
          const charId = msg.characterId as string;
          const currentHp = msg.currentHp as number;
          const tempHp = typeof msg.temporaryHp === 'number' ? msg.temporaryHp : undefined;
          setPlayers((prev) => {
            const existing = prev.find((p) => p._id === charId);
            if (!existing) return prev;
            const tempSame = tempHp === undefined || tempHp === (existing.temporaryHp ?? 0);
            if (existing.currentHp === currentHp && tempSame) return prev;

            const next = prev.map((p) =>
              p._id === charId ? { ...p, currentHp, temporaryHp: tempHp ?? p.temporaryHp } : p,
            );
            queueMicrotask(() => {
              if (combatDataRef.current.ordered) {
                buildOrdered(combatDataRef.current, next);
              }
            });
            if (shouldAlert(`master-hp:${charId}`)) {
              showToast(`PV de ${(msg.name as string) || 'jogador'} atualizado pelo Mestre`, 'info');
            }
            return next;
          });
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
          const spellName = (msg.spellName as string) || 'Magia';
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

  const mapPartyToPlayers = useCallback(
    (partyChars: Awaited<ReturnType<typeof apiFetchPartyCharacters>>): CombatPlayer[] =>
      partyChars.map((r) => ({
        _id: r._id,
        name: r.name,
        avatar: r.avatar || '',
        classes: r.classes,
        ownerUid: r.ownerUid,
        maxHp: r.hp?.max ?? 0,
        currentHp: r.hp?.current ?? 0,
        maxMp: r.mp?.max ?? 0,
        currentMp: r.mp?.current ?? 0,
        temporaryHp: r.temporaryHp ?? 0,
        damageReductions: r.damageReductions ?? [],
      })),
    [],
  );

  const reloadPlayers = useCallback(async () => {
    if (!partyId) return;
    const partyChars = await apiFetchPartyCharacters(partyId);
    const loadedPlayers = mapPartyToPlayers(partyChars);
    setPlayers(loadedPlayers);

    const cd = combatDataRef.current;
    if (cd.ordered) {
      buildOrdered(cd, loadedPlayers);
    }
  }, [buildOrdered, partyId, mapPartyToPlayers]);
  reloadPlayersRef.current = reloadPlayers;

  const loadCombat = useCallback(async () => {
    if (!partyId) return;
    const raw = await apiLoadCombat(partyId);
    const normalized = normalizeCombatData({ ...raw, round: raw.round ?? 1 });
    setCombatData(normalized);
    if (normalized.turnIndex !== undefined) setTurnIndex(normalized.turnIndex);

    const partyChars = await apiFetchPartyCharacters(partyId);
    const loadedPlayers = mapPartyToPlayers(partyChars);
    setPlayers(loadedPlayers);

    if (normalized.ordered) {
      buildOrdered(normalized, loadedPlayers);
    } else {
      setOrderActive(false);
      setOrderedList([]);
      orderedListRef.current = [];
    }
  }, [buildOrdered, partyId, mapPartyToPlayers]);

  const setCharacterInactive = useCallback(
    (characterId: string, inactive: boolean) => {
      if (!isMaster) return;
      const cd = combatDataRef.current;
      const prevRows = [...orderedListRef.current];
      const prevTurn = turnIndexRef.current;
      const set = new Set(cd.inactiveCharacterIds ?? []);
      if (inactive) set.add(characterId);
      else set.delete(characterId);
      const inactiveCharacterIds = [...set];
      let updated: CombatData = { ...cd, inactiveCharacterIds };

      if (updated.ordered) {
        const newRows = buildCombatRows(updated, playersRef.current, { sort: true });
        const newTurn = adjustTurnIndexAfterRowChange(prevTurn, prevRows, newRows);
        updated = { ...updated, turnIndex: newTurn };
        setTurnIndex(newTurn);
        orderedListRef.current = newRows;
        setOrderedList(newRows);
        setOrderActive(true);
      }

      setCombatData(updated);
      broadcastCombatData(updated);
    },
    [isMaster, broadcastCombatData],
  );

  const cycleGmVisual = useCallback(
    (characterId: string) => {
      if (!isMaster) return;
      const cd = combatDataRef.current;
      const map = { ...(cd.gmCharacterVisual ?? {}) };
      const order = ['ally', 'npc', 'enemy'] as const;
      const cur = map[characterId] ?? 'ally';
      const idx = order.indexOf(cur);
      map[characterId] = order[(idx + 1) % order.length];
      const updated = { ...cd, gmCharacterVisual: map };
      setCombatData(updated);
      broadcastCombatData(updated);
      if (updated.ordered) {
        const rows = buildCombatRows(updated, playersRef.current, { sort: true });
        orderedListRef.current = rows;
        setOrderedList(rows);
      }
    },
    [isMaster, broadcastCombatData],
  );

  const addEnemy = useCallback(
    (name: string, maxHp: number) => {
      const max = Math.max(1, Math.floor(Number(maxHp)) || 1);
      const label = name.trim() || `Inimigo ${combatDataRef.current.enemies.length + 1}`;
      const newEnemy: Enemy = {
        id: `enemy_${Date.now()}`,
        name: label,
        maxHp: max,
        currentHp: max,
        initiative: 0,
        woundThreshold: Math.floor(Math.random() * 21) + 50,
        criticalThreshold: Math.floor(Math.random() * 9) + 2,
      };
      const updated = {
        ...combatDataRef.current,
        enemies: [...combatDataRef.current.enemies, newEnemy],
      };
      setCombatData(updated);
      broadcastCombatData(updated);
    },
    [broadcastCombatData],
  );

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
    const cd = combatDataRef.current;
    const activeCount = getActivePlayers(playersRef.current, cd.inactiveCharacterIds).length;
    const total = activeCount + cd.enemies.length;
    if (total === 0) return;
    const ti = turnIndexRef.current;
    let next: number;
    if (ti < 0) {
      next = 0;
    } else {
      next = (ti + 1) % total;
    }
    let round = cd.round ?? 1;
    if (ti >= 0 && ti === total - 1 && next === 0) {
      round += 1;
    }
    setTurnIndex(next);
    const updated = { ...cd, turnIndex: next, round };
    setCombatData(updated);
    broadcastCombatData(updated);
  }, [broadcastCombatData]);

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
    orderedListRef.current = [];
    setOrderActive(false);
    broadcastCombatData(updated);
  }, [broadcastCombatData]);

  const applyHpChange = useCallback(
    async (rowType: string, characterId: string, enemyIdx: number | undefined, delta: number) => {
      if (rowType === 'player') {
        const loaded = await apiLoadCharacter(characterId);
        if (!loaded) return;
        // Mesmas regras da ficha (utils/vitals.ts): dano consome o PV temporário primeiro,
        // cura nunca passa do máximo EFETIVO (bônus fixos contam) nem repõe temporário.
        const character = normalizeVitals({
          ...loaded,
          buffs: normalizeBuffs(loaded.buffs),
          damageReductions: normalizeDamageReductions(loaded.damageReductions, loaded.damageReduction),
        });
        const next = delta < 0 ? applyDamage(character, -delta, 'hp') : applyHeal(character, delta, 'hp');
        await apiSaveCharacter(characterId, next);
        send({
          type: 'master_hp_update',
          characterId,
          name: next.name,
          currentHp: next.hp.current,
          temporaryHp: next.temporaryHp,
        });
        setPlayers((prev) => {
          const list = prev.map((p) =>
            p._id === characterId ? { ...p, currentHp: next.hp.current, temporaryHp: next.temporaryHp } : p,
          );
          queueMicrotask(() => {
            if (combatDataRef.current.ordered) {
              buildOrdered(combatDataRef.current, list);
            }
          });
          return list;
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

  const value = useMemo<CombatContextValue>(
    () => ({
      combatData,
      players,
      turnIndex,
      ordered: orderedList,
      orderActive,
      isMaster,
      partyOwnerUid: ownerUid,
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
      setCharacterInactive,
      cycleGmVisual,
    }),
    [
      combatData,
      players,
      turnIndex,
      orderedList,
      orderActive,
      isMaster,
      ownerUid,
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
      setCharacterInactive,
      cycleGmVisual,
    ],
  );

  return <CombatContext.Provider value={value}>{children}</CombatContext.Provider>;
}

export function useCombatContext(): CombatContextValue {
  const ctx = useContext(CombatContext);
  if (!ctx) throw new Error('useCombatContext must be used within CombatProvider');
  return ctx;
}

