// Fichas salvas antes da divisão de `hp`/`mp` em fixo/temporário gravaram o tipo
// legado `hp`/`mp` — que sempre significou "temporário". Aceita os dois nomes pra
// não quebrar buffs de grupo criados antes dessa mudança.
const isTempHpType = (type) => type === 'temp_hp' || type === 'hp';
const isTempMpType = (type) => type === 'temp_mp' || type === 'mp';

function sumEffectsByType(effects, matchesType) {
  return (effects || [])
    .filter((eff) => eff && matchesType(eff.type))
    .reduce((sum, eff) => sum + (Number(eff.value) || 0), 0);
}

const buffNameKey = (name) => String(name || '').trim().toLowerCase();

/**
 * Aplica um buff de grupo no estado salvo de um personagem, espelhando o
 * `applyBuffToCharacter` do client: se já existe buff com o mesmo nome
 * (normalizado, ignorando a origem), SUBSTITUI a entrada em vez de duplicar —
 * devolve a contribuição de PV/PM temporário de cada cópia ATIVA antiga e soma a
 * da nova. Duplicatas pré-existentes (do bug antigo) são colapsadas numa entrada
 * só, na posição da primeira. Buff sem nome nunca substitui outro sem nome.
 *
 * Puro: recebe/devolve { buffs, temporaryHp, temporaryMp } sem tocar no banco.
 */
function mergeBuffIntoCharacter(current, entry) {
  const buffs = Array.isArray(current.buffs) ? current.buffs : [];
  const key = buffNameKey(entry.name);
  const matches = key === '' ? [] : buffs.filter((b) => buffNameKey(b && b.name) === key);

  let hpTemp = Number(current.temporaryHp) || 0;
  let mpTemp = Number(current.temporaryMp) || 0;

  matches.forEach((b) => {
    if (!b || !b.active) return;
    hpTemp = Math.max(0, hpTemp - sumEffectsByType(b.effects, isTempHpType));
    mpTemp = Math.max(0, mpTemp - sumEffectsByType(b.effects, isTempMpType));
  });

  hpTemp += sumEffectsByType(entry.effects, isTempHpType);
  mpTemp += sumEffectsByType(entry.effects, isTempMpType);

  let replaced = false;
  const nextBuffs =
    matches.length === 0
      ? [...buffs, entry]
      : buffs.flatMap((b) => {
          if (buffNameKey(b && b.name) !== key) return [b];
          if (replaced) return [];
          replaced = true;
          return [entry];
        });

  return { buffs: nextBuffs, temporaryHp: hpTemp, temporaryMp: mpTemp };
}

module.exports = { mergeBuffIntoCharacter, isTempHpType, isTempMpType, sumEffectsByType };
