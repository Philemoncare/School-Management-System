import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/auth-context';

function resolveWebSocketUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window === 'undefined') return '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  if (apiUrl.startsWith('http')) return new URL(apiUrl).origin;
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export function useRealtime() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      return;
    }

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const client = io(resolveWebSocketUrl(), {
      auth: { token },
      transports: ['websocket'],
    });

    client.on('connect', () => {
      const schoolId = localStorage.getItem('schoolId');
      if (schoolId) {
        client.emit('join-school', schoolId);
      }
    });

    socketRef.current = client;
    setSocket(client);

    return () => {
      client.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user]);

  return { socket };
}

export function useRealtimeEvent(
  socket: Socket | null,
  event: string,
  callback: (data: any) => void,
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => callbackRef.current(data);
    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event]);
}

