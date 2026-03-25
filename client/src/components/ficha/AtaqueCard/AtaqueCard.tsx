import { useFichaContext } from '../../../contexts/FichaContext';
import { ATRIBUTOS_NOME } from '../../../data/atributos';
import {
  formatMod,
  calcTesteAtaque,
  buildDanoResumo,
  calcPMTotal,
  calcTotalPericia,
  getAtributoEfetivo,
} from '../../../utils/calculations';
import { playSwordSound, playArrowSound } from '../../../utils/sounds';
import { triggerAttackAnim, type AnimacaoEstilo } from '../../../utils/animations';
import type { AtributoId, BonusExtra, DanoExtra } from '../../../types/ficha';
import styles from './AtaqueCard.module.css';

interface AtaqueCardProps {
  index: number;
}

export default function AtaqueCard({ index }: AtaqueCardProps) {
  const { ficha, updateFicha } = useFichaContext();
  if (!ficha) return null;

  const atk = ficha.ataques[index];
  if (!atk) return null;

  const updateAtaque = (updates: Partial<typeof atk>) => {
    updateFicha(f => {
      const ataques = [...f.ataques];
      ataques[index] = { ...ataques[index], ...updates };
      return { ...f, ataques };
    });
  };

  const removeAtaque = () => {
    updateFicha(f => ({ ...f, ataques: f.ataques.filter((_, i) => i !== index) }));
  };

  const duplicateAtaque = () => {
    updateFicha(f => {
      const ataques = [...f.ataques];
      ataques.splice(index + 1, 0, {
        ...ataques[index],
        bonusExtras: ataques[index].bonusExtras.map(b => ({ ...b })),
        danoExtras: ataques[index].danoExtras.map(d => ({ ...d })),
      });
      return { ...f, ataques };
    });
  };

  const usarAtaque = () => {
    const pm = calcPMTotal(atk);
    updateFicha(f => ({
      ...f,
      pm: { ...f.pm, atual: Math.max(0, f.pm.atual - pm) },
      logs: [...f.logs, {
        tipo: 'ataque',
        nome: atk.nome || 'Ataque',
        pmGasto: pm,
        timestamp: Date.now(),
        detalhes: {
          teste: testeTotal,
          dano: danoResumo,
          custoTipo: atk.alcanceTipo === 'ranged' ? 'A Distância' : 'Corpo a Corpo',
        },
      }],
    }));

    if (atk.alcanceTipo === 'ranged') {
      playArrowSound();
    } else {
      playSwordSound();
    }

    const estilo = (ficha?.animacaoAtaque || 'personagem') as AnimacaoEstilo;
    triggerAttackAnim(estilo, {
      tipo: atk.alcanceTipo === 'ranged' ? 'ranged' : 'melee',
      nome: atk.nome || 'Ataque',
      pmCusto: pm,
    });
  };

  const updateBonusTeste = (bIdx: number, updates: Partial<BonusExtra>) => {
    const bonusExtras = [...atk.bonusExtras];
    bonusExtras[bIdx] = { ...bonusExtras[bIdx], ...updates };
    updateAtaque({ bonusExtras });
  };

  const removeBonusTeste = (bIdx: number) => {
    updateAtaque({ bonusExtras: atk.bonusExtras.filter((_, i) => i !== bIdx) });
  };

  const addBonusTeste = () => {
    updateAtaque({ bonusExtras: [...atk.bonusExtras, { nome: '', valor: 0, pm: 0 }] });
  };

  const updateBonusDano = (dIdx: number, updates: Partial<DanoExtra>) => {
    const danoExtras = [...atk.danoExtras];
    danoExtras[dIdx] = { ...danoExtras[dIdx], ...updates };
    updateAtaque({ danoExtras });
  };

  const removeBonusDano = (dIdx: number) => {
    updateAtaque({ danoExtras: atk.danoExtras.filter((_, i) => i !== dIdx) });
  };

  const addBonusDano = () => {
    updateAtaque({ danoExtras: [...atk.danoExtras, { nome: '', valor: '', pm: 0 }] });
  };

  const periciaId = atk.alcanceTipo === 'ranged' ? 'pontaria' : 'luta';
  const periciaBase = calcTotalPericia(ficha, periciaId);
  const testeTotal = calcTesteAtaque(ficha, atk);
  const danoResumo = buildDanoResumo(ficha, atk);
  const danoAttrKey = (atk.danoAtributo || 'for') as AtributoId;
  const danoAttrVal = getAtributoEfetivo(ficha, danoAttrKey);
  const pmTotal = calcPMTotal(atk);
  const activeTesteBuffs = ficha.buffs.filter(b =>
    b.ativo && (
      b.tipo === 'teste_ataque' ||
      (b.tipo === 'pericia' && b.periciaId === periciaId)
    )
  );
  const activeDanoBuffs = ficha.buffs.filter(
    b => b.ativo && (b.tipo === 'dano_fixo' || b.tipo === 'dano_extra'),
  );

  return (
    <div className={styles.card}>
      <button className={styles.usar} onClick={usarAtaque} title="Usar">⚔</button>
      <button className={styles.duplicate} onClick={duplicateAtaque} title="Duplicar">⧉</button>
      <button className={styles.remove} onClick={removeAtaque} title="Remover">✕</button>

      <div className={styles.topRow}>
        <div className={`${styles.campoInfo} ${styles.nomeField}`}>
          <label>Nome</label>
          <input value={atk.nome ?? ''} onChange={e => updateAtaque({ nome: e.target.value })} />
        </div>
        <div className={styles.campoInfo}>
          <label>Alcance</label>
          <select
            value={atk.alcanceTipo ?? 'melee'}
            onChange={e => updateAtaque({ alcanceTipo: e.target.value })}
          >
            <option value="melee">Corpo a corpo</option>
            <option value="ranged">À distância</option>
          </select>
        </div>
        <div className={styles.campoInfo}>
          <label>Crítico</label>
          <input value={atk.critico ?? ''} onChange={e => updateAtaque({ critico: e.target.value })} />
        </div>
        <div className={styles.campoInfo}>
          <label>Tipo Dano</label>
          <input value={atk.tipo ?? ''} onChange={e => updateAtaque({ tipo: e.target.value })} />
        </div>
        <div className={styles.campoInfo}>
          <label>Custo PM</label>
          <input
            type="number"
            value={atk.custoPM ?? 0}
            onChange={e => updateAtaque({ custoPM: Number(e.target.value) || 0 })}
          />
        </div>
        <div className={styles.pmBadgeWrap}>
          <span className={styles.pmBadge}>{pmTotal} PM</span>
        </div>
      </div>

      <div className={styles.sectionsRow}>
        <div className={styles.testeSection}>
          <div className={styles.testeHeader}>
            <label>Teste de Ataque</label>
            <span className={styles.testeTotal}>{formatMod(testeTotal)}</span>
          </div>
          <div className={styles.bonusList}>
            <div className={styles.bonusRow}>
              <span className={styles.bonusFixed}>
                {atk.alcanceTipo === 'ranged' ? 'Pontaria' : 'Luta'}
              </span>
              <span className={styles.bonusValorFixed}>{formatMod(periciaBase)}</span>
            </div>
            {atk.bonusExtras.map((b, bIdx) => (
              <div key={bIdx} className={styles.bonusRow}>
                <input
                  value={b.nome ?? ''}
                  onChange={e => updateBonusTeste(bIdx, { nome: e.target.value })}
                  placeholder="Bônus"
                />
                <input
                  type="number"
                  value={b.valor ?? 0}
                  onChange={e => updateBonusTeste(bIdx, { valor: Number(e.target.value) || 0 })}
                />
                <input
                  type="number"
                  value={b.pm ?? 0}
                  onChange={e => updateBonusTeste(bIdx, { pm: Number(e.target.value) || 0 })}
                  placeholder="PM"
                />
                <button className={styles.removeSm} onClick={() => removeBonusTeste(bIdx)}>
                  ✕
                </button>
              </div>
            ))}
            {activeTesteBuffs.map((b, i) => (
              <div key={`buff-${i}`} className={styles.buffRow}>
                <span className={styles.buffNome}>{b.nome}</span>
                <span className={styles.buffValor}>{formatMod(Number(b.valor) || 0)}</span>
              </div>
            ))}
          </div>
          <button className={styles.addBonus} onClick={addBonusTeste}>+ Bônus</button>
        </div>

        <div className={`${styles.testeSection} ${styles.danoSection}`}>
          <div className={styles.testeHeader}>
            <label>Dano</label>
            <span className={`${styles.testeTotal} ${styles.danoTotal}`}>{danoResumo}</span>
          </div>
          <div className={styles.bonusList}>
            <div className={styles.bonusRow}>
              <span className={styles.bonusFixed}>Dados</span>
              <input
                className={styles.danoDados}
                value={atk.dano ?? ''}
                onChange={e => updateAtaque({ dano: e.target.value })}
                placeholder="2d8"
              />
            </div>
            <div className={styles.bonusRow}>
              <select
                className={styles.danoAttrSel}
                value={atk.danoAtributo || 'for'}
                onChange={e => updateAtaque({ danoAtributo: e.target.value })}
              >
                {(Object.entries(ATRIBUTOS_NOME) as [AtributoId, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <span className={styles.bonusValorFixed}>{formatMod(danoAttrVal)}</span>
            </div>
            {atk.danoExtras.map((d, dIdx) => (
              <div key={dIdx} className={styles.bonusRow}>
                <input
                  value={d.nome ?? ''}
                  onChange={e => updateBonusDano(dIdx, { nome: e.target.value })}
                  placeholder="Bônus"
                />
                <input
                  value={d.valor ?? ''}
                  onChange={e => updateBonusDano(dIdx, { valor: e.target.value })}
                  placeholder="Valor"
                />
                <input
                  type="number"
                  value={d.pm ?? 0}
                  onChange={e => updateBonusDano(dIdx, { pm: Number(e.target.value) || 0 })}
                  placeholder="PM"
                />
                <button className={styles.removeSm} onClick={() => removeBonusDano(dIdx)}>
                  ✕
                </button>
              </div>
            ))}
            {activeDanoBuffs.map((b, i) => (
              <div key={`buff-${i}`} className={styles.buffRow}>
                <span className={styles.buffNome}>{b.nome}</span>
                <span className={styles.buffValor}>{String(b.valor)}</span>
              </div>
            ))}
          </div>
          <button className={styles.addBonus} onClick={addBonusDano}>+ Bônus</button>
        </div>
      </div>
    </div>
  );
}
