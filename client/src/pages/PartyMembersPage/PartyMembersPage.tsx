import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetchParties, apiFetchFichasResumo, apiUpdateParty } from '../../api';
import type { Party } from '../../types/combate';
import type { FichaResumo } from '../../types/ficha';
import { getInitials, getAvatarColor, formatClassesStr } from '../../utils/formatters';
import Topbar from '../../components/layout/Topbar/Topbar';
import Button from '../../components/ui/Button/Button';
import styles from './PartyMembersPage.module.css';

export default function PartyMembersPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const [party, setParty] = useState<Party | null>(null);
  const [resumos, setResumos] = useState<FichaResumo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!partyId) return;

    (async () => {
      try {
        const [parties, allResumos] = await Promise.all([
          apiFetchParties(),
          apiFetchFichasResumo(),
        ]);

        const found = parties.find((p) => p.id === partyId);
        if (!found) {
          navigate('/grupos', { replace: true });
          return;
        }

        setParty(found);
        setResumos(allResumos.filter((r) => r.sistema === found.sistema));
        setSelected(new Set(found.membros));
      } catch (err) {
        console.error('Erro ao carregar membros:', err);
      }
    })();
  }, [partyId, navigate]);

  const toggleMember = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!party) return;
    const membros = Array.from(selected);
    await apiUpdateParty(party.id, { ...party, membros });
    navigate(`/${party.sistema}/grupo/${party.id}`);
  };

  if (!party) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Topbar title={`Grupo - ${party.nome}`} />

      <div className={styles.content}>
        <h2 className={styles.pageTitle}>{party.nome} — Selecionar Membros</h2>
        <p className={styles.subtitle}>
          Selecione os personagens que participarão desta party. Apenas personagens do sistema selecionado são exibidos.
        </p>

        {resumos.length === 0 ? (
          <div className={styles.empty}>
            Nenhum personagem encontrado para este sistema. Crie personagens primeiro na tela de seleção.
          </div>
        ) : (
          <div className={styles.grid}>
            {resumos.map((r) => {
              const isSelected = selected.has(r._id);
              const classesStr = formatClassesStr(r.classes);

              return (
                <button
                  key={r._id}
                  type="button"
                  className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                  onClick={() => toggleMember(r._id)}
                >
                  <span className={styles.checkbox}>{isSelected ? '✓' : ''}</span>
                  <div
                    className={styles.avatar}
                    style={r.avatar ? undefined : { background: getAvatarColor(r.nome) }}
                  >
                    {r.avatar ? <img src={r.avatar} alt="" /> : getInitials(r.nome)}
                  </div>
                  <span className={styles.cardNome}>{r.nome}</span>
                  <span className={styles.cardClasse}>{classesStr}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => navigate('/grupos')}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={selected.size === 0}>
            Iniciar Combate ({selected.size})
          </Button>
        </div>
      </div>
    </div>
  );
}
