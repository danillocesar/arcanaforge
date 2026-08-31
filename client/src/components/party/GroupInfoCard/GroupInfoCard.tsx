import { useEffect, useState } from 'react';
import { getInitials, getAvatarColor } from '../../../utils/formatters';
import type { Party } from '../../../types/party';
import { useToast } from '../../ui/Toast/Toast';
import GoogleCalendarLink from '../GoogleCalendarLink/GoogleCalendarLink';
import styles from './GroupInfoCard.module.css';

interface GroupInfoCardProps {
  party: Party;
  isOwner: boolean;
}

/**
 * Resumo fixo do grupo (identidade + código de convite) — usado como coluna
 * lateral em Membros/Calendário pra preencher o espaço vazio que essas telas
 * têm hoje, em vez de só o formulário/lista central flutuando sozinha.
 */
function GroupInfoCard({ party, isOwner }: GroupInfoCardProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  // Retorno do consentimento do Google: avisa e limpa a URL para o aviso não
  // reaparecer a cada re-render ou refresh.
  //
  // Mora aqui, e não na página, porque o `returnTo` do GoogleCalendarLink é o
  // pathname de onde a pessoa clicou — e este card aparece tanto na aba
  // Calendário quanto na de Membros. Com o leitor só na PartyCalendarPage,
  // conectar pela aba Membros voltava para `/…/members?google=ok`, onde nada
  // lia nem limpava o parâmetro: metade dos pontos de entrada do botão
  // Conectar não dava retorno nenhum. Junto do botão, qualquer página que
  // embutir o card ganha o retorno de graça.
  //
  // O showToast vem do contexto (e não do módulo `toastService`) porque o
  // contexto já está disponível durante o render — não depende da ordem em que
  // os effects de pai e filho rodam. O ToastProvider é montado uma vez só, na
  // raiz (main.tsx), então funciona em qualquer lugar.
  //
  // A falha usa a variante 'attack': é a única de cor cheia que não aparece em
  // notificação de rotina, então destoa do aviso comum. Não existe variante
  // 'error' no ToastVariant, e inventar uma está fora do escopo daqui.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('google');
    if (!status) return;
    showToast(
      status === 'ok'
        ? 'Google Agenda conectada.'
        : `Não foi possível conectar: ${params.get('reason') || 'erro'}`,
      status === 'ok' ? 'info' : 'attack',
    );
    window.history.replaceState({}, '', window.location.pathname);
  }, [showToast]);

  const copyCode = () => {
    if (!party.inviteCode) return;
    navigator.clipboard.writeText(party.inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className={styles.card}>
      <div className={styles.head}>
        <div className={styles.avatar} style={{ background: getAvatarColor(party.name) }}>
          {getInitials(party.name)}
        </div>
        <div className={styles.headText}>
          <div className={styles.name}>{party.name}</div>
          <div className={styles.sub}>
            Tormenta 20 · {party.members.length} membro{party.members.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {isOwner && party.inviteCode && (
        <button type="button" className={styles.code} onClick={copyCode}>
          <span className={styles.codeLabel}>Código de convite</span>
          <span className={styles.codeValue}>{copied ? 'Copiado!' : party.inviteCode}</span>
        </button>
      )}

      <GoogleCalendarLink />
    </aside>
  );
}

GroupInfoCard.displayName = 'GroupInfoCard';

export default GroupInfoCard;
