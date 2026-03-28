import { useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../features/auth/firebase';

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

function getWsBaseUrl(): string {
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

    function clearReconnect() {
      if (reconnectTimer !== undefined) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
    }

    async function connectWithUser() {
      clearReconnect();
      wsRef.current?.close();
      wsRef.current = null;

      const user = auth.currentUser;
      if (!user || unmounted) return;

      let token: string;
      try {
        token = await user.getIdToken();
      } catch {
        reconnectTimer = window.setTimeout(connectWithUser, 2000);
        return;
      }

      if (unmounted) return;

      const url = `${getWsBaseUrl()}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
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
        if (!unmounted && auth.currentUser) {
          reconnectTimer = window.setTimeout(connectWithUser, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (unmounted) return;
      if (!user) {
        clearReconnect();
        wsRef.current?.close();
        wsRef.current = null;
        return;
      }
      void connectWithUser();
    });

    return () => {
      unmounted = true;
      clearReconnect();
      unsub();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const send = useCallback((data: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}
