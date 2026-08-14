import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

export type SocketConnectionState = 'connected' | 'connecting' | 'disconnected';

let socket: Socket | null = null;
const connectionListeners = new Set<(state: SocketConnectionState) => void>();
const reconnectListeners = new Set<() => void>();

const notifyConnectionState = (state: SocketConnectionState) => {
  connectionListeners.forEach((listener) => listener(state));
};

const notifyReconnect = () => {
  reconnectListeners.forEach((listener) => listener());
};

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });

    socket.on('connect', () => {
      notifyConnectionState('connected');
    });

    socket.on('disconnect', () => {
      notifyConnectionState('disconnected');
    });

    socket.io.on('reconnect_attempt', () => {
      notifyConnectionState('connecting');
    });

    socket.io.on('reconnect', () => {
      notifyConnectionState('connected');
      notifyReconnect();
    });
  }

  return socket;
};

export const onSocketConnectionState = (
  handler: (state: SocketConnectionState) => void
) => {
  connectionListeners.add(handler);
  handler(socket?.connected ? 'connected' : 'disconnected');
  return () => {
    connectionListeners.delete(handler);
  };
};

export const onSocketReconnect = (handler: () => void) => {
  reconnectListeners.add(handler);
  return () => {
    reconnectListeners.delete(handler);
  };
};

export const registerDriverSocket = (driverId: string) => {
  const client = getSocket();
  client.emit('register_driver', { driverId });
  client.emit('join_driver_pool');
};

export const joinOrderRoom = (orderId: string) => {
  getSocket().emit('join_order', { orderId });
};

export const emitDriverOffline = (driverId: string) => {
  getSocket().emit('driver_go_offline', { driverId });
};

export default getSocket;
