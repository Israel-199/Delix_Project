import apiClient from './apiClient';
import { normalizePhone } from '../utils/mappers';

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  phone: string;
  devOtp?: string;
  isProfileComplete?: boolean;
  token?: string;
  user?: {
    phone: string;
    name: string;
    role: string;
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    phone: string;
    name: string;
    role: string;
  };
}

export const requestOtp = async (phone: string): Promise<RequestOtpResponse> => {
  const normalized = normalizePhone(phone);
  return apiClient.post<RequestOtpResponse>('/auth/request-otp', { phone: normalized });
};

export const verifyOtp = async (
  phone: string,
  otp: string
): Promise<VerifyOtpResponse> => {
  const normalized = normalizePhone(phone);
  return apiClient.post<VerifyOtpResponse>('/auth/verify-otp', {
    phone: normalized,
    otp,
    role: 'CUSTOMER',
  });
};

export const checkHealth = async (): Promise<{ status: string }> => {
  return apiClient.get<{ status: string }>('/health');
};

export const updateUserProfile = async (
  data: { firstName: string; middleName: string; lastName: string; profilePhoto: string | null }
): Promise<{ success: boolean; user: any }> => {
  return apiClient.put<{ success: boolean; user: any }>('/users/profile', data);
};

export const getUserProfile = async (): Promise<{ success: boolean; user: any }> => {
  return apiClient.get<{ success: boolean; user: any }>('/users/profile');
};

export const getUserOrders = async (
  phone?: string | null
): Promise<{ success: boolean; orders: any[] }> => {
  const query = phone ? `?customerId=${encodeURIComponent(phone)}` : '';
  return apiClient.get<{ success: boolean; orders: any[] }>(`/users/orders${query}`);
};

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  orderId?: string | null;
  createdAt: string;
}

export const getUserNotifications = async (phone: string) => {
  return apiClient.get<{ success: boolean; notifications: UserNotification[] }>(
    `/users/notifications?phone=${encodeURIComponent(phone)}`
  );
};

export const markNotificationRead = async (id: string, phone: string) => {
  return apiClient.patch<{ success: boolean }>(
    `/users/notifications/${id}/read?phone=${encodeURIComponent(phone)}`,
    {}
  );
};

