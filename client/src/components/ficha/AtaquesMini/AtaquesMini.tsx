import { useFichaContext } from '../../../contexts/FichaContext';
import {
  formatMod,
  calcTesteAtaque,
  buildDanoResumo,
  calcPMTotal,
} from '../../../utils/calculations';
import { playSwordSound, playArrowSound } from '../../../utils/sounds';
import { triggerAttackAnim, type AnimacaoEstilo } from '../../../utils/animations';
import styles from './AtaquesMini.module.css';

interface AtaquesMiniProps {
  type: 'ataques' | 'magias';
  onConjurar?: (idx: number) => void;
}

export default function AtaquesMini({ type, onConjurar }: AtaquesMiniProps) {
  const { ficha, updateFicha } = useFichaContext();
  if (!ficha) return null;

  const estilo = 'toast' as AnimacaoEstilo;

  const usarAtaque = (idx: number) => {
    const atk = ficha.ataques[idx];
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
          teste: calcTesteAtaque(f, atk),
          dano: buildDanoResumo(f, atk),
          custoTipo: atk.alcanceTipo === 'ranged' ? 'A Distância' : 'Corpo a Corpo',
        },
      }],
    }));

    if (atk.alcanceTipo === 'ranged') {
      playArrowSound();
    } else {
      playSwordSound();
    }
    triggerAttackAnim(estilo, {
      tipo: atk.alcanceTipo === 'ranged' ? 'ranged' : 'melee',
      nome: atk.nome || 'Ataque',
      pmCusto: pm,
    });
  };

  if (type === 'ataques') {
    if (ficha.ataques.length === 0) return null;
    return (
      <div>
        <div className={styles.title}>Ataques</div>
        {ficha.ataques.map((atk, idx) => {
          const teste = calcTesteAtaque(ficha, atk);
          const dano = buildDanoResumo(ficha, atk);
          const pm = calcPMTotal(atk);
          return (
            <div key={idx} className={styles.row}>
              <span className={styles.nome}>{atk.nome || '—'}</span>
              <span className={styles.badge}>{formatMod(teste)}</span>
              <span className={`${styles.badge} ${styles.badgeDano}`}>{dano}</span>
              {pm > 0 && (
                <span className={`${styles.badge} ${styles.badgePm}`}>{pm} PM</span>
              )}
              <button className={styles.usarBtn} onClick={() => usarAtaque(idx)}>⚔</button>
            </div>
          );
        })}
      </div>
    );
  }

  if (ficha.magias.length === 0) return null;
  return (
    <div>
      <div className={styles.title}>Magias</div>
      {ficha.magias.map((mag, idx) => (
        <div key={idx} className={styles.row}>
          <span className={styles.nome}>{mag.nome || '—'}</span>
          <span className={`${styles.badge} ${styles.badgePm}`}>{mag.custoPM} PM</span>
          <button className={styles.usarBtn} onClick={() => onConjurar?.(idx)}>✨</button>
        </div>
      ))}
    </div>
  );
}
