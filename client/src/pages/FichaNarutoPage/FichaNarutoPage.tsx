import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar/Topbar';
import styles from './FichaNarutoPage.module.css';

export default function FichaNarutoPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('id')) {
      navigate('/personagens', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    document.title = 'Naruto: Shinobi no Sho — ArcanaForge';
  }, []);

  return (
    <>
      <Topbar title="Naruto" />

      <div className={styles.container}>
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon}>🍥</span>
          <span className={styles.placeholderTitle}>Naruto: Shinobi no Sho</span>
          <span className={styles.placeholderText}>
            Ficha em construção. Em breve você poderá criar e gerenciar personagens deste sistema por aqui.
          </span>
        </div>
      </div>
    </>
  );
}
