import { useEffect, useState } from 'react';
import { CalendarCheck, TriangleAlert } from 'lucide-react';
import { apiGetGoogleLink, apiStartGoogleOAuth, apiUnlinkGoogle } from '../../../api';
import type { GoogleLinkState } from '../../../api';
import styles from './GoogleCalendarLink.module.css';

export default function GoogleCalendarLink() {
  const [state, setState] = useState<GoogleLinkState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelado = false;
    apiGetGoogleLink()
      .then((s) => {
        if (!cancelado) setState(s);
      })
      // 503 = integração não configurada no server: a linha simplesmente não aparece.
      .catch(() => {
        if (!cancelado) setState(null);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (!state) return null;

  const conectar = async () => {
    setBusy(true);
    try {
      // Para o callback devolver o navegador nesta mesma aba do grupo.
      const { url } = await apiStartGoogleOAuth(window.location.pathname);
      window.location.href = url;
    } catch {
      setBusy(false);
    }
  };

  const desconectar = async () => {
    setBusy(true);
    try {
      await apiUnlinkGoogle();
      setState({ linked: false, email: '', lastError: null });
    } catch (err) {
      // Sem o catch a falha virava unhandled rejection e a linha continuava
      // dizendo "Conectada" — que é a verdade, mas sem nenhum sinal de que o
      // clique não fez nada. Mantém o estado como está e libera o botão.
      console.error('Erro ao desconectar a Google Agenda:', err);
    } finally {
      setBusy(false);
    }
  };

  // Mesma regra do server (`isHealthy`): saudável = lastError vazio.
  const quebrado = state.linked && Boolean(state.lastError);

  return (
    <div className={styles.box}>
      <span className={styles.label}>Google Agenda</span>

      {quebrado && (
        <p className={styles.warn}>
          <TriangleAlert size={13} />
          Conexão expirou — religue para voltar a receber as sessões.
        </p>
      )}

      {state.linked && !quebrado && (
        <p className={styles.ok}>
          <CalendarCheck size={13} />
          Conectada como {state.email || 'sua conta'}
        </p>
      )}

      {state.linked ? (
        <div className={styles.actions}>
          {quebrado && (
            <button type="button" className={styles.primary} onClick={conectar} disabled={busy}>
              Religar
            </button>
          )}
          <button type="button" className={styles.link} onClick={desconectar} disabled={busy}>
            Desconectar
          </button>
        </div>
      ) : (
        <button type="button" className={styles.primary} onClick={conectar} disabled={busy}>
          Conectar Google Agenda
        </button>
      )}
    </div>
  );
}
