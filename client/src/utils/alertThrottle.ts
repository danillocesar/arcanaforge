/**
 * Throttle de alertas repetitivos (toast + som) por chave: o primeiro alerta de
 * uma chave passa; os seguintes dentro da janela são suprimidos — o efeito no
 * estado acontece sempre, só a notificação é segurada. A janela conta a partir
 * do último alerta MOSTRADO (tentativas suprimidas não a estendem), então uma
 * rajada contínua ainda alerta uma vez a cada janela.
 */
const lastShownAt = new Map<string, number>();

export function shouldAlert(key: string, windowMs = 10_000, now = Date.now()): boolean {
  const last = lastShownAt.get(key);
  if (last !== undefined && now - last < windowMs) return false;
  lastShownAt.set(key, now);
  return true;
}

/** Só para testes — zera o histórico entre casos. */
export function __resetAlertThrottle(): void {
  lastShownAt.clear();
}
