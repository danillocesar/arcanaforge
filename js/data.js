const PERICIAS_CONFIG = [
  { id: 'acrobacia',      nome: 'Acrobacia',      atributo: 'des', penArmadura: true },
  { id: 'adestramento',   nome: 'Adestramento',   atributo: 'car', penArmadura: false, treinado: true },
  { id: 'atletismo',      nome: 'Atletismo',      atributo: 'for', penArmadura: false },
  { id: 'atuacao',        nome: 'Atuação',        atributo: 'car', penArmadura: false, treinado: true },
  { id: 'cavalgar',       nome: 'Cavalgar',       atributo: 'des', penArmadura: false },
  { id: 'conhecimento',   nome: 'Conhecimento',   atributo: 'int', penArmadura: false, treinado: true },
  { id: 'cura',           nome: 'Cura',           atributo: 'sab', penArmadura: false },
  { id: 'diplomacia',     nome: 'Diplomacia',     atributo: 'car', penArmadura: false },
  { id: 'enganacao',      nome: 'Enganação',      atributo: 'car', penArmadura: false },
  { id: 'fortitude',      nome: 'Fortitude',      atributo: 'con', penArmadura: false },
  { id: 'furtividade',    nome: 'Furtividade',    atributo: 'des', penArmadura: true },
  { id: 'guerra',         nome: 'Guerra',         atributo: 'int', penArmadura: false, treinado: true },
  { id: 'iniciativa',     nome: 'Iniciativa',     atributo: 'des', penArmadura: false },
  { id: 'intimidacao',    nome: 'Intimidação',    atributo: 'car', penArmadura: false },
  { id: 'intuicao',       nome: 'Intuição',       atributo: 'sab', penArmadura: false },
  { id: 'investigacao',   nome: 'Investigação',   atributo: 'int', penArmadura: false },
  { id: 'jogatina',       nome: 'Jogatina',       atributo: 'car', penArmadura: false, treinado: true },
  { id: 'ladinagem',      nome: 'Ladinagem',      atributo: 'des', penArmadura: true, treinado: true },
  { id: 'luta',           nome: 'Luta',           atributo: 'for', penArmadura: false },
  { id: 'misticismo',     nome: 'Misticismo',     atributo: 'int', penArmadura: false, treinado: true },
  { id: 'nobreza',        nome: 'Nobreza',        atributo: 'int', penArmadura: false, treinado: true },
  { id: 'oficio1',        nome: 'Ofício',         atributo: 'int', penArmadura: false, treinado: true, customLabel: true },
  { id: 'oficio2',        nome: 'Ofício',         atributo: 'int', penArmadura: false, treinado: true, customLabel: true },
  { id: 'percepacao',     nome: 'Percepção',      atributo: 'sab', penArmadura: false },
  { id: 'pilotagem',      nome: 'Pilotagem',      atributo: 'des', penArmadura: false, treinado: true },
  { id: 'pontaria',       nome: 'Pontaria',       atributo: 'des', penArmadura: false },
  { id: 'reflexos',       nome: 'Reflexos',       atributo: 'des', penArmadura: false },
  { id: 'religiao',       nome: 'Religião',       atributo: 'sab', penArmadura: false },
  { id: 'sobrevivencia',  nome: 'Sobrevivência',  atributo: 'sab', penArmadura: false },
  { id: 'vontade',        nome: 'Vontade',        atributo: 'sab', penArmadura: false },
];

const ATRIBUTOS_NOME = {
  'for': 'FOR', 'des': 'DES', 'con': 'CON',
  'int': 'INT', 'sab': 'SAB', 'car': 'CAR'
};

const ATRIBUTOS_COMPLETO = {
  'for': 'Força', 'des': 'Destreza', 'con': 'Constituição',
  'int': 'Inteligência', 'sab': 'Sabedoria', 'car': 'Carisma'
};

