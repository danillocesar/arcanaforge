import { useEffect, useMemo, useRef, useState } from 'react';
import { useCharacterContext } from '../../../../contexts/CharacterContext';
import { apiFetchNarutoClans, apiUploadAvatar } from '../../../../api';
import { getInitials } from '../../../../utils/formatters';
import { syncNarutoHpMp } from '../../utils/narutoCalculations';
import Section from '../../../../components/ui/Section/Section';
import NumericInput from '../../../../components/ui/NumericInput/NumericInput';
import styles from './NarutoBasicInfo.module.css';

const SHINOBI_RANKS = [
  'Genin', 'Chuunin', 'Jounin Especial', 'Jounin', 'Jounin Elite', 'Sannin/Kage',
];

const SIZES = [
  'Minúsculo', 'Diminuto', 'Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso', 'Colossal', 'Incrível',
];

export default function NarutoBasicInfo() {
  const { character, updateCharacter } = useCharacterContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [clans, setClans] = useState<Array<{ id: string; name: string; icon: string }>>([]);

  if (!character) return null;

  useEffect(() => {
    let alive = true;
    apiFetchNarutoClans()
      .then((items) => {
        if (!alive) return;
        setClans(items.map((c) => ({ id: c.id, name: c.name, icon: c.icon })));
      })
      .catch(() => {
        if (!alive) return;
        setClans([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await apiUploadAvatar(character._id, file);
    updateCharacter((f) => ({ ...f, avatar: url }));
  };

  const setField = (field: string, value: string | number) => {
    updateCharacter((f) => ({ ...f, [field]: value }));
  };

  const selectedClan = useMemo(
    () => clans.find((c) => c.name === (character.clan ?? '')),
    [clans, character.clan],
  );
  const isClanOutsideList = Boolean(character.clan) && !selectedClan;

  return (
    <Section id="secHeader" title="Dados do Personagem">
      <div className={styles.topRow}>
        <div className={styles.avatarCol}>
          <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
            {character.avatar ? (
              <img className={styles.avatarImg} src={character.avatar} alt="Avatar" />
            ) : (
              <span className={styles.avatarPlaceholder}>{getInitials(character.name)}</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
        </div>

        <div className={styles.nameCol}>
          <input
            className={styles.nameField}
            value={character.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Nome do Personagem"
          />
          <div className={styles.rankRow}>
            <span className={styles.rankLabel}>NC</span>
            <NumericInput
              className={styles.ncInput}
              min={4}
              max={20}
              fallback={4}
              value={character.campaignLevel ?? 4}
              onChange={(n) => updateCharacter((f) => syncNarutoHpMp({ ...f, campaignLevel: n }))}
            />
            <select
              className={styles.rankSelect}
              value={character.shinobiRank ?? 'Genin'}
              onChange={(e) => setField('shinobiRank', e.target.value)}
            >
              {SHINOBI_RANKS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className={styles.clanSelectRow}>
              <select
                className={styles.clanInput}
                value={character.clan ?? ''}
                onChange={(e) => setField('clan', e.target.value)}
              >
                <option value="">Clã</option>
                {isClanOutsideList && (
                  <option value={character.clan}>{character.clan} (não listado)</option>
                )}
                {clans.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {selectedClan && (
                <img
                  className={styles.clanIcon}
                  src={selectedClan.icon}
                  alt={`Ícone do clã ${selectedClan.name}`}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoField}>
          <label>Idade</label>
          <input value={character.age} onChange={(e) => setField('age', e.target.value)} />
        </div>
        <div className={styles.infoField}>
          <label>Gênero</label>
          <input value={character.gender ?? ''} onChange={(e) => setField('gender', e.target.value)} />
        </div>
        <div className={styles.infoField}>
          <label>Tendência</label>
          <input value={character.tendency ?? ''} onChange={(e) => setField('tendency', e.target.value)} />
        </div>
        <div className={styles.infoField}>
          <label>Vila de Origem</label>
          <input value={character.villageOrigin ?? ''} onChange={(e) => setField('villageOrigin', e.target.value)} />
        </div>
        <div className={styles.infoField}>
          <label>Vila Ativa</label>
          <input value={character.villageActive ?? ''} onChange={(e) => setField('villageActive', e.target.value)} />
        </div>
        <div className={styles.infoField}>
          <label>Tamanho</label>
          <select value={character.size} onChange={(e) => setField('size', e.target.value)}>
            {SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </Section>
  );
}
