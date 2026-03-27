import type { Character } from '../../../types/character';
import type { NarutoAttributeId } from '../../../types/narutoCharacter';

/* ─── Effect types ─── */

export type ConfigEffect =
  | { type: 'combatAttrOverride'; skill: 'cc' | 'cd' | 'esq' | 'lm'; attr: NarutoAttributeId }
  | { type: 'combatSkillBonus'; skill: 'cc' | 'cd' | 'esq' | 'lm'; value: number }
  | { type: 'movementBonus'; value: number }
  | { type: 'movementDoubleAgi' }
  | { type: 'initiativeBonus'; value: number }
  | { type: 'esquivaBonus'; value: number }
  | { type: 'reacaoOverride'; useSkill: 'lm' }
  | { type: 'vitalidadeBonus'; value: number }
  | { type: 'vitalidadePerAttr'; attr: NarutoAttributeId; multiplier: number }
  | { type: 'chakraMultiplier'; value: number }
  | { type: 'chakraBonus'; value: number }
  | { type: 'chakraBonusFromAttr'; attr: NarutoAttributeId }
  | { type: 'chakraFlatPenalty'; value: number }
  | { type: 'compartmentBonus'; value: number }
  | { type: 'powerPointsPerLevel'; value: number }
  | { type: 'durezaBonus'; value: number }
  | { type: 'durezaFromAttr'; attr: NarutoAttributeId; divisor: number }
  | { type: 'attrBonus'; attr: NarutoAttributeId; value: number }
  | { type: 'unlockSkill'; skillId: string }
  | { type: 'blockCondition'; condition: string };

/* ─── Effects registry ─── */

export const CONFIG_EFFECTS: Record<string, ConfigEffect[]> = {
  // --- Aptidões Não Restritas ---
  acuidade: [
    { type: 'combatAttrOverride', skill: 'cc', attr: 'des' },
  ],
  combateDefensivo: [
    { type: 'combatSkillBonus', skill: 'cc', value: -2 },
    { type: 'esquivaBonus', value: 3 },
  ],
  diligente: [
    { type: 'initiativeBonus', value: 3 },
  ],
  quimico: [
    { type: 'unlockSkill', skillId: 'veneficio' },
  ],
  velocista: [
    { type: 'movementDoubleAgi' },
  ],
  shunjutsu1: [],
  shunjutsu3: [],
  burroDeCarga: [
    { type: 'compartmentBonus', value: 3 },
  ],

  // --- Aptidões Restritas ---
  anatomiaGemea: [],
  armaduraOssea: [],
  byakugouNoIn: [
    { type: 'chakraFlatPenalty', value: 15 },
    { type: 'chakraMultiplier', value: 2 },
  ],
  chakraExpandido: [
    { type: 'chakraMultiplier', value: 1.5 },
  ],
  cloneReserva: [],
  controlePerfeito1: [],
  controlePerfeito2: [
    { type: 'chakraBonusFromAttr', attr: 'int' },
  ],
  corpulencia: [
    { type: 'vitalidadePerAttr', attr: 'vig', multiplier: 3 },
    { type: 'blockCondition', condition: 'acelerado' },
  ],

  // --- Condições Simples ---
  acelerado: [
    { type: 'initiativeBonus', value: 2 },
    { type: 'movementDoubleAgi' },
  ],
  furtividadePerceptiva: [],
  instintoBatalha: [],
  mantoBijuu: [
    { type: 'durezaBonus', value: 1 },
  ],
  modoBijuu: [
    { type: 'durezaBonus', value: 2 },
    { type: 'attrBonus', attr: 'agi', value: 2 },
  ],
  formaBijuu: [
    { type: 'durezaBonus', value: 3 },
  ],
  predadorAquatico: [],
  resiliencia: [
    { type: 'durezaFromAttr', attr: 'vig', divisor: 4 },
    { type: 'movementBonus', value: -5 },
    { type: 'combatSkillBonus', skill: 'esq', value: -3 },
  ],
  resistenciaInsaciavel: [],
  rinnegan: [],
  receptaculoHitokugutsu: [],
  sharinganEsq: [
    { type: 'reacaoOverride', useSkill: 'lm' },
  ],
  shykakyuNoJutsu: [
    { type: 'initiativeBonus', value: 2 },
  ],
  tesouro6Caminhos: [],
  vooKujaku: [],
  senjutsuAtivo: [],

  // --- Regras Extras ---
  tresPtsPoder: [
    { type: 'powerPointsPerLevel', value: 3 },
  ],
  regrasSociais: [],

  // --- Recursos Extras (trackers, sem efeito em cálculos) ---
  bonecoJashin: [],
  kikaichuu: [],
  pontosKamiArte: [],
  pontosKamiEspirito: [],
  pontosVisaoMangekyo: [],
  pontosSaudeKujaku: [],
  pontosSuika: [],
  coracoesJiongu: [],

  // --- Alterações em Poderes (narrativas) ---
  bastaoYagura: [],
  dominioMecanico: [],
  dominioSimples: [],
  elementoNaturalSuiton: [],
  elementoNaturalTerra: [],
  marcaFerro: [],
  ouroPegajoso: [],
  pesoOuro: [],
  tubosAr: [],
};

/* ─── Query helpers ─── */

export function getActiveEffects(char: Character): ConfigEffect[] {
  const config = char.narpiConfig ?? {};
  const blocked = new Set<string>();

  for (const [key, active] of Object.entries(config)) {
    if (active && CONFIG_EFFECTS[key]) {
      for (const eff of CONFIG_EFFECTS[key]) {
        if (eff.type === 'blockCondition') blocked.add(eff.condition);
      }
    }
  }

  const effects: ConfigEffect[] = [];
  for (const [key, active] of Object.entries(config)) {
    if (!active || !CONFIG_EFFECTS[key]) continue;
    if (blocked.has(key)) continue;
    effects.push(...CONFIG_EFFECTS[key]);
  }
  return effects;
}

export function getEffectsOfType<T extends ConfigEffect['type']>(
  char: Character,
  effectType: T,
): Extract<ConfigEffect, { type: T }>[] {
  return getActiveEffects(char).filter(
    (e): e is Extract<ConfigEffect, { type: T }> => e.type === effectType,
  );
}

export function isConfigActive(char: Character, key: string): boolean {
  return !!char.narpiConfig?.[key];
}
