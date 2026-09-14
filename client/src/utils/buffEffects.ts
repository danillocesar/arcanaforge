import { ATTRIBUTE_LABELS } from '../data/atributos';
import { SKILLS_CONFIG } from '../data/pericias';
import type { BuffEffect, BuffType } from '../types/character';

export function formatEffectValue(raw: string): string | null {
  const trimmed = (raw ?? '').toString().trim();
  if (!trimmed || trimmed === '0') return null;
  return /^[+-]/.test(trimmed) ? trimmed : `+${trimmed}`;
}

const LEVEL_LABEL = { full: '+nível', half: '+½nível' } as const;

/**
 * Fórmula legível de um efeito: termo fixo mais variáveis — "+2 +Int", "+½nível",
 * "-1 +Des +nível". `null` quando não há nada a mostrar. Os números resolvidos ficam
 * em `resolveEffectValue` (calculations.ts); aqui é só a etiqueta.
 */
export function formatEffectFormula(eff: BuffEffect): string | null {
  const parts: string[] = [];
  const fixed = formatEffectValue(eff.value);
  if (fixed) parts.push(fixed);
  if (eff.attributeBonus) parts.push(`+${ATTRIBUTE_LABELS[eff.attributeBonus]}`);
  if (eff.levelBonus) parts.push(LEVEL_LABEL[eff.levelBonus]);
  return parts.length ? parts.join(' ') : null;
}

/**
 * Fichas salvas antes da divisão de `hp`/`mp` em fixo/temporário gravaram o tipo
 * legado `hp`/`mp` — que sempre significou "temporário". Normaliza pra `temp_hp`/
 * `temp_mp` em todo ponto de leitura, sem precisar migrar os dados salvos.
 */
export function normalizeEffectType(type: BuffType): BuffType {
  const legacy = type as string;
  if (legacy === 'hp') return 'temp_hp';
  if (legacy === 'mp') return 'temp_mp';
  return type;
}

/**
 * `temp_hp`/`temp_mp` são mutações pontuais (aplicadas via toggleBuffState/
 * applyBuffToCharacter contra uma entrada de buff real) — não fazem sentido como
 * bônus passivo sempre ativo, então nunca contam como Bônus Fixo. `max_hp`/`max_mp`
 * são o oposto: sempre um bônus fixo ao máximo, por isso passam direto.
 */
export function filterFixedBonusEffects(effects: BuffEffect[]): BuffEffect[] {
  return effects.filter((eff) => {
    const type = normalizeEffectType(eff.type);
    return type !== 'temp_hp' && type !== 'temp_mp';
  });
}

/** Etiqueta curta do que o efeito afeta — "For", "Vontade", "Atq", "Dano", "PV", "PM", "Def". */
export function effectTag(eff: BuffEffect): string {
  switch (normalizeEffectType(eff.type)) {
    case 'attribute':
      return eff.attributeId ? ATTRIBUTE_LABELS[eff.attributeId] : 'Atributo';
    case 'skill': {
      const skill = SKILLS_CONFIG.find((sk) => sk.id === eff.skillId);
      return skill ? skill.name : 'Perícia';
    }
    case 'attack_roll':
      return 'Atq';
    case 'fixed_damage':
    case 'extra_damage':
      return 'Dano';
    case 'temp_hp':
      return 'PV';
    case 'temp_mp':
      return 'PM';
    case 'max_hp':
      return 'PV Máx';
    case 'max_mp':
      return 'PM Máx';
    case 'defense':
      return 'Def';
    default:
      return '';
  }
}

/**
 * Resumo compacto dos efeitos de um buff pra caber numa linha:
 * um efeito → "Tag +valor"; vários com o mesmo valor (comum em buffs que somam o
 * mesmo bônus em várias perícias/atributos) → "Nx +valor"; valores diferentes →
 * junta cada valor com "/", igual ao comportamento antigo.
 */
export function summarizeEffects(effects: BuffEffect[]): string {
  const withValues = effects
    .map((eff) => ({ eff, val: formatEffectFormula(eff) }))
    .filter((e): e is { eff: BuffEffect; val: string } => e.val != null);

  if (withValues.length === 0) return '';
  if (withValues.length === 1) {
    const { eff, val } = withValues[0];
    const tag = effectTag(eff);
    return tag ? `${tag} ${val}` : val;
  }

  const allSameValue = withValues.every((e) => e.val === withValues[0].val);
  if (allSameValue) return `${withValues.length}x ${withValues[0].val}`;

  return withValues.map((e) => e.val).join('/');
}
