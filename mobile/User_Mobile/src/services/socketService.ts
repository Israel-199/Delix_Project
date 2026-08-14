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

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinOrderRoom = (orderId: string) => {
  getSocket().emit('join_order', { orderId });
};

export const leaveOrderRoom = (orderId: string) => {
  getSocket().emit('leave_order', { orderId });
};

export const emitCargoDeliveryRequest = (orderData: Record<string, unknown>) => {
  getSocket().emit('request_cargo_delivery', orderData);
};

export const emitOrderCompleted = (orderId: string) => {
  getSocket().emit('order_completed', { orderId });
};

export const onOrderStatusChanged = (
  handler: (payload: {
    orderId?: string;
    status: string;
    driverId?: string;
    driverName?: string;
    driverPhone?: string;
    plateNumber?: string;
    vehicleType?: string;
  }) => void
) => {
  getSocket().on('order_status_changed', handler);
  return () => {
    getSocket().off('order_status_changed', handler);
  };
};

export const onLiveDriverMoved = (
  handler: (payload: {
    driverId: string;
    lat: number;
    lng: number;
    vehicleType?: string;
    orderId?: string;
  }) => void
) => {
  getSocket().on('live_driver_moved', handler);
  return () => {
    getSocket().off('live_driver_moved', handler);
  };
};

export default getSocket;
