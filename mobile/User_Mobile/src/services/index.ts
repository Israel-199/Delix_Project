export { apiClient, ApiError, setAuthToken, getAuthToken } from './apiClient';
export { requestOtp, verifyOtp, checkHealth } from './authService';
export type { RequestOtpResponse, VerifyOtpResponse } from './authService';
export { estimateOrderPrice, createOrder, fetchOrderById } from './orderService';
export type {
  EstimateOrderRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderRecord,
} from './orderService';
export { tokenStorage } from './tokenStorage';
export {
  getSocket,
  disconnectSocket,
  emitCargoDeliveryRequest,
  onOrderStatusChanged,
  onSocketConnectionState,
  onSocketReconnect,
} from './socketService';
export type { SocketConnectionState } from './socketService';
