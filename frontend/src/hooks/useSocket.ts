'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

/**
 * Hook to connect to the queue WebSocket gateway.
 * Returns a `lastUpdate` timestamp that bumps on every `queueUpdate` event,
 * which dashboards can use as a dependency to trigger re-fetches.
 *
 * Optionally, pass a `patientId` to also listen for patient-specific updates.
 */
export function useSocket(patientId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isConnected, setIsConnected] = useState(false);

  const triggerRefresh = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Global queue update signal
    socket.on('queueUpdate', () => {
      triggerRefresh();
    });

    // Patient-specific update
    if (patientId) {
      socket.on(`patientUpdate-${patientId}`, () => {
        triggerRefresh();
      });
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [patientId, triggerRefresh]);

  return { lastUpdate, isConnected, triggerRefresh };
}
