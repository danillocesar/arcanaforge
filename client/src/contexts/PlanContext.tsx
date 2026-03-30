import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '../api/http';
import { useAuth } from '../features/auth/useAuth';

export interface BillingStatus {
  plan: 'free' | 'trial' | 'pro';
  trialEndsAt: string | null;
  trialDaysLeft: number;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  characterSlots: number;
  extraSlotsPurchased: number;
  isExpired: boolean;
  isTrial: boolean;
}

interface PlanContextValue {
  status: BillingStatus | null;
  loading: boolean;
  slotsUsed: number;
  setSlotsUsed: (n: number) => void;
  refresh: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

async function fetchBillingStatus(): Promise<BillingStatus> {
  const res = await apiFetch('/api/billing/status');
  if (!res.ok) throw new Error('Falha ao buscar status do plano');
  return res.json();
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsUsed, setSlotsUsed] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await fetchBillingStatus();
      setStatus(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        refresh();
      } else {
        setStatus(null);
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, refresh]);

  const value = useMemo<PlanContextValue>(
    () => ({ status, loading, slotsUsed, setSlotsUsed, refresh }),
    [status, loading, slotsUsed, refresh],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
  return ctx;
}
