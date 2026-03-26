const fs = require('fs');
const path = require('path');
const paths = require('./paths');

const SENTINEL = '.migrated-v2';

const ATTR_MAP = { for: 'str', des: 'dex', sab: 'wis', car: 'cha' };
const BUFF_TYPE_MAP = {
  teste_ataque: 'attack_roll',
  dano_extra: 'extra_damage',
  dano_fixo: 'fixed_damage',
  atributo: 'attribute',
  vida: 'hp',
  mana: 'mp',
  pericia: 'skill',
};
const SECTION_KEY_MAP = {
  secCabecalho: 'secHeader',
  secAtributos: 'secAttributes',
  secVidaMana: 'secHpMp',
  secBuffs: 'secBuffs',
  secAtaques: 'secAttacks',
  secHabilidades: 'secAbilities',
  secMagias: 'secSpells',
  secInventario: 'secInventory',
  secProficiencias: 'secProficiencies',
  secEfeitos: 'secEffects',
};

function renameKeys(obj, map) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[map[k] || k] = v;
  }
  return result;
}

function migrateClass(cls) {
  if (!cls || typeof cls !== 'object') return cls;
  return {
    name: cls.name || cls.nome || '',
    level: cls.level ?? cls.nivel ?? 0,
  };
}

function migrateCharacter(data) {
  if (!data || typeof data !== 'object') return data;
  if (data._migrated_v2) return data;

  const c = { ...data };

  // Top-level field renames
  if ('nome' in c) { c.name = c.name || c.nome; delete c.nome; }
  if ('sistema' in c) { c.system = c.system || c.sistema; delete c.sistema; }
  if ('raca' in c) { c.race = c.race || c.raca; delete c.raca; }
  if ('origem' in c) { c.origin = c.origin || c.origem; delete c.origem; }
  if ('divindade' in c) { c.deity = c.deity || c.divindade; delete c.divindade; }
  if ('alinhamento' in c) { c.alignment = c.alignment || c.alinhamento; delete c.alinhamento; }
  if ('idade' in c) { c.age = c.age || c.idade; delete c.idade; }
  if ('tamanho' in c) { c.size = c.size || c.tamanho; delete c.tamanho; }
  if ('deslocamento' in c) { c.speed = c.speed || c.deslocamento; delete c.deslocamento; }
  if ('experiencia' in c) { c.experience = c.experience ?? c.experiencia; delete c.experiencia; }
  if ('reducaoDeDano' in c) { c.damageReduction = c.damageReduction || c.reducaoDeDano; delete c.reducaoDeDano; }
  if ('anotacoes' in c) { c.notes = c.notes || c.anotacoes; delete c.anotacoes; }
  if ('efeitosTemporarios' in c) { c.temporaryEffects = c.temporaryEffects || c.efeitosTemporarios; delete c.efeitosTemporarios; }
  if ('proficiencias' in c) { c.proficiencies = c.proficiencies || c.proficiencias; delete c.proficiencias; }
  if ('progressao' in c) { c.progression = c.progression || c.progressao; delete c.progressao; }
  if ('pvTemporario' in c) { c.temporaryHp = c.temporaryHp ?? c.pvTemporario; delete c.pvTemporario; }
  if ('pmTemporario' in c) { c.temporaryMp = c.temporaryMp ?? c.pmTemporario; delete c.pmTemporario; }
  if ('animacaoAtaque' in c) { c.attackAnimation = c.attackAnimation || c.animacaoAtaque; delete c.animacaoAtaque; }
  if ('nivel' in c && !('level' in c)) { c.level = c.nivel; delete c.nivel; }

  // Attributes
  if (c.atributos && !c.attributes) {
    c.attributes = renameKeys(c.atributos, ATTR_MAP);
    delete c.atributos;
  } else if (c.attributes) {
    c.attributes = renameKeys(c.attributes, ATTR_MAP);
  }

  if ('atributoChaveMagia' in c) {
    c.spellcastingAttribute = ATTR_MAP[c.atributoChaveMagia] || c.atributoChaveMagia;
    delete c.atributoChaveMagia;
  }

  // HP/MP
  if (c.pv && !c.hp) {
    c.hp = { max: c.pv.maximo ?? c.pv.max ?? 0, current: c.pv.atual ?? c.pv.current ?? 0 };
    delete c.pv;
  }
  if (c.pm && !c.mp) {
    c.mp = { max: c.pm.maximo ?? c.pm.max ?? 0, current: c.pm.atual ?? c.pm.current ?? 0 };
    delete c.pm;
  }

  // Defense
  if (c.defesa && !c.defense) {
    c.defense = {
      base: c.defesa.base || 10,
      items: (c.defesa.itens || c.defesa.items || []).map((item) => ({
        name: item.name || item.nome || '',
        value: item.value ?? item.valor ?? 0,
        penalty: item.penalty ?? item.penalidade ?? 0,
      })),
    };
    delete c.defesa;
  }

  // Classes
  if (c.classes) {
    c.classes = c.classes.map(migrateClass);
  }

  // Attacks
  if (c.ataques && !c.attacks) { c.attacks = c.ataques; delete c.ataques; }
  if (c.attacks) {
    c.attacks = c.attacks.map((atk) => ({
      name: atk.name || atk.nome || '',
      damage: atk.damage || atk.dano || '',
      critical: atk.critical || atk.critico || '',
      type: atk.type || atk.tipo || '',
      rangeType: atk.rangeType || atk.alcanceTipo || '',
      mpCost: atk.mpCost ?? atk.custoPM ?? 0,
      attributeDamageBonus: atk.attributeDamageBonus || atk.danoAtributo || '',
      extraBonuses: (atk.extraBonuses || atk.bonusExtras || []).map((b) => ({
        name: b.name || b.nome || '',
        value: b.value ?? b.valor ?? 0,
        mp: b.mp ?? b.pm ?? 0,
      })),
      extraDamage: (atk.extraDamage || atk.danoExtras || []).map((b) => ({
        name: b.name || b.nome || '',
        value: b.value || b.valor || '',
        mp: b.mp ?? b.pm ?? 0,
      })),
    }));
  }

  // Skills
  if (c.pericias && !c.skills) { c.skills = c.pericias; delete c.pericias; }
  if (c.skills && typeof c.skills === 'object') {
    const newSkills = {};
    for (const [id, sd] of Object.entries(c.skills)) {
      newSkills[id] = {
        trained: sd.trained ?? sd.treinado ?? false,
        misc: sd.misc ?? sd.outros ?? 0,
        ...(sd.label !== undefined ? { label: sd.label } : {}),
        ...(sd.attribute || sd.atributo ? { attribute: ATTR_MAP[sd.atributo || sd.attribute] || sd.atributo || sd.attribute } : {}),
      };
    }
    c.skills = newSkills;
  }

  // Abilities
  if (c.habilidades && !c.abilities) { c.abilities = c.habilidades; delete c.habilidades; }
  if (c.abilities) {
    c.abilities = c.abilities.map((a) => ({
      name: a.name || a.nome || '',
      source: a.source || a.origem || '',
      type: a.type || a.tipo || '',
      mpCost: a.mpCost ?? a.custoPM ?? 0,
      description: a.description || a.descricao || '',
    }));
  }

  // Spells
  if (c.magias && !c.spells) { c.spells = c.magias; delete c.magias; }
  if (c.spells) {
    c.spells = c.spells.map((m) => ({
      name: m.name || m.nome || '',
      school: m.school || m.escola || '',
      castingTime: m.castingTime || m.execucao || '',
      range: m.range || m.alcance || '',
      area: m.area || '',
      duration: m.duration || m.duracao || '',
      resistance: m.resistance || m.resistencia || '',
      mpCost: m.mpCost ?? m.custoPM ?? 0,
      spellLevel: m.spellLevel ?? m.nivelMagia ?? 0,
      enhancements: (m.enhancements || m.aprimoramentos || []).map((e) => ({
        description: e.description || e.descricao || '',
        mpCost: e.mpCost ?? e.custoPM ?? 0,
      })),
      description: m.description || m.descricao || '',
    }));
  }

  // Inventory
  if (c.inventario && !c.inventory) { c.inventory = c.inventario; delete c.inventario; }
  if (c.inventory) {
    c.inventory = c.inventory.map((item) => ({
      name: item.name || item.nome || '',
      quantity: item.quantity ?? item.quantidade ?? 1,
      weight: item.weight ?? item.carga ?? 0,
    }));
  }

  // Equipped
  if (c.equipados && !c.equipped) { c.equipped = c.equipados; delete c.equipados; }
  if (c.equipped) {
    c.equipped = c.equipped.map((item) => ({
      name: item.name || item.nome || '',
    }));
  }

  // Coins
  if (c.moedas && !c.coins) {
    c.coins = {
      copper: c.moedas.copper ?? c.moedas.tc ?? 0,
      silver: c.moedas.silver ?? c.moedas.tp ?? 0,
      gold: c.moedas.gold ?? c.moedas.to ?? 0,
    };
    delete c.moedas;
  }

  // Buffs
  if (c.buffs) {
    c.buffs = c.buffs.map((b) => ({
      name: b.name || b.nome || '',
      type: BUFF_TYPE_MAP[b.tipo || b.type] || b.type || b.tipo || '',
      ...(b.attributeId || b.atributoId ? { attributeId: ATTR_MAP[b.atributoId || b.attributeId] || b.atributoId || b.attributeId } : {}),
      ...(b.skillId || b.periciaId ? { skillId: b.skillId || b.periciaId } : {}),
      value: b.value || b.valor || '',
      mp: b.mp ?? b.pm ?? 0,
      active: b.active ?? b.ativo ?? false,
    }));
  }

  // Logs
  if (c.logs) {
    c.logs = c.logs.map((l) => ({
      type: l.type || l.tipo || '',
      name: l.name || l.nome || '',
      mpSpent: l.mpSpent ?? l.pmGasto ?? 0,
      timestamp: l.timestamp || 0,
      ...(l.details || l.detalhes ? { details: l.details || l.detalhes } : {}),
    }));
  }

  // Section keys
  if (c.secoesFechadas && !c.collapsedSections) {
    c.collapsedSections = renameKeys(c.secoesFechadas, SECTION_KEY_MAP);
    delete c.secoesFechadas;
  } else if (c.collapsedSections) {
    c.collapsedSections = renameKeys(c.collapsedSections, SECTION_KEY_MAP);
  }
  if (c.secoesOcultas && !c.hiddenSections) {
    c.hiddenSections = renameKeys(c.secoesOcultas, SECTION_KEY_MAP);
    delete c.secoesOcultas;
  } else if (c.hiddenSections) {
    c.hiddenSections = renameKeys(c.hiddenSections, SECTION_KEY_MAP);
  }

  c._migrated_v2 = true;
  return c;
}

