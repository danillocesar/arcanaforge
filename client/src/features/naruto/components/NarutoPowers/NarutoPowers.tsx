import { useState, useEffect } from 'react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { getPowerPointsRemaining, getPowerLimit } from '../../utils/narutoCalculations';
import { getEvolutionRow } from '../../data/narutoConstants';
import { apiFetchNarutoTechTemplates } from '../../../../api';
import type { NarutoTechTemplateOption } from '../../../../api';
import type { NarutoPower, NarutoTechnique } from '../../../../types/narutoCharacter';
import Section from '../../../../components/ui/Section/Section';
import ConfirmModal from '../../../../components/ui/ConfirmModal/ConfirmModal';
import NumericInput from '../../../../components/ui/NumericInput/NumericInput';
import styles from './NarutoPowers.module.css';

export default function NarutoPowers() {
  const { character, updateCharacter } = useCharacterContext();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [expandedTechIdx, setExpandedTechIdx] = useState<string | null>(null);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const [techTemplates, setTechTemplates] = useState<NarutoTechTemplateOption[]>([]);

  useEffect(() => {
    apiFetchNarutoTechTemplates().then(setTechTemplates).catch(() => {});
  }, []);

  if (!character) return null;

  const nc = character.campaignLevel ?? 4;
  const row = getEvolutionRow(nc);
  const remaining = getPowerPointsRemaining(character);
  const limit = getPowerLimit(character);
  const powers = character.powers ?? [];

  const updatePower = (idx: number, field: keyof NarutoPower, value: string | number) => {
    updateCharacter((f) => ({
      ...f,
      powers: f.powers!.map((p, i) => {
        if (i !== idx) return p;
        const updated = { ...p, [field]: value };
        if (field === 'level') updated.cost = Number(value) || 0;
        return updated;
      }),
    }));
  };

  const addPower = () => {
    updateCharacter((f) => ({
      ...f,
      powers: [
        ...(f.powers ?? []),
        { id: crypto.randomUUID(), name: '', level: 1, effects: '', cost: 1, powerType: 'habilidade' as const, techniques: [] },
      ],
    }));
  };

  const removePower = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      powers: f.powers!.filter((_, i) => i !== idx),
    }));
  };

  const addTechnique = (powerIdx: number) => {
    updateCharacter((f) => ({
      ...f,
      powers: f.powers!.map((p, i) => {
        if (i !== powerIdx) return p;
        const tech: NarutoTechnique = {
          id: crypto.randomUUID(),
          name: '',
          unlockLevel: 1,
          dealsDamage: true,
          hitAttr: '',
          type: '',
          action: '',
          target: '',
          range: '',
          duration: '',
          description: '',
          damageFormula: 'standard',
        };
        return { ...p, techniques: [...(p.techniques ?? []), tech] };
      }),
    }));
  };

  const updateTechnique = (
    powerIdx: number,
    techIdx: number,
    field: keyof NarutoTechnique,
    value: string | number | boolean,
  ) => {
    updateCharacter((f) => ({
      ...f,
      powers: f.powers!.map((p, pi) => {
        if (pi !== powerIdx) return p;
        const techs = (p.techniques ?? []).map((t, ti) =>
          ti === techIdx ? { ...t, [field]: value } : t,
        );
        return { ...p, techniques: techs };
      }),
    }));
  };

  const removeTechnique = (powerIdx: number, techIdx: number) => {
    updateCharacter((f) => ({
      ...f,
      powers: f.powers!.map((p, pi) => {
        if (pi !== powerIdx) return p;
        return { ...p, techniques: (p.techniques ?? []).filter((_, ti) => ti !== techIdx) };
      }),
    }));
  };

  const applyTemplate = (powerIdx: number, techIdx: number, templateId: string) => {
    const tpl = techTemplates.find((t) => t.id === templateId);
    if (!tpl) return;
    updateCharacter((f) => ({
      ...f,
      powers: f.powers!.map((p, pi) => {
        if (pi !== powerIdx) return p;
        const techs = (p.techniques ?? []).map((t, ti) =>
          ti === techIdx
            ? {
                ...t,
                name: tpl.name,
                type: tpl.category,
                action: tpl.action,
                range: tpl.range,
                duration: tpl.duration,
                target: tpl.target,
                description: tpl.description,
                dealsDamage: tpl.dealsDamage,
                unlockLevel: tpl.unlockLevel,
              }
            : t,
        );
        return { ...p, techniques: techs };
      }),
    }));
  };

  return (
    <Section id="secPowers" title="Poderes">
      <div className={styles.header}>
        <span className={styles.pointsLabel}>
          Pontos de Poder: <strong>{row.poderes}</strong> totais
        </span>
        <span className={`${styles.remaining} ${remaining < 0 ? styles.over : ''}`}>
          {remaining} restante{remaining !== 1 ? 's' : ''}
        </span>
        <span className={styles.limitLabel}>
          Limite: <strong>{limit}</strong>
        </span>
      </div>

      <div className={styles.list}>
        {powers.map((p, i) => {
          const isExpanded = expandedIdx === i;
          const pType = p.powerType ?? 'habilidade';
          const techniques = p.techniques ?? [];

          return (
            <div key={p.id} className={styles.card}>
              <div
                className={styles.cardHeader}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
              >
                <span className={styles.powerName}>{p.name || '(Sem nome)'}</span>
                <span className={`${styles.typeBadge} ${pType === 'jutsu' ? styles.typeBadgeJutsu : ''}`}>
                  {pType === 'jutsu' ? 'Jutsu' : 'Hab.'}
                </span>
                <span className={styles.powerLevel}>Nv {p.level}</span>
                <span className={styles.powerCost}>Custo: {p.cost}</span>
                <span className={styles.chevron}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
              </div>
              {isExpanded && (
                <div className={styles.cardBody}>
                  <div className={styles.fieldRow}>
                    <label>Tipo</label>
                    <select
                      value={pType}
                      onChange={(e) => updatePower(i, 'powerType', e.target.value)}
                    >
                      <option value="habilidade">Habilidade</option>
                      <option value="jutsu">Jutsu</option>
                    </select>
                  </div>
                  <div className={styles.fieldRow}>
                    <label>Nome</label>
                    <input
                      value={p.name}
                      onChange={(e) => updatePower(i, 'name', e.target.value)}
                      placeholder="Nome do poder"
                    />
                  </div>
                  <div className={styles.fieldRow}>
                    <label>Nivel</label>
                    <NumericInput
                      min={0}
                      max={limit}
                      value={p.level}
                      onChange={(n) => updatePower(i, 'level', n)}
                    />
                  </div>
                  <div className={styles.fieldRow}>
                    <label>Descrição</label>
                    <textarea
                      value={p.effects}
                      onChange={(e) => updatePower(i, 'effects', e.target.value)}
                      rows={3}
                      placeholder="Descreva os efeitos..."
                    />
                  </div>

                  {pType === 'jutsu' && (
                    <div className={styles.techniques}>
                      <div className={styles.techHeader}>
                        <span className={styles.techTitle}>Técnicas</span>
                      </div>

                      {techniques.map((t, ti) => {
                        const techKey = `${i}-${ti}`;
                        const isTechExpanded = expandedTechIdx === techKey;
                        const unlock = (t as any).unlockLevel ?? (t as any).level ?? 1;

                        return (
                          <div key={t.id} className={styles.techCard}>
                            <div
                              className={styles.techCardHeader}
                              onClick={() => setExpandedTechIdx(isTechExpanded ? null : techKey)}
                            >
                              <span className={styles.techName}>{t.name || '(Sem nome)'}</span>
                              <span className={styles.techUnlock}>Nv {unlock}+</span>
                              <span className={styles.techChevron}>{isTechExpanded ? '\u25B2' : '\u25BC'}</span>
                            </div>
                            {isTechExpanded && (
                              <div className={styles.techBody}>
                                {techTemplates.length > 0 && (
                                  <div className={styles.templateRow}>
                                    <label>Efeito Base</label>
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) applyTemplate(i, ti, e.target.value);
                                      }}
                                    >
                                      <option value="">Selecionar template...</option>
                                      {techTemplates.map((tpl) => (
                                        <option key={tpl.id} value={tpl.id}>
                                          {tpl.name} (Nv {tpl.unlockLevel}) — {tpl.sourceDetail}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                                <div className={styles.techGrid}>
                                  <div className={`${styles.techField} ${styles.techFullWidth} ${styles.techNameRow}`}>
                                    <label>Nome</label>
                                    <div className={styles.nameWithCheck}>
                                      <input
                                        value={t.name}
                                        onChange={(e) => updateTechnique(i, ti, 'name', e.target.value)}
                                        placeholder="Nome da técnica"
                                      />
                                      <label className={styles.dmgCheck}>
                                        <input
                                          type="checkbox"
                                          checked={t.dealsDamage ?? true}
                                          onChange={(e) => updateTechnique(i, ti, 'dealsDamage', e.target.checked)}
                                        />
                                        Causa Dano
                                      </label>
                                    </div>
                                  </div>
                                  {(t.dealsDamage ?? true) && (
                                    <>
                                      <div className={styles.techField}>
                                        <label>Fórmula de Dano</label>
                                        <select
                                          value={t.damageFormula ?? 'standard'}
                                          onChange={(e) => updateTechnique(i, ti, 'damageFormula', e.target.value)}
                                        >
                                          <option value="standard">Padrão (ATR/2 + NV)</option>
                                          <option value="fixedBonus">ATR/2 + Valor Fixo</option>
                                          <option value="perLevel">Valor por Nível</option>
                                        </select>
                                      </div>
                                      {(t.damageFormula ?? 'standard') === 'standard' && (
                                        <>
                                          <div className={styles.techField}>
                                            <label>Atributo de Dano</label>
                                            <select
                                              value={t.damageAttr ?? 'esp'}
                                              onChange={(e) => updateTechnique(i, ti, 'damageAttr', e.target.value)}
                                            >
                                              <option value="esp">ESP (padrão)</option>
                                              <option value="des">DES</option>
                                              <option value="for">FOR</option>
                                            </select>
                                          </div>
                                          <div className={styles.techField}>
                                            <label>Arma escala com NV — ajuste (ex: -2)</label>
                                            <input
                                              type="text"
                                              inputMode="numeric"
                                              placeholder="Vazio = desabilitado"
                                              value={t.weaponDamageOffset ?? ''}
                                              onChange={(e) => {
                                                const raw = e.target.value;
                                                if (raw === '' || raw === '-') {
                                                  updateTechnique(i, ti, 'weaponDamageOffset', (raw === '' ? undefined : raw) as any);
                                                  return;
                                                }
                                                const n = parseInt(raw, 10);
                                                if (!isNaN(n)) updateTechnique(i, ti, 'weaponDamageOffset', n);
                                              }}
                                              onBlur={(e) => {
                                                const raw = e.target.value;
                                                if (raw === '' || raw === '-') {
                                                  updateTechnique(i, ti, 'weaponDamageOffset', undefined as any);
                                                }
                                              }}
                                            />
                                          </div>
                                        </>
                                      )}
                                      {t.damageFormula === 'fixedBonus' && (
                                        <>
                                          <div className={styles.techField}>
                                            <label>Atributo de Dano</label>
                                            <select
                                              value={t.damageAttr ?? 'esp'}
                                              onChange={(e) => updateTechnique(i, ti, 'damageAttr', e.target.value)}
                                            >
                                              <option value="esp">ESP (padrão)</option>
                                              <option value="des">DES</option>
                                              <option value="for">FOR</option>
                                            </select>
                                          </div>
                                          <div className={styles.techField}>
                                            <label>Valor Fixo de Dano</label>
                                            <NumericInput
                                              min={0}
                                              value={t.damageFixedBonus ?? 0}
                                              onChange={(n) => updateTechnique(i, ti, 'damageFixedBonus', n)}
                                            />
                                          </div>
                                        </>
                                      )}
                                      {(t.damageFormula ?? 'standard') === 'perLevel' && (
                                        <div className={styles.techField}>
                                          <label>Valor por Nível</label>
                                          <NumericInput
                                            min={0}
                                            value={t.damagePerLevel ?? 0}
                                            onChange={(n) => updateTechnique(i, ti, 'damagePerLevel', n)}
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div className={styles.techField}>
                                    <label className={styles.dmgCheck}>
                                      <input
                                        type="checkbox"
                                        checked={t.singleCast ?? false}
                                        onChange={(e) => updateTechnique(i, ti, 'singleCast', e.target.checked)}
                                      />
                                      Cast único (sem seleção de nível)
                                    </label>
                                  </div>
                                  <div className={styles.techField}>
                                    <label>Custo de Chakra</label>
                                    <select
                                      value={t.chakraFormula ?? 'level'}
                                      onChange={(e) => updateTechnique(i, ti, 'chakraFormula', e.target.value)}
                                    >
                                      <option value="level">Por nível usado (padrão)</option>
                                      <option value="fixed">Valor fixo</option>
                                    </select>
                                  </div>
                                  {(t.chakraFormula ?? 'level') === 'fixed' && (
                                    <div className={styles.techField}>
                                      <label>Chakra fixo</label>
                                      <NumericInput
                                        min={0}
                                        value={t.chakraFixedCost ?? 0}
                                        onChange={(n) => updateTechnique(i, ti, 'chakraFixedCost', n)}
                                      />
                                    </div>
                                  )}
                                  <div className={styles.techField}>
                                    <label>Nivel de Desbloqueio</label>
                                    <NumericInput
                                      min={1}
                                      max={p.level || 1}
                                      fallback={1}
                                      value={unlock}
                                      onChange={(n) => updateTechnique(i, ti, 'unlockLevel', n)}
                                    />
                                  </div>
                                  <div className={styles.techField}>
                                    <label>Tipo</label>
                                    <input
                                      value={t.type}
                                      onChange={(e) => updateTechnique(i, ti, 'type', e.target.value)}
                                      placeholder="Ninjutsu, Genjutsu..."
                                    />
                                  </div>
                                  <div className={styles.techField}>
                                    <label>Acao</label>
                                    <input
                                      value={t.action}
                                      onChange={(e) => updateTechnique(i, ti, 'action', e.target.value)}
                                      placeholder="Padrao, Completa..."
                                    />
                                  </div>
                                  <div className={styles.techField}>
                                    <label>Acerto</label>
                                    <select
                                      value={t.hitAttr ?? ''}
                                      onChange={(e) => updateTechnique(i, ti, 'hitAttr', e.target.value)}
                                    >
                                      <option value="">--</option>
                                      <option value="cc">CC</option>
                                      <option value="cd">CD</option>
                                    </select>
                                  </div>
                                  <div className={styles.techField}>
                                    <label>Alvo</label>
                                    <input
                                      value={t.target ?? ''}
                                      onChange={(e) => updateTechnique(i, ti, 'target', e.target.value)}
                                      placeholder="1 criatura, area..."
                                    />
                                  </div>
                                  <div className={styles.techField}>
                                    <label>Alcance</label>
                                    <input
                                      value={t.range}
                                      onChange={(e) => updateTechnique(i, ti, 'range', e.target.value)}
                                      placeholder="Pessoal, 10m..."
                                    />
                                  </div>
                                  <div className={styles.techField}>
                                    <label>Duracao</label>
                                    <input
                                      value={t.duration}
                                      onChange={(e) => updateTechnique(i, ti, 'duration', e.target.value)}
                                      placeholder="Instantanea, 1 rodada..."
                                    />
                                  </div>
                                  <div className={`${styles.techField} ${styles.techFullWidth}`}>
                                    <label>Descricao</label>
                                    <textarea
                                      value={t.description}
                                      onChange={(e) => updateTechnique(i, ti, 'description', e.target.value)}
                                      rows={2}
                                      placeholder="Descreva a técnica..."
                                    />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className={styles.removeTech}
                                  onClick={() => removeTechnique(i, ti)}
                                >
                                  Remover Técnica
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        className={styles.addTech}
                        onClick={() => addTechnique(i)}
                      >
                        + Adicionar Técnica
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setConfirmIdx(i)}
                  >
                    Remover Poder
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className={styles.addBtn} onClick={addPower}>
        + Adicionar Poder
      </button>

      <ConfirmModal
        open={confirmIdx !== null}
        onClose={() => setConfirmIdx(null)}
        onConfirm={() => {
          if (confirmIdx !== null) removePower(confirmIdx);
        }}
        title="Remover Poder"
        message="Tem certeza que deseja remover este poder?"
        variant="danger"
        confirmLabel="Remover"
      />

    </Section>
  );
}
