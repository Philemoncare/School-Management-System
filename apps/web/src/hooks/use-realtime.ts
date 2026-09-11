import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/auth-context';
import Cookies from 'js-cookie';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export function useRealtime() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = Cookies.get('token');

    const socket = io(WEBSOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to realtime services');
      const schoolId = localStorage.getItem('schoolId');
      if (schoolId) {
        socket.emit('join-school', schoolId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from realtime services');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const on = (event: string, callback: (data: any) => void) => {
    useEffect(() => {
      const socket = socketRef.current;
      if (!socket) return;

      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    }, [event, callback]);
  };

  return { on, socket: socketRef.current };
}
