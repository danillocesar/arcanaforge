import { useEffect, useState } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { getTotalLevel, applyBuffToCharacter, calcSpellResistance } from '../../../utils/calculations';
import { composeCast, formatResistanceLine, type CastEnhancement } from '../../../utils/castAction';
import { playMagicSound } from '../../../utils/sounds';
import { triggerAttackAnim } from '../../../utils/animations';
import { apiFetchParties, apiFetchPartyCharacters, apiApplyBuffToParty, type PartyCharacter } from '../../../api';
import type { BuffEffect } from '../../../types/character';
import { getInitials } from '../../../utils/formatters';
import { showToast } from '../../../services/toastService';
import Sheet from '../../ui/Sheet/Sheet';
import Stepper from '../../ui/Stepper/Stepper';
import styles from './CastActionSheet.module.css';

export type CastActionEnhancement = CastEnhancement;

export interface CastActionSpec {
  name: string;
  mpCost: number;
  buffs?: BuffEffect[];
  buffTargetScope?: 'self' | 'party';
  enhancements?: CastActionEnhancement[];
  /** Teste de resistência da magia de origem, ex. "Vontade anula" — vai junto no buff. */
  resistance?: string;
}

interface CastActionSheetProps {
  action: CastActionSpec | null;
  onClose: () => void;
}

type Step = 'config' | 'targets';

