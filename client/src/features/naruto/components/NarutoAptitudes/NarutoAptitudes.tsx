import { useState } from 'react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import type { NarutoAptitude } from '../../../../types/narutoCharacter';
import Section from '../../../../components/ui/Section/Section';
import ConfirmModal from '../../../../components/ui/ConfirmModal/ConfirmModal';
import NumericInput from '../../../../components/ui/NumericInput/NumericInput';
import styles from './NarutoAptitudes.module.css';

export default function NarutoAptitudes() {
  const { character, updateCharacter } = useCharacterContext();
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);

  if (!character) return null;

  const aptitudes = character.aptitudes ?? [];

  const updateAptitude = (idx: number, field: keyof NarutoAptitude, value: string | number | boolean) => {
    updateCharacter((f) => ({
      ...f,
      aptitudes: f.aptitudes!.map((a, i) => (i === idx ? { ...a, [field]: value } : a)),
    }));
  };

  const addAptitude = () => {
    updateCharacter((f) => ({
      ...f,
      aptitudes: [
        ...(f.aptitudes ?? []),
        { id: crypto.randomUUID(), name: '', description: '', cost: 1, free: false },
      ],
    }));
  };

  const removeAptitude = (idx: number) => {
    updateCharacter((f) => ({
      ...f,
      aptitudes: f.aptitudes!.filter((_, i) => i !== idx),
    }));
  };

  return (
    <Section id="secAptitudes" title="Aptidões">
      <div className={styles.list}>
        {aptitudes.map((apt, i) => (
          <div key={apt.id} className={styles.row}>
            <div className={styles.fields}>
              <input
                className={styles.nameInput}
                value={apt.name}
                onChange={(e) => updateAptitude(i, 'name', e.target.value)}
                placeholder="Nome da aptidao"
              />
              <input
                className={styles.descInput}
                value={apt.description}
                onChange={(e) => updateAptitude(i, 'description', e.target.value)}
                placeholder="Descricao"
              />
              {apt.free ? (
                <span className={styles.freeTag}>Gratuita</span>
              ) : (
                <NumericInput
                  className={styles.costInput}
                  min={0}
                  value={apt.cost}
                  onChange={(n) => updateAptitude(i, 'cost', n)}
                  title="Custo"
                />
              )}
            </div>
            {!apt.free && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => setConfirmIdx(i)}
              >
                X
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" className={styles.addBtn} onClick={addAptitude}>
        + Adicionar Aptidão
      </button>

      <ConfirmModal
        open={confirmIdx !== null}
        onClose={() => setConfirmIdx(null)}
        onConfirm={() => {
          if (confirmIdx !== null) removeAptitude(confirmIdx);
        }}
        title="Remover Aptidão"
        message="Tem certeza que deseja remover esta aptidão?"
        variant="danger"
        confirmLabel="Remover"
      />
    </Section>
  );
}
