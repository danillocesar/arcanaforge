import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetchParties, apiFetchCharacterSummaries, apiUpdateParty } from '../../api';
import type { Party } from '../../types/party';
import type { CharacterSummary } from '../../types/character';
import { getInitials, getAvatarColor, formatClassesStr } from '../../utils/formatters';
import Topbar from '../../components/layout/Topbar/Topbar';
import Button from '../../components/ui/Button/Button';
import styles from './PartyMembersPage.module.css';

export default function PartyMembersPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const [party, setParty] = useState<Party | null>(null);
  const [resumos, setResumos] = useState<CharacterSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!partyId) return;

    (async () => {
      try {
        const [parties, allResumos] = await Promise.all([
          apiFetchParties(),
          apiFetchCharacterSummaries(),
        ]);

        const found = parties.find((p) => p.id === partyId);
        if (!found) {
          navigate('/parties', { replace: true });
          return;
        }

        setParty(found);
        setResumos(allResumos.filter((r) => r.system === found.system));
        setSelected(new Set(found.members));
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
    const members = Array.from(selected);
    await apiUpdateParty(party.id, { ...party, members });
    navigate(`/${party.system}/party/${party.id}`);
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
      <Topbar title={`Grupo - ${party.name}`} />

      <div className={styles.content}>
        <h2 className={styles.pageTitle}>{party.name} — Selecionar Membros</h2>
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
                    style={r.avatar ? undefined : { background: getAvatarColor(r.name) }}
                  >
                    {r.avatar ? <img src={r.avatar} alt="" /> : getInitials(r.name)}
                  </div>
                  <span className={styles.cardName}>{r.name}</span>
                  <span className={styles.cardClass}>{classesStr}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => navigate('/parties')}>
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
