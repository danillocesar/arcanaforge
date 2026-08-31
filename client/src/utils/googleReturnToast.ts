import type { ToastVariant } from '../services/toastService';

export interface GoogleReturnToast {
  message: string;
  variant: ToastVariant;
}

/**
 * Decide a mensagem e a variante do toast a partir da query string de volta
 * do consentimento do Google (`?google=ok|error[&reason=...]`).
 *
 * Extraído do effect do GroupInfoCard como a fatia pura do leitor: recebe a
 * query string já pronta (não lê `window`, não chama `history.replaceState`),
 * então dá pra testar sem jsdom. O chamador continua responsável por ler
 * `window.location.search`, mostrar o toast e limpar a URL.
 */
export function parseGoogleReturnToast(search: string): GoogleReturnToast | null {
  const params = new URLSearchParams(search);
  const status = params.get('google');
  if (!status) return null;

  if (status === 'ok') {
    return { message: 'Google Agenda conectada.', variant: 'info' };
  }

  // Não existe variante 'error' no ToastVariant; 'attack' é a única de cor
  // cheia que não aparece em notificação de rotina, então destoa do aviso
  // comum (mesmo raciocínio de quando o leitor morava no efeito).
  return {
    message: `Não foi possível conectar: ${params.get('reason') || 'erro'}`,
    variant: 'attack',
  };
}