function CastActionSheet({ action, onClose }: CastActionSheetProps) {
  const { character, updateCharacter, sendSpellCast } = useCharacterContext();
  const [enhCounts, setEnhCounts] = useState<number[]>([]);
  const [step, setStep] = useState<Step>('config');
  const [candidates, setCandidates] = useState<PartyCharacter[]>([]);
  const [candidatePartyId, setCandidatePartyId] = useState<Record<string, string>>({});
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [lastAction, setLastAction] = useState<CastActionSpec | null>(null);
  const [busy, setBusy] = useState(false);

  const activeAction = action ?? lastAction;
  const enhancements = activeAction?.enhancements ?? [];

  useEffect(() => {
    if (action) {
      setLastAction(action);
      setEnhCounts(new Array((action.enhancements ?? []).length).fill(0));
      setStep('config');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  if (!character || !activeAction) return null;

  const baseCost = Number(activeAction.mpCost) || 0;
  const { totalCost, effects: combinedBuffs } = composeCast(activeAction, enhCounts);
  const level = getTotalLevel(character);

  // A CD sai do conjurador, mas quem precisa dela na ficha é quem recebeu o buff —
  // por isso viaja junto com o buff, inclusive no aplicado no grupo.
  const dc = calcSpellResistance(character);
  const resistanceLine = formatResistanceLine(activeAction.resistance, dc);

  const buffPayload = {
    name: activeAction.name,
    effects: combinedBuffs,
    source: `de ${character.name}`,
    ...(resistanceLine ? { resistance: activeAction.resistance, dc } : {}),
  };

  const setEnhCount = (i: number, value: number) => {
    setEnhCounts((prev) => {
      const next = [...prev];
      next[i] = Math.max(0, value);
      return next;
    });
  };

  const finish = () => {
    updateCharacter((f) => ({
      ...f,
      mp: { ...f.mp, current: Math.max(0, f.mp.current - totalCost) },
      logs: [
        ...f.logs,
        {
          type: 'spell',
          name: activeAction.name || 'Ação',
          mpSpent: totalCost,
          timestamp: Date.now(),
          details: { baseMpCost: baseCost, totalCost },
        },
      ],
    }));
    sendSpellCast(activeAction.name || 'Ação', totalCost);
    playMagicSound();
    triggerAttackAnim('toast', { type: 'magic', name: activeAction.name || 'Ação', mpCost: totalCost });
  };

  const goToTargetsOrFinish = async () => {
    if (combinedBuffs.length === 0 || activeAction.buffTargetScope !== 'party') {
      // Sem alvo a escolher: se há buff, aplica só no próprio conjurador.
      if (combinedBuffs.length > 0) {
        const buff = { ...buffPayload, mp: totalCost, active: true };
        updateCharacter((f) => applyBuffToCharacter(f, buff));
      }
      finish();
      onClose();
      return;
    }

    setBusy(true);
    try {
      const parties = await apiFetchParties();
      const mine = parties.filter((p) => p.members.some((m) => m.characterIds.includes(character._id)));
      if (mine.length === 0) {
        const buff = { ...buffPayload, mp: totalCost, active: true };
        updateCharacter((f) => applyBuffToCharacter(f, buff));
        finish();
        onClose();
        return;
      }

      const rosters = await Promise.all(mine.map((p) => apiFetchPartyCharacters(p.id)));
      const seen = new Set<string>();
      const merged: PartyCharacter[] = [];
      const partyOf: Record<string, string> = {};
      rosters.forEach((roster, idx) => {
        roster.forEach((c) => {
          if (!seen.has(c._id)) {
            seen.add(c._id);
            merged.push(c);
            partyOf[c._id] = mine[idx].id;
          }
        });
      });

      setCandidates(merged);
      setCandidatePartyId(partyOf);
      setSelectedTargets(new Set([character._id]));
      setStep('targets');
    } catch {
      showToast('Falha ao carregar o grupo. Tente novamente.', 'default');
    } finally {
      setBusy(false);
    }
  };

  const toggleTarget = (id: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const confirmTargets = async () => {
    if (selectedTargets.size === 0) {
      showToast('Selecione ao menos um alvo.', 'default');
      return;
    }

    const others = [...selectedTargets].filter((id) => id !== character._id);
    const includesSelf = selectedTargets.has(character._id);

    setBusy(true);
    try {
      if (others.length > 0) {
        const byParty = new Map<string, string[]>();
        others.forEach((id) => {
          const pid = candidatePartyId[id];
          if (!pid) return;
          byParty.set(pid, [...(byParty.get(pid) ?? []), id]);
        });
        await Promise.all(
          [...byParty.entries()].map(([partyId, targetCharacterIds]) =>
            apiApplyBuffToParty(partyId, { targetCharacterIds, buff: buffPayload }),
          ),
        );
      }

      if (includesSelf) {
        const buff = { ...buffPayload, mp: totalCost, active: true };
        updateCharacter((f) => applyBuffToCharacter(f, buff));
      }

      finish();
      onClose();
    } catch {
      showToast('Falha ao aplicar o buff no grupo. Tente novamente.', 'default');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'targets') {
    const footer = (
      <>
        <button type="button" className={styles.btnCancel} onClick={() => setStep('config')} disabled={busy}>
          Voltar
        </button>
        <button type="button" className={styles.btnConfirm} onClick={() => { void confirmTargets(); }} disabled={busy}>
          {busy ? 'Aguarde…' : '✦ Aplicar'}
        </button>
      </>
    );
    return (
      <Sheet open={Boolean(action)} onClose={handleClose} title={`Aplicar "${activeAction.name}" em`} footer={footer}>
        {candidates.length === 0 ? (
          <p className={styles.targetEmpty}>Nenhum outro personagem no grupo.</p>
        ) : (
          <div className={styles.targetList}>
            {candidates.map((c) => (
              <label key={c._id} className={styles.targetRow}>
                <input
                  type="checkbox"
                  checked={selectedTargets.has(c._id)}
                  onChange={() => toggleTarget(c._id)}
                />
                <span className={styles.targetAvatar}>
                  {c.avatar ? <img className={styles.targetAvatarImg} src={c.avatar} alt="" /> : getInitials(c.name)}
                </span>
                <span className={styles.targetName}>{c.name || 'Sem nome'}</span>
              </label>
            ))}
          </div>
        )}
      </Sheet>
    );
  }

  const footer = (
    <>
      <button type="button" className={styles.btnCancel} onClick={handleClose} disabled={busy}>
        Cancelar
      </button>
      <button type="button" className={styles.btnConfirm} onClick={() => { void goToTargetsOrFinish(); }} disabled={busy}>
        {busy ? 'Aguarde…' : '✦ Conjurar'}
      </button>
    </>
  );

  return (
    <Sheet open={Boolean(action)} onClose={handleClose} title={activeAction.name || 'Ação'} footer={footer}>
      <div className={styles.baseCost}>
        <span className={styles.baseLabel}>Custo Base</span>
        <span className={styles.baseVal}>{baseCost} PM</span>
      </div>

      {enhancements.length > 0 && <div className={styles.enhHeader}>Aprimoramentos</div>}

      {enhancements.length > 0 ? (
        <div className={styles.enhList}>
          {enhancements.map((enh, i) => {
            const times = enhCounts[i] || 0;
            const unitCost = Number(enh.mpCost) || 0;
            return (
              <div key={i} className={`${styles.enhItem} ${times > 0 ? styles.enhItemOn : ''}`.trim()}>
                <span className={styles.enhDesc}>{enh.description || `Aprimoramento ${i + 1}`}</span>
                <Stepper value={times} onChange={(v) => setEnhCount(i, v)} min={0} className={styles.enhStepper} />
                <span className={styles.enhPm}>
                  +{times > 0 ? unitCost * times : unitCost} PM
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        activeAction?.enhancements !== undefined && <p className={styles.empty}>Nenhum aprimoramento cadastrado.</p>
      )}

      {resistanceLine && (
        <div className={styles.resistRow}>
          <span className={styles.resistLabel}>Resistência</span>
          <span className={styles.resistVal}>{resistanceLine}</span>
        </div>
      )}

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Custo Total</span>
        <span className={styles.totalVal}>{totalCost} PM</span>
      </div>

      {totalCost > level && (
        <div className={styles.warn}>Custo excede o nível do personagem ({level})</div>
      )}
    </Sheet>
  );
}

CastActionSheet.displayName = 'CastActionSheet';

export default CastActionSheet;
