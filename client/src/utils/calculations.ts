import type { Ficha, AtributoId } from '../types/ficha';
import { PERICIAS_CONFIG } from '../data/pericias';

export function criarFichaVazia(nome?: string): Ficha {
  const pericias: Ficha['pericias'] = {};
  PERICIAS_CONFIG.forEach((p) => {
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
    atributos: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    pv: { maximo: 0, atual: 0 },
    pm: { maximo: 0, atual: 0 },
    defesa: { base: 10, itens: [] },
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
    avatar: '',
    logs: [],
  };
}

export function getNivelTotal(ficha: Ficha): number {
  if (ficha.classes && ficha.classes.length > 0) {
    return ficha.classes.reduce((sum, c) => sum + (Number(c.nivel) || 0), 0);
  }
  return Number(ficha.nivel) || 1;
}

export function getAtributoEfetivo(ficha: Ficha, attr: AtributoId): number {
  let val = ficha.atributos[attr] || 0;
  if (ficha.buffs) {
    ficha.buffs.forEach((b) => {
      if (b.ativo && b.tipo === 'atributo' && b.atributoId === attr) {
        val += Number(b.valor) || 0;
      }
    });
  }
  return val;
}

export function calcPenArmadura(ficha: Ficha): number {
  let pen = 0;
  if (ficha.defesa?.itens) {
    ficha.defesa.itens.forEach((item) => {
      if (item.penalidade) pen += item.penalidade;
    });
  }
  return pen;
}

export function calcTotalPericia(ficha: Ficha, periciaId: string): number {
  const cfg = PERICIAS_CONFIG.find((p) => p.id === periciaId);
  if (!cfg) return 0;
  const per = ficha.pericias[periciaId];
  if (!per) return 0;

  const metadeNivel = Math.floor(getNivelTotal(ficha) / 2);
  const atributoUsado = (per.atributo || cfg.atributo) as AtributoId;
  const modAtributo = getAtributoEfetivo(ficha, atributoUsado);
  const treino = per.treinado ? 2 : 0;
  const outros = per.outros || 0;
  let penArmadura = 0;
  if (cfg.penArmadura) {
    penArmadura = calcPenArmadura(ficha);
  }
  let buffBonus = 0;
  if (ficha.buffs) {
    ficha.buffs.forEach((b) => {
      if (b.ativo && b.tipo === 'pericia' && b.periciaId === periciaId) {
        buffBonus += Number(b.valor) || 0;
      }
    });
  }
  return metadeNivel + modAtributo + treino + outros + penArmadura + buffBonus;
}

export function calcDefesaTotal(ficha: Ficha): number {
  let total = ficha.defesa.base || 10;
  if (ficha.defesa.itens) {
    ficha.defesa.itens.forEach((item) => {
      total += item.valor || 0;
    });
  }
  return total;
}

export function calcLimiteCarga(ficha: Ficha): number {
  const forca = getAtributoEfetivo(ficha, 'for');
  if (forca < 0) return 10 + forca;
  return 10 + 2 * forca;
}

export function calcCargaUsada(ficha: Ficha): number {
  let total = 0;
  if (ficha.inventario) {
    ficha.inventario.forEach((item) => {
      total += (item.carga || 0) * (item.quantidade || 1);
    });
  }
  return total;
}

export function calcResistenciaMagia(ficha: Ficha): number {
  const attrKey = ficha.atributoChaveMagia || 'int';
  const mod = getAtributoEfetivo(ficha, attrKey);
  return 10 + Math.floor(getNivelTotal(ficha) / 2) + mod;
}

export function calcTesteAtaque(ficha: Ficha, atk: Ficha['ataques'][number]): number {
  const periciaId = atk.alcanceTipo === 'ranged' ? 'pontaria' : 'luta';
  let total = calcTotalPericia(ficha, periciaId);
  if (atk.bonusExtras) atk.bonusExtras.forEach((b) => { total += Number(b.valor) || 0; });
  if (ficha.buffs) ficha.buffs.forEach((b) => {
    if (b.ativo && b.tipo === 'teste_ataque') total += Number(b.valor) || 0;
  });
  return total;
}

export function calcDanoBonus(ficha: Ficha, atk: Ficha['ataques'][number]): number {
  const attrKey = (atk.danoAtributo || 'for') as AtributoId;
  let total = getAtributoEfetivo(ficha, attrKey);
  if (atk.danoExtras) atk.danoExtras.forEach((b) => { total += Number(b.valor) || 0; });
  if (ficha.buffs) ficha.buffs.forEach((b) => {
    if (b.ativo && b.tipo === 'dano_fixo') total += Number(b.valor) || 0;
  });
  return total;
}

export function buildDanoResumo(ficha: Ficha, atk: Ficha['ataques'][number]): string {
  const parts: string[] = [];
  const danoDados = atk.dano || '';
  if (danoDados) parts.push(danoDados);

  const danoBonus = calcDanoBonus(ficha, atk);

  const extraDice: string[] = [];
  if (atk.danoExtras) atk.danoExtras.forEach((b) => {
    const v = String(b.valor || '');
    if (v && isNaN(Number(v))) extraDice.push(v);
  });
  if (ficha.buffs) ficha.buffs.forEach((b) => {
    if (b.ativo && b.tipo === 'dano_extra') {
      const v = String(b.valor || '');
      if (v) extraDice.push(v);
    }
  });
  extraDice.forEach((d) => parts.push(d));

  if (danoBonus !== 0 || parts.length === 0) {
    parts.push(danoBonus >= 0 && parts.length > 0 ? `+${danoBonus}` : formatMod(danoBonus));
  }

  return parts.join('+').replace(/\+\+/g, '+').replace(/\+-/g, '-');
}

export function calcPMTotal(atk: Ficha['ataques'][number]): number {
  let total = Number(atk.custoPM) || 0;
  if (atk.bonusExtras) atk.bonusExtras.forEach((b) => { total += Number(b.pm) || 0; });
  if (atk.danoExtras) atk.danoExtras.forEach((b) => { total += Number(b.pm) || 0; });
  return total;
}

export function formatMod(val: number | string): string {
  const n = Number(val) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
}

export function pvPercent(atual: number, max: number): number {
  if (!max || max <= 0) return 0;
  return Math.max(0, Math.min(100, (atual / max) * 100));
}
