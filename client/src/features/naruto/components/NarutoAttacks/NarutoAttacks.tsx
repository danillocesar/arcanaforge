import { useState } from 'react';
import { Sword } from 'lucide-react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import type { NarutoWeaponAttack } from '../../../../types/narutoCharacter';
import Section from '../../../../components/ui/Section/Section';
import ConfirmModal from '../../../../components/ui/ConfirmModal/ConfirmModal';
import AttackWeaponModal from '../AttackWeaponModal/AttackWeaponModal';
import styles from './NarutoAttacks.module.css';

export default function NarutoAttacks() {
  const { character, updateCharacter } = useCharacterContext();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const [attackModalIdx, setAttackModalIdx] = useState<number | null>(null);

  if (!character) return null;

  const attacks = character.weaponAttacks ?? [];
  const weapons = character.weapons ?? [];

  const updateAttack = (idx: number, field: keyof NarutoWeaponAttack, value: string | number) => {
    updateCharacter((f) => ({
      ...f,
      weaponAttacks: (f.weaponAttacks ?? []).map((a, i) =>
        i === idx ? { ...a, [field]: value } : a,
      ),
    }));
  };

  const addAttack = () => {
    updateCharacter((f) => ({
      ...f,
      weaponAttacks: [
        ...(f.weaponAttacks ?? []),
        { id: crypto.randomUUID(), name: '', weaponId: '', hitMod: 0, damageMod: 0 },
      ],
    }));
  };

  const removeAttack = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      weaponAttacks: (f.weaponAttacks ?? []).filter((_, i) => i !== idx),
    }));
  };

  const getWeaponIdx = (weaponId: string): number => {
    return weapons.findIndex((w) => w.id === weaponId);
  };

  return (
    <Section id="secAttacks" title="Ataques">
      <div className={styles.list}>
        {attacks.map((atk, i) => {
          const isExpanded = expandedIdx === i;
          const linkedWeapon = weapons.find((w) => w.id === atk.weaponId);

          return (
            <div key={atk.id} className={styles.card}>
              <div
                className={styles.cardHeader}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
              >
                <div className={styles.nameGroup}>
                  <span className={styles.atkName}>{atk.name || '(Sem nome)'}</span>
                  {linkedWeapon && (
                    <span className={styles.atkWeapon}>{linkedWeapon.name}</span>
                  )}
                  {atk.hitMod !== 0 && (
                    <span className={`${styles.modBadge} ${styles.modHit}`}>
                      Acerto {atk.hitMod > 0 ? '+' : ''}{atk.hitMod}
                    </span>
                  )}
                  {atk.damageMod !== 0 && (
                    <span className={`${styles.modBadge} ${styles.modDmg}`}>
                      Dano {atk.damageMod > 0 ? '+' : ''}{atk.damageMod}
                    </span>
                  )}
                </div>
                {linkedWeapon && (
                  <button
                    type="button"
                    className={styles.attackBtn}
                    onClick={(e) => { e.stopPropagation(); setAttackModalIdx(i); }}
                    title="Atacar"
                  >
                    <Sword size={14} aria-hidden="true" />
                  </button>
                )}
                <span className={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {isExpanded && (
                <div className={styles.cardBody}>
                  <div className={styles.field}>
                    <label>Nome do Ataque</label>
                    <input
                      value={atk.name}
                      onChange={(e) => updateAttack(i, 'name', e.target.value)}
                      placeholder="Ex: Ataque Poderoso"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Arma</label>
                    <select
                      value={atk.weaponId}
                      onChange={(e) => updateAttack(i, 'weaponId', e.target.value)}
                    >
                      <option value="">— Selecione —</option>
                      {weapons.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name || '(Sem nome)'}{w.damage ? ` (+${w.damage})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.modsRow}>
                    <div className={styles.modField}>
                      <label>Mod. Acerto</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={atk.hitMod}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || raw === '-') { updateAttack(i, 'hitMod', raw as any); return; }
                          const n = parseInt(raw, 10);
                          if (!isNaN(n)) updateAttack(i, 'hitMod', n);
                        }}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value, 10);
                          updateAttack(i, 'hitMod', isNaN(n) ? 0 : n);
                        }}
                      />
                    </div>
                    <div className={styles.modField}>
                      <label>Mod. Dano</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={atk.damageMod}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || raw === '-') { updateAttack(i, 'damageMod', raw as any); return; }
                          const n = parseInt(raw, 10);
                          if (!isNaN(n)) updateAttack(i, 'damageMod', n);
                        }}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value, 10);
                          updateAttack(i, 'damageMod', isNaN(n) ? 0 : n);
                        }}
                      />
                    </div>
                  </div>

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

      <button type="button" className={styles.addBtn} onClick={addAttack}>
        + Adicionar Ataque
      </button>

      <ConfirmModal
        open={confirmIdx !== null}
        onClose={() => setConfirmIdx(null)}
        onConfirm={() => {
          if (confirmIdx !== null) removeAttack(confirmIdx);
        }}
        title="Remover Ataque"
        message="Tem certeza que deseja remover este ataque?"
        variant="danger"
        confirmLabel="Remover"
      />

      {attackModalIdx !== null && (() => {
        const atk = attacks[attackModalIdx];
        const weaponIdx = getWeaponIdx(atk.weaponId);
        return (
          <AttackWeaponModal
            weaponIdx={weaponIdx >= 0 ? weaponIdx : null}
            hitMod={atk.hitMod}
            damageMod={atk.damageMod}
            attackName={atk.name || undefined}
            onClose={() => setAttackModalIdx(null)}
          />
        );
      })()}
    </Section>
  );
}
