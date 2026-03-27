import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLoadCharacter } from '../../api';
import Topbar from '../../components/layout/Topbar/Topbar';
import AccessDeniedPage from '../AccessDeniedPage/AccessDeniedPage';
import styles from './NarutoSheetPage.module.css';

export default function NarutoSheetPage() {
  const navigate = useNavigate();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (!idParam) {
      navigate('/characters', { replace: true });
      return;
    }
    apiLoadCharacter(idParam)
      .then((data) => { if (!data) setAccessDenied(true); })
      .catch(() => setAccessDenied(true));
  }, [navigate]);

  useEffect(() => {
    document.title = 'Naruto: Shinobi no Sho — ArcanaForge';
  }, []);

  if (accessDenied) return <AccessDeniedPage />;

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
