// Fichas salvas antes da divisão de `hp`/`mp` em fixo/temporário gravaram o tipo
// legado `hp`/`mp` — que sempre significou "temporário". Aceita os dois nomes pra
// não quebrar buffs de grupo criados antes dessa mudança.
const isTempHpType = (type) => type === 'temp_hp' || type === 'hp';
const isTempMpType = (type) => type === 'temp_mp' || type === 'mp';
const isMaxHpType = (type) => type === 'max_hp';
const isMaxMpType = (type) => type === 'max_mp';

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
 * Também CURA o PV/PM atual na mesma quantidade dos efeitos de pool do buff novo
 * (temp_hp/temp_mp/max_hp/max_mp) — o teto da barra sobe junto com o buff, então
 * sem a cura o personagem pareceria ferido ao receber o bônus. Clampa no teto
 * calculável aqui: máximo base + pool temporário novo + max_hp/mp dos buffs ativos
 * (bônus fixos de habilidades moram no doc de conteúdo e ficam de fora — o client
 * reclampa com o teto exato ao aplicar localmente).
 *
 * Puro: recebe/devolve { buffs, temporaryHp, temporaryMp, hp, mp } sem tocar no banco.
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

  const healHp = Math.max(
    0,
    sumEffectsByType(entry.effects, isTempHpType) + sumEffectsByType(entry.effects, isMaxHpType),
  );
  const healMp = Math.max(
    0,
    sumEffectsByType(entry.effects, isTempMpType) + sumEffectsByType(entry.effects, isMaxMpType),
  );

  const activeMaxBonus = (matchesType) =>
    nextBuffs
      .filter((b) => b && b.active)
      .reduce((sum, b) => sum + sumEffectsByType(b.effects, matchesType), 0);

  let hp = current.hp;
  if (healHp > 0 && hp && typeof hp === 'object') {
    const ceiling = (Number(hp.max) || 0) + hpTemp + activeMaxBonus(isMaxHpType);
    hp = { ...hp, current: Math.min((Number(hp.current) || 0) + healHp, ceiling) };
  }

  let mp = current.mp;
  if (healMp > 0 && mp && typeof mp === 'object') {
    const ceiling = (Number(mp.max) || 0) + mpTemp + activeMaxBonus(isMaxMpType);
    mp = { ...mp, current: Math.min((Number(mp.current) || 0) + healMp, ceiling) };
  }

  return { buffs: nextBuffs, temporaryHp: hpTemp, temporaryMp: mpTemp, hp, mp };
}

module.exports = { mergeBuffIntoCharacter, isTempHpType, isTempMpType, sumEffectsByType };
