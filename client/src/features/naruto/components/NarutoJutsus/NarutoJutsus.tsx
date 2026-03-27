import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import type { Jutsu } from '../../../../types/narutoCharacter';
import Section from '../../../../components/ui/Section/Section';
import ConfirmModal from '../../../../components/ui/ConfirmModal/ConfirmModal';
import CastJutsuModal from '../CastJutsuModal/CastJutsuModal';
import styles from './NarutoJutsus.module.css';

export default function NarutoJutsus() {
  const { character, updateCharacter } = useCharacterContext();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const [castIdx, setCastIdx] = useState<number | null>(null);

  if (!character) return null;

  const jutsus = character.jutsus ?? [];
  const powers = character.powers ?? [];
  const jutsuPowers = powers.filter((p) => p.powerType === 'jutsu');

  const updateJutsu = (idx: number, field: keyof Jutsu, value: string | number) => {
    updateCharacter((f) => ({
      ...f,
      jutsus: f.jutsus!.map((j, i) => {
        if (i !== idx) return j;
        const updated = { ...j, [field]: value };
        if (field === 'powerId') updated.techniqueId = '';
        return updated;
      }),
    }));
  };

  const addJutsu = () => {
    updateCharacter((f) => ({
      ...f,
      jutsus: [
        ...(f.jutsus ?? []),
        { id: crypto.randomUUID(), name: '', powerId: '', techniqueId: '', damageMod: 0, hitMod: 0 },
      ],
    }));
  };

  const removeJutsu = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      jutsus: f.jutsus!.filter((_, i) => i !== idx),
    }));
  };

  return (
    <Section id="secJutsus" title="Jutsus">
      <div className={styles.list}>
        {jutsus.map((j, i) => {
          const isExpanded = expandedIdx === i;
          const linkedPower = jutsuPowers.find((p) => p.id === j.powerId);
          const linkedTech = linkedPower?.techniques?.find((t) => t.id === j.techniqueId);
          const availableTechs = (linkedPower?.techniques ?? []).filter(
            (t) => (t.unlockLevel ?? 1) <= (linkedPower?.level ?? 0),
          );

          return (
            <div key={j.id} className={styles.card}>
              <div
                className={styles.cardHeader}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
              >
                <span className={styles.nameGroup}>
                  {linkedPower && (
                    <span className={styles.jutsuPower}>{linkedPower.name}</span>
                  )}
                  <span className={styles.jutsuName}>{j.name || '(Sem nome)'}</span>
                  {linkedTech && (
                    <span className={styles.jutsuTech}>{linkedTech.name}</span>
                  )}
                </span>
                {linkedTech?.type && (
                  <span className={styles.jutsuType}>{linkedTech.type}</span>
                )}
                {linkedPower && linkedTech && (
                  <button
                    type="button"
                    className={styles.castBtn}
                    onClick={(e) => { e.stopPropagation(); setCastIdx(i); }}
                    title="Usar Jutsu"
                  >
                    <Sparkles size={14} aria-hidden="true" />
                  </button>
                )}
                <span className={styles.chevron}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
              </div>
              {isExpanded && (
                <div className={styles.cardBody}>
                  <div className={styles.field}>
                    <label>Nome do Jutsu</label>
                    <input
                      value={j.name}
                      onChange={(e) => updateJutsu(i, 'name', e.target.value)}
                      placeholder="Ex: Bola de Fogo"
                    />
                  </div>

                  <div className={styles.selectRow}>
                    <div className={styles.selectField}>
                      <label>Poder</label>
                      <select
                        value={j.powerId ?? ''}
                        onChange={(e) => updateJutsu(i, 'powerId', e.target.value)}
                      >
                        <option value="">— Selecione —</option>
                        {jutsuPowers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || '(Sem nome)'} (Nv {p.level})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.selectField}>
                      <label>Tecnica</label>
                      <select
                        value={j.techniqueId ?? ''}
                        onChange={(e) => updateJutsu(i, 'techniqueId', e.target.value)}
                        disabled={!linkedPower}
                      >
                        <option value="">— Selecione —</option>
                        {availableTechs.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name || '(Sem nome)'} (Nv {t.unlockLevel}+)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.selectRow}>
                    <div className={styles.selectField}>
                      <label>Mod. Dano</label>
                      <input
                        type="number"
                        value={j.damageMod ?? 0}
                        onChange={(e) => updateJutsu(i, 'damageMod', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className={styles.selectField}>
                      <label>Mod. Acerto</label>
                      <input
                        type="number"
                        value={j.hitMod ?? 0}
                        onChange={(e) => updateJutsu(i, 'hitMod', Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {linkedTech && (
                    <div className={styles.derivedInfo}>
                      <div className={styles.derivedTitle}>Informacoes da Tecnica</div>
                      <div className={styles.derivedGrid}>
                        {linkedTech.type && (
                          <div className={styles.derivedRow}>
                            <span className={styles.derivedLabel}>Tipo</span>
                            <span className={styles.derivedVal}>{linkedTech.type}</span>
                          </div>
                        )}
                        {linkedTech.action && (
                          <div className={styles.derivedRow}>
                            <span className={styles.derivedLabel}>Acao</span>
                            <span className={styles.derivedVal}>{linkedTech.action}</span>
                          </div>
                        )}
                        {linkedTech.target && (
                          <div className={styles.derivedRow}>
                            <span className={styles.derivedLabel}>Alvo</span>
                            <span className={styles.derivedVal}>{linkedTech.target}</span>
                          </div>
                        )}
                        {linkedTech.range && (
                          <div className={styles.derivedRow}>
                            <span className={styles.derivedLabel}>Alcance</span>
                            <span className={styles.derivedVal}>{linkedTech.range}</span>
                          </div>
                        )}
                        {linkedTech.duration && (
                          <div className={styles.derivedRow}>
                            <span className={styles.derivedLabel}>Duracao</span>
                            <span className={styles.derivedVal}>{linkedTech.duration}</span>
                          </div>
                        )}
                        {linkedTech.description && (
                          <div className={`${styles.derivedRow} ${styles.derivedFull}`}>
                            <span className={styles.derivedLabel}>Descricao</span>
                            <span className={styles.derivedVal}>{linkedTech.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => setConfirmIdx(i)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className={styles.addBtn} onClick={addJutsu}>
        + Adicionar Jutsu
      </button>

      <ConfirmModal
        open={confirmIdx !== null}
        onClose={() => setConfirmIdx(null)}
        onConfirm={() => {
          if (confirmIdx !== null) removeJutsu(confirmIdx);
        }}
        title="Remover Jutsu"
        message="Tem certeza que deseja remover este jutsu?"
        variant="danger"
        confirmLabel="Remover"
      />

      {castIdx !== null && (() => {
        const cj = jutsus[castIdx];
        return (
          <CastJutsuModal
            powerId={cj?.powerId ?? null}
            techniqueId={cj?.techniqueId ?? null}
            damageMod={cj?.damageMod ?? 0}
            hitMod={cj?.hitMod ?? 0}
            onClose={() => setCastIdx(null)}
          />
        );
      })()}
    </Section>
  );
}
