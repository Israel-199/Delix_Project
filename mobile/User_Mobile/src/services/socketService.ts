import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitCargoDeliveryRequest = (orderData: Record<string, unknown>) => {
  getSocket().emit('request_cargo_delivery', orderData);
};

export const onOrderStatusChanged = (
  handler: (payload: { orderId?: string; status: string; driverId?: string }) => void
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
  }) => void
) => {
  getSocket().on('live_driver_moved', handler);
  return () => {
    getSocket().off('live_driver_moved', handler);
  };
};

export default getSocket;
