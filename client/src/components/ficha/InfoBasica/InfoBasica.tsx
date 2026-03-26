import { useRef } from 'react';
import { useFichaContext } from '../../../contexts/FichaContext';
import { apiUploadAvatar } from '../../../api';
import { getNivelTotal } from '../../../utils/calculations';
import { getInitials } from '../../../utils/formatters';
import { CLASSES_TORMENTA, getClasseIconUrl } from '../../../features/tormenta/data/classesTormenta';
import Section from '../../ui/Section/Section';
import Input from '../../ui/Input/Input';
import styles from './InfoBasica.module.css';

export default function InfoBasica() {
  const { ficha, updateFicha } = useFichaContext();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!ficha) return null;

  const nivel = getNivelTotal(ficha);

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await apiUploadAvatar(ficha._id, file);
    updateFicha((f) => ({ ...f, avatar: url }));
  };

  const setField = (field: string, value: string | number) => {
    updateFicha((f) => ({ ...f, [field]: value }));
  };

  const updateClasse = (idx: number, key: 'nome' | 'nivel', value: string | number) => {
    updateFicha((f) => {
      const classes = [...f.classes];
      classes[idx] = { ...classes[idx], [key]: value };
      return { ...f, classes };
    });
  };

  const addClasse = () => {
    updateFicha((f) => ({ ...f, classes: [...f.classes, { nome: '', nivel: 1 }] }));
  };

  const removeClasse = (idx: number) => {
    updateFicha((f) => {
      const classes = f.classes.filter((_, i) => i !== idx);
      return { ...f, classes: classes.length ? classes : [{ nome: '', nivel: 1 }] };
    });
  };

  const primeiraClasse = ficha.classes[0]?.nome || '';
  const classeIconSrc = getClasseIconUrl(primeiraClasse);

  return (
    <Section id="secCabecalho" title="Info Básica">
      <div className={styles.topRow}>
        <div className={styles.avatarCol}>
          <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
            {ficha.avatar ? (
              <img className={styles.avatarImg} src={ficha.avatar} alt="Avatar" />
            ) : (
              <span className={styles.avatarPlaceholder}>{getInitials(ficha.nome)}</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
        </div>

        <div className={styles.nomeCol}>
          <input
            className={styles.campoNome}
            value={ficha.nome}
            onChange={(e) => setField('nome', e.target.value)}
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
              {ficha.classes.map((c, i) => (
                <div key={i} className={styles.classeItem}>
                  <select
                    className={styles.classeNomeInput}
                    value={c.nome}
                    onChange={(e) => updateClasse(i, 'nome', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {CLASSES_TORMENTA.map((cl) => (
                      <option key={cl.id} value={cl.nome}>{cl.nome}</option>
                    ))}
                  </select>
                  <span className={styles.classeLvlLabel}>Nv</span>
                  <Input
                    variant="secondary"
                    className={styles.classeNivelInput}
                    type="number"
                    min={1}
                    value={c.nivel}
                    onChange={(e) => updateClasse(i, 'nivel', Number(e.target.value) || 1)}
                  />
                  {ficha.classes.length > 1 && (
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
          <input value={ficha.raca} onChange={(e) => setField('raca', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Origem</label>
          <input value={ficha.origem} onChange={(e) => setField('origem', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Divindade</label>
          <input value={ficha.divindade} onChange={(e) => setField('divindade', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Alinhamento</label>
          <input value={ficha.alinhamento} onChange={(e) => setField('alinhamento', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Idade</label>
          <input value={ficha.idade} onChange={(e) => setField('idade', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>Tamanho</label>
          <select value={ficha.tamanho} onChange={(e) => setField('tamanho', e.target.value)}>
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
          <input value={ficha.deslocamento} onChange={(e) => setField('deslocamento', e.target.value)} />
        </div>
        <div className={styles.campoInfo}>
          <label>XP</label>
          <input
            type="number"
            value={ficha.experiencia}
            onChange={(e) => setField('experiencia', Number(e.target.value) || 0)}
          />
        </div>
      </div>
    </Section>
  );
}
