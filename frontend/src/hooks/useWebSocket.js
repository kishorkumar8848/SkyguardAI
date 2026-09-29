import { useState, useEffect, useRef } from 'react';

export function useWebSocket(onMessageCallback) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastTick, setLastTick] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || '127.0.0.1:5173';
    const wsUrl = `${protocol}//${host}/ws/live`;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'telemetry_tick') {
            setLastTick(parsed.data);
            if (onMessageCallback) {
              onMessageCallback(parsed.data);
            }
          }
        } catch (e) {
          // ignore non-json
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('WebSocket connection error:', err);
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  return { isConnected, lastTick };
}
