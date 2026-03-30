import { useState } from 'react';
import { usePlan } from '../../contexts/PlanContext';
import Topbar from '../../components/layout/Topbar/Topbar';
import {
  apiSubscribePro,
  apiBuySlot,
  apiCancelSubscription,
  apiGetBillingPortal,
} from '../../api/billing';
import styles from './BillingPage.module.css';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(dateStr));
}

function PlanBadge({ plan, isExpired }: { plan: string; isExpired: boolean }) {
  if (isExpired) return <span className={`${styles.badge} ${styles.badgeExpired}`}>Expirado</span>;
  if (plan === 'pro') return <span className={`${styles.badge} ${styles.badgePro}`}>Pro</span>;
  if (plan === 'trial') return <span className={`${styles.badge} ${styles.badgeTrial}`}>Trial</span>;
  return <span className={`${styles.badge} ${styles.badgeFree}`}>Free</span>;
}

export default function BillingPage() {
  const { status, loading, refresh } = usePlan();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: string, fn: () => Promise<{ url?: string; ok?: boolean }>) {
    setError(null);
    setBusy(action);
    try {
      const result = await fn();
      if (result.url) {
        window.location.href = result.url;
      } else {
        await refresh();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setBusy(null);
    }
  }

  const plan = status?.plan ?? 'free';
  const isPro = plan === 'pro';
  const isTrial = status?.isTrial ?? false;
  const isExpired = status?.isExpired ?? false;

  return (
    <div className={styles.page}>
      <Topbar title="Plano & Cobrança" />

      <div className={styles.content}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Status atual</h2>

          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : (
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Plano</span>
                <span className={styles.statusValue}>
                  <PlanBadge plan={plan} isExpired={isExpired} />
                </span>
              </div>

              {isTrial && (
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Trial encerra em</span>
                  <span className={styles.statusValue}>
                    {formatDate(status?.trialEndsAt ?? null)}
                    {(status?.trialDaysLeft ?? 0) > 0 && (
                      <span className={styles.daysLeft}> ({status!.trialDaysLeft} dia(s))</span>
                    )}
                  </span>
                </div>
              )}

              {isPro && (
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Próxima cobrança</span>
                  <span className={styles.statusValue}>{formatDate(status?.currentPeriodEnd ?? null)}</span>
                </div>
              )}

              {isPro && status?.subscriptionStatus && (
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Status da assinatura</span>
                  <span className={styles.statusValue}>{status.subscriptionStatus}</span>
                </div>
              )}

              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Slots de personagem</span>
                <span className={styles.statusValue}>
                  {status?.characterSlots ?? '—'}
                  {(status?.extraSlotsPurchased ?? 0) > 0 && (
                    <span className={styles.extraSlots}> (+{status!.extraSlotsPurchased} extra(s))</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </section>

        {!isPro && (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Assinar Plano Pro</h2>
            <p className={styles.cardDesc}>
              Desbloqueie {5} personagens, grupos ilimitados e acesso a todas as funcionalidades.
            </p>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={busy === 'subscribe'}
              onClick={() => handle('subscribe', apiSubscribePro)}
            >
              {busy === 'subscribe' ? 'Aguarde...' : '✦ Assinar Pro'}
            </button>
          </section>
        )}

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Slot extra de personagem</h2>
          <p className={styles.cardDesc}>
            Compre um slot adicional permanente (+1 personagem). Compra única, sem recorrência.
          </p>
          <button
            className={`${styles.btn} ${styles.btnGold}`}
            disabled={busy === 'slot'}
            onClick={() => handle('slot', apiBuySlot)}
          >
            {busy === 'slot' ? 'Aguarde...' : '+ Comprar slot extra'}
          </button>
        </section>

        {isPro && (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Gerenciar assinatura</h2>
            <p className={styles.cardDesc}>
              Acesse o portal Stripe para visualizar faturas, alterar forma de pagamento ou cancelar.
            </p>
            <div className={styles.btnRow}>
              <button
                className={`${styles.btn} ${styles.btnOutline}`}
                disabled={busy === 'portal'}
                onClick={() => handle('portal', apiGetBillingPortal)}
              >
                {busy === 'portal' ? 'Aguarde...' : '⚙ Gerenciar no Stripe'}
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                disabled={busy === 'cancel'}
                onClick={() =>
                  handle('cancel', async () => {
                    const confirmed = window.confirm(
                      'Tem certeza que deseja cancelar sua assinatura? O acesso Pro continuará até o fim do período atual.',
                    );
                    if (!confirmed) return {};
                    return apiCancelSubscription();
                  })
                }
              >
                {busy === 'cancel' ? 'Aguarde...' : 'Cancelar assinatura'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