function criarFichaVazia(nome) {
  const pericias = {};
  PERICIAS_CONFIG.forEach(p => {
    pericias[p.id] = { treinado: false, outros: 0 };
    if (p.customLabel) pericias[p.id].label = '';
  });

  return {
    nome: nome || 'Novo Personagem',
    classes: [{ nome: '', nivel: 1 }],
    raca: '',
    origem: '',
    divindade: '',
    alinhamento: '',
    idade: '',
    tamanho: 'Médio',
    deslocamento: '9m / 6q',
    experiencia: 0,
    atributos: { 'for': 0, des: 0, con: 0, 'int': 0, sab: 0, car: 0 },
    pv: { maximo: 0, atual: 0 },
    pm: { maximo: 0, atual: 0 },
    defesa: {
      base: 10,
      itens: []
    },
    reducaoDeDano: '',
    ataques: [],
    pericias,
    habilidades: [],
    magias: [],
    atributoChaveMagia: 'int',
    inventario: [],
    equipados: [{ nome: '' }, { nome: '' }, { nome: '' }, { nome: '' }],
    moedas: { tc: 0, tp: 0, to: 0 },
    anotacoes: '',
    efeitosTemporarios: '',
    proficiencias: '',
    progressao: [],
    buffs: [],
    pvTemporario: 0,
    pmTemporario: 0,
    secoesFechadas: {},
    secoesOcultas: {},
    animacaoAtaque: 'personagem',
    avatar: ''
  };
}

function getNivelTotal(ficha) {
  if (ficha.classes && ficha.classes.length > 0) {
    return ficha.classes.reduce((sum, c) => sum + (parseInt(c.nivel) || 0), 0);
  }
  return parseInt(ficha.nivel) || 1;
}

function getAtributoEfetivo(ficha, attr) {
  let val = ficha.atributos[attr] || 0;
  if (ficha.buffs) {
    ficha.buffs.forEach(b => {
      if (b.ativo && b.tipo === 'atributo' && b.atributoId === attr) {
        val += (parseInt(b.valor) || 0);
      }
    });
  }
  return val;
}

function calcTotalPericia(ficha, periciaId) {
  const cfg = PERICIAS_CONFIG.find(p => p.id === periciaId);
  if (!cfg) return 0;
  const per = ficha.pericias[periciaId];
  if (!per) return 0;

  const metadeNivel = Math.floor(getNivelTotal(ficha) / 2);
  const atributoUsado = per.atributo || cfg.atributo;
  const modAtributo = getAtributoEfetivo(ficha, atributoUsado);
  const treino = per.treinado ? 2 : 0;
  const outros = per.outros || 0;
  let penArmadura = 0;
  if (cfg.penArmadura) {
    penArmadura = calcPenArmadura(ficha);
  }
  let buffBonus = 0;
  if (ficha.buffs) {
    ficha.buffs.forEach(b => {
      if (b.ativo && b.tipo === 'pericia' && b.periciaId === periciaId) {
        buffBonus += (parseInt(b.valor) || 0);
      }
    });
  }
  return metadeNivel + modAtributo + treino + outros + penArmadura + buffBonus;
}

function calcPenArmadura(ficha) {
  let pen = 0;
  if (ficha.defesa && ficha.defesa.itens) {
    ficha.defesa.itens.forEach(item => {
      if (item.penalidade) pen += item.penalidade;
    });
  }
  return pen;
}

function calcDefesaTotal(ficha) {
  let total = ficha.defesa.base || 10;
  if (ficha.defesa.itens) {
    ficha.defesa.itens.forEach(item => {
      total += (item.valor || 0);
    });
  }
  return total;
}

function calcLimiteCarga(ficha) {
  const forca = getAtributoEfetivo(ficha, 'for');
  if (forca < 0) return 10 + forca;
  return 10 + 2 * forca;
}

function calcCargaUsada(ficha) {
  let total = 0;
  if (ficha.inventario) {
    ficha.inventario.forEach(item => {
      total += (item.carga || 0) * (item.quantidade || 1);
    });
  }
  return total;
}

function calcResistenciaMagia(ficha) {
  const attrKey = ficha.atributoChaveMagia || 'int';
  const mod = getAtributoEfetivo(ficha, attrKey);
  return 10 + Math.floor(getNivelTotal(ficha) / 2) + mod;
}

function formatMod(val) {
  const n = parseInt(val) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
}
