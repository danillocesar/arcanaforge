import type { CombatCharacterVisual, CombatData, CombatPlayer, CombatRow } from '../types/combat';

export function normalizeCombatData(incoming: Partial<CombatData>): CombatData {
  const gm = incoming.gmCharacterVisual;
  return {
    enemies: incoming.enemies ?? [],
    initiatives: incoming.initiatives ?? {},
    turnIndex: incoming.turnIndex ?? -1,
    ordered: incoming.ordered ?? false,
    round: incoming.round ?? 1,
    inactiveCharacterIds: incoming.inactiveCharacterIds ?? [],
    gmCharacterVisual:
      gm && typeof gm === 'object' && !Array.isArray(gm) ? (gm as Record<string, CombatCharacterVisual>) : {},
  };
}

export function getActivePlayers(
  players: CombatPlayer[],
  inactiveCharacterIds: string[] | undefined,
): CombatPlayer[] {
  const inactive = new Set(inactiveCharacterIds ?? []);
  return players.filter((p) => !inactive.has(p._id));
}

export function adjustTurnIndexAfterRowChange(
  prevTurnIndex: number,
  prevRows: CombatRow[],
  newRows: CombatRow[],
): number {
  if (newRows.length === 0) return -1;
  if (prevTurnIndex < 0) return -1;
  const currentId = prevRows[prevTurnIndex]?.id;
  if (!currentId) return Math.min(prevTurnIndex, newRows.length - 1);
  const idx = newRows.findIndex((r) => r.id === currentId);
  if (idx >= 0) return idx;
  return Math.min(prevTurnIndex, newRows.length - 1);
}

export function buildCombatRows(
  data: CombatData,
  allPlayers: CombatPlayer[],
  options?: { sort?: boolean },
): CombatRow[] {
  const sort = options?.sort !== false;
  const rows: CombatRow[] = [];
  const activePlayers = getActivePlayers(allPlayers, data.inactiveCharacterIds);

  activePlayers.forEach((p) => {
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
      temporaryHp: p.temporaryHp,
      damageReductions: p.damageReductions,
      avatar: p.avatar,
      classes: p.classes,
      ownerUid: p.ownerUid,
      combatVisual: data.gmCharacterVisual?.[p._id] ?? 'ally',
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

  if (sort) {
    rows.sort((a, b) => b.initiative - a.initiative);
  }
  return rows;
}
