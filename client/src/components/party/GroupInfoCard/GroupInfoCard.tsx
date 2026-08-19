import { useState } from 'react';
import { getInitials, getAvatarColor } from '../../../utils/formatters';
import type { Party } from '../../../types/party';
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
    </aside>
  );
}

GroupInfoCard.displayName = 'GroupInfoCard';

export default GroupInfoCard;
