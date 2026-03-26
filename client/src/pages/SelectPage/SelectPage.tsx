import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetchFichasResumo, apiSaveFicha } from '../../api/api';
import { criarFichaVazia } from '../../utils/calculations';
import SelectGrid from '../../components/select/SelectGrid/SelectGrid';
import styles from './SelectPage.module.css';

interface Resumo {
  nome: string;
  avatar: string;
  classes: { nome: string; nivel: number }[];
}

export default function SelectPage() {
  const [resumos, setResumos] = useState<Resumo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetchFichasResumo().then(setResumos).catch(() => {});
  }, []);

  const handleNewCharacter = async (nome: string) => {
    const ficha = criarFichaVazia(nome);
    await apiSaveFicha(nome, ficha);
    navigate(`/?char=${encodeURIComponent(nome)}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>ArcanaForge</span>
          <span className={styles.title}>Selecionar Personagem</span>
        </div>
        <Link to="/" className={styles.back}>
          ← Voltar
        </Link>
      </header>
      <div className={styles.content}>
        <SelectGrid resumos={resumos} onNewCharacter={handleNewCharacter} />
      </div>
    </div>
  );
}
