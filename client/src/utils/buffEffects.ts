import { ATTRIBUTE_LABELS } from '../data/atributos';
import { SKILLS_CONFIG } from '../data/pericias';
import type { BuffEffect } from '../types/character';

export function formatEffectValue(raw: string): string | null {
  const trimmed = (raw ?? '').toString().trim();
  if (!trimmed || trimmed === '0') return null;
  return /^[+-]/.test(trimmed) ? trimmed : `+${trimmed}`;
}

/**
 * `hp`/`mp` são mutações pontuais (aplicadas via toggleBuffState/applyBuffToCharacter
 * contra uma entrada de buff real) — não fazem sentido como bônus passivo sempre
 * ativo, então nunca contam como Bônus Fixo.
 */
export function filterFixedBonusEffects(effects: BuffEffect[]): BuffEffect[] {
  return effects.filter((eff) => eff.type !== 'hp' && eff.type !== 'mp');
}

/** Etiqueta curta do que o efeito afeta — "For", "Vontade", "Atq", "Dano", "PV", "PM", "Def". */
export function effectTag(eff: BuffEffect): string {
  switch (eff.type) {
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
    case 'hp':
      return 'PV';
    case 'mp':
      return 'PM';
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
    .map((eff) => ({ eff, val: formatEffectValue(eff.value) }))
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
