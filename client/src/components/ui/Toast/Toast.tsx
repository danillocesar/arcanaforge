import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import styles from './Toast.module.css';
import { playNotifSound } from '../../../utils/sounds';
import {
  setToastHandler,
  type ToastVariant as ToastVariantService,
} from '../../../services/toastService';

export type ToastVariant = ToastVariantService;

interface ToastItem {
  id: number;
  text: string;
  visible: boolean;
  variant: ToastVariant;
  pmCusto?: number;
}

interface ToastContextValue {
  showToast: (text: string, variant?: ToastVariant, pmCusto?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CLASS: Record<ToastVariant, string> = {
  default: styles.toastDefault,
  info: styles.toastInfo,
  sync: styles.toastSync,
  attack: styles.toastAttack,
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToastImpl = useCallback(
    (text: string, variant: ToastVariant = 'default', pmCusto?: number) => {
      playNotifSound();
      const id = nextId++;
      setToasts((prev) => [
        ...prev,
        { id, text, visible: false, variant, pmCusto },
      ]);

      requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, visible: true } : t)),
        );
      });

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2600);
    },
    [],
  );

  useEffect(() => {
    setToastHandler((text, variant, pmCusto) =>
      showToastImpl(text, variant, pmCusto),
    );
    return () => setToastHandler(null);
  }, [showToastImpl]);

  const showToast = useCallback(
    (text: string, variant?: ToastVariant, pmCusto?: number) => {
      showToastImpl(text, variant ?? 'default', pmCusto);
    },
    [showToastImpl],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${VARIANT_CLASS[t.variant]} ${t.visible ? styles.show : ''}`}
          >
            {t.text}
            {typeof t.pmCusto === 'number' && t.pmCusto > 0 ? (
              <span className={styles.toastPm}>-${t.pmCusto} PM</span>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastProvider;
