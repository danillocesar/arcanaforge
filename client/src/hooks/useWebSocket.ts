import { useEffect, useRef, useState, useCallback } from 'react';

function getWsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (import.meta.env.DEV) {
    const port = import.meta.env.VITE_BACKEND_WS_PORT || '3001';
    return `${proto}//${location.hostname}:${port}`;
  }
  return `${proto}//${location.host}`;
}

export function useWebSocket(onMessage: (msg: any) => void): {
  send: (data: any) => void;
  connected: boolean;
} {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!unmounted) setConnected(true);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          onMessageRef.current(msg);
        } catch {
          /* ignore malformed */
        }
      };

      ws.onclose = () => {
        if (!unmounted) {
          setConnected(false);
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      unmounted = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, connected };
}
