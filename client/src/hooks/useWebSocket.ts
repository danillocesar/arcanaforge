import { useEffect, useRef, useCallback } from 'react';

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

function getWsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (import.meta.env.DEV) {
    const port = import.meta.env.VITE_BACKEND_WS_PORT || '3001';
    return `${proto}//${location.hostname}:${port}`;
  }
  return `${proto}//${location.host}`;
}

export function useWebSocket(onMessage: (msg: WsMessage) => void): {
  send: (data: WsMessage) => void;
} {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let reconnectTimer: number | undefined;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as WsMessage;
          onMessageRef.current(msg);
        } catch {
          /* ignore malformed */
        }
      };

      ws.onclose = () => {
        if (!unmounted) {
          reconnectTimer = window.setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer !== undefined) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((data: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}
