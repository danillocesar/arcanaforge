export interface Enemy {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  initiative: number;
  woundThreshold: number;
  criticalThreshold: number;
}

export type CombatCharacterVisual = 'ally' | 'npc' | 'enemy';

export interface CombatData {
  enemies: Enemy[];
  initiatives: Record<string, number>;
  turnIndex: number;
  ordered: boolean;
  round?: number;
  inactiveCharacterIds?: string[];
  gmCharacterVisual?: Record<string, CombatCharacterVisual>;
}

export interface CombatPlayer {
  _id: string;
  name: string;
  avatar: string;
  classes: { name: string; level: number }[];
  system?: 'tormenta' | 'naruto';
  clan?: string;
  ownerUid?: string;
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
}

export interface CombatRow {
  type: 'player' | 'enemy';
  id: string;
  characterId?: string;
  name: string;
  initiative: number;
  maxHp?: number;
  currentHp?: number;
  maxMp?: number;
  currentMp?: number;
  avatar?: string;
  classes?: { name: string; level: number }[];
  system?: 'tormenta' | 'naruto';
  clan?: string;
  ownerUid?: string;
  combatVisual?: CombatCharacterVisual;
  woundThreshold?: number;
  criticalThreshold?: number;
}