function migrateParty(data) {
  if (!data || typeof data !== 'object') return data;
  if (data._migrated_v2) return data;

  const p = { ...data };
  if ('nome' in p) { p.name = p.name || p.nome; delete p.nome; }
  if ('sistema' in p) { p.system = p.system || p.sistema; delete p.sistema; }
  if ('membros' in p) { p.members = p.members || p.membros; delete p.membros; }
  p._migrated_v2 = true;
  return p;
}

function migrateCombat(data) {
  if (!data || typeof data !== 'object') return data;
  if (data._migrated_v2) return data;

  const c = { ...data };
  if ('inimigos' in c) { c.enemies = c.enemies || c.inimigos; delete c.inimigos; }
  if ('iniciativas' in c) {
    const newInit = {};
    for (const [k, v] of Object.entries(c.iniciativas)) {
      const newKey = k.replace(/^jogador_/, 'player_').replace(/^inimigo_/, 'enemy_');
      newInit[newKey] = v;
    }
    c.initiatives = newInit;
    delete c.iniciativas;
  }
  if ('turnoIdx' in c) { c.turnIndex = c.turnIndex ?? c.turnoIdx; delete c.turnoIdx; }
  if ('ordenado' in c) { c.ordered = c.ordered ?? c.ordenado; delete c.ordenado; }
  if ('rodada' in c) { c.round = c.round ?? c.rodada; delete c.rodada; }

  if (c.enemies) {
    c.enemies = c.enemies.map((e) => ({
      id: e.id || '',
      name: e.name || e.nome || '',
      maxHp: e.maxHp ?? e.pvMax ?? 0,
      currentHp: e.currentHp ?? e.pvAtual ?? 0,
      initiative: e.initiative ?? e.iniciativa ?? 0,
      woundThreshold: e.woundThreshold ?? e.limiarAlerta ?? 76,
      criticalThreshold: e.criticalThreshold ?? e.limiarCritico ?? 28,
    }));
  }

  c._migrated_v2 = true;
  return c;
}

