import { useRef } from 'react';
import { useCharacterContext } from '../../../contexts/CharacterContext';
import { apiUploadAvatar } from '../../../api';
import { getTotalLevel } from '../../../utils/calculations';
import { getInitials } from '../../../utils/formatters';
import { TORMENTA_CLASSES, getClassIconUrl } from '../../../features/tormenta/data/tormentaClasses';
import Section from '../../ui/Section/Section';
import Input from '../../ui/Input/Input';
import styles from './BasicInfo.module.css';

export default function InfoBasica() {
  const { character, updateCharacter } = useCharacterContext();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!character) return null;

  const nivel = getTotalLevel(character);

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

  const updateClasse = (idx: number, key: 'name' | 'level', value: string | number) => {
    updateCharacter((f) => {
      const classes = [...f.classes];
      classes[idx] = { ...classes[idx], [key]: value };
      return { ...f, classes };
    });
  };

  const addClasse = () => {
    updateCharacter((f) => ({ ...f, classes: [...f.classes, { name: '', level: 1 }] }));
  };

  const removeClasse = (idx: number) => {
    updateCharacter((f) => {
      const classes = f.classes.filter((_, i) => i !== idx);
      return { ...f, classes: classes.length ? classes : [{ name: '', level: 1 }] };
    });
  };

  const primeiraClasse = character.classes[0]?.name || '';
  const classeIconSrc = getClassIconUrl(primeiraClasse);

  return (
    <Section id="secCabecalho" title="Info Básica">
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

        <div className={styles.nomeCol}>
          <input
            className={styles.campoNome}
            value={character.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Nome do Personagem"
          />
        </div>

        <div className={styles.classesCol}>
          <div className={styles.classesHeader}>
            <span className={styles.classesTitle}>Classes</span>
            <span className={styles.nivelTotal}>
              Nível <strong>{nivel}</strong>
            </span>
          </div>
          <div className={styles.classesBody}>
            {classeIconSrc && (
              <img
                className={styles.classeIcone}
                src={classeIconSrc}
                alt=""
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className={styles.classesLista}>
              {character.classes.map((c, i) => (
                <div key={i} className={styles.classeItem}>
                  <select
                    className={styles.classeNomeInput}
                    value={c.name}
                    onChange={(e) => updateClasse(i, 'name', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {TORMENTA_CLASSES.map((cl) => (
                      <option key={cl.id} value={cl.name}>{cl.name}</option>
                    ))}
                  </select>
                  <span className={styles.classeLvlLabel}>Nv</span>
                  <Input
                    variant="secondary"
                    className={styles.classeNivelInput}
                    type="number"
                    min={1}
                    value={c.level}
                    onChange={(e) => updateClasse(i, 'level', Number(e.target.value) || 1)}
                  />
                  {character.classes.length > 1 && (
                    <button type="button" className={styles.classeRemove} onClick={() => removeClasse(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className={styles.addClasse} onClick={addClasse}>+ Classe</button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.campoInfo}>
          <label>Raça</label>
          <input value={character.race} onChange={(e) => setField('race', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Origem</label>
          <input value={character.origin} onChange={(e) => setField('origin', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Divindade</label>
          <input value={character.deity} onChange={(e) => setField('deity', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Alinhamento</label>
          <input value={character.alignment} onChange={(e) => setField('alignment', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Idade</label>
          <input value={character.age} onChange={(e) => setField('age', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Tamanho</label>
          <select value={character.size} onChange={(e) => setField('size', e.target.value)}>
            <option value="Minúsculo">Minúsculo</option>
            <option value="Pequeno">Pequeno</option>
            <option value="Médio">Médio</option>
            <option value="Grande">Grande</option>
            <option value="Enorme">Enorme</option>
            <option value="Colossal">Colossal</option>
          </select>
        </div>
        <div className={styles.campoInfo}>
          <label>Desloc.</label>
          <input value={character.speed} onChange={(e) => setField('speed', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>XP</label>
          <input
            type="number"
            value={character.experience}
            onChange={(e) => setField('experience', Number(e.target.value) || 0)}
          />
        </div>
      </div>
    </Section>
  );
}
