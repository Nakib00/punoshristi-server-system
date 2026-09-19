import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { GPIO_BRIDGE_URL } from './api';

// Connects to the local kiosk-gpio-bridge daemon (server/kiosk-gpio-bridge)
// and reports the physical Start/Stop button presses and IR bottle-detect
// pulses. If the bridge isn't reachable (no hardware wired up yet, or
// running this screen on a plain PC), `connected` stays false and the
// caller should fall back to on-screen buttons — the kiosk UI works either
// way.
export function useGpioBridge({ onStart, onStop, onBottle }) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef({ onStart, onStop, onBottle });
  handlersRef.current = { onStart, onStop, onBottle };

  useEffect(() => {
    const socket = io(GPIO_BRIDGE_URL, {
      reconnectionDelay: 1000,
      timeout: 3000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('start', () => handlersRef.current.onStart?.());
    socket.on('stop', () => handlersRef.current.onStop?.());
    socket.on('bottle', () => handlersRef.current.onBottle?.());

    return () => socket.disconnect();
  }, []);

  return { connected };
}