function migrateJsonFiles(dir, migrateFn, label) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      migrateJsonFiles(fullPath, migrateFn, label);
      continue;
    }
    if (!entry.name.endsWith('.json')) continue;

    try {
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const data = JSON.parse(raw);
      if (data._migrated_v2) continue;

      const migrated = migrateFn(data);
      fs.writeFileSync(fullPath, JSON.stringify(migrated, null, 2), 'utf-8');
      console.log(`  [migrateData] Migrated ${label}: ${entry.name}`);
    } catch (err) {
      console.error(`  [migrateData] Error migrating ${label} ${entry.name}:`, err.message);
    }
  }
}

function renameAvatarFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f.includes('_sem_fundo')) {
      const newName = f.replace('_sem_fundo', '_transparent');
      const src = path.join(dir, f);
      const dest = path.join(dir, newName);
      if (!fs.existsSync(dest)) {
        fs.renameSync(src, dest);
        console.log(`  [migrateData] Renamed avatar: ${f} -> ${newName}`);
      }
    }
  }
}

function run() {
  const sentinelPath = path.join(paths.DATA_DIR, SENTINEL);
  if (fs.existsSync(sentinelPath)) return;

  console.log('[migrateData] Starting data migration v2 (PT -> EN fields)...');

  migrateJsonFiles(paths.CHARACTERS_DIR, migrateCharacter, 'character');
  migrateJsonFiles(paths.PARTIES_DIR, migrateParty, 'party');
  migrateJsonFiles(paths.COMBAT_DIR, migrateCombat, 'combat');
  renameAvatarFiles(paths.AVATARS_DIR);

  fs.writeFileSync(sentinelPath, new Date().toISOString(), 'utf-8');
  console.log('[migrateData] Data migration v2 complete.');
}

module.exports = { run, migrateCharacter, migrateParty, migrateCombat };
