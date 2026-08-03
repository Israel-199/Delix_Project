import apiClient from './apiClient';
import { normalizePhone } from '../utils/mappers';

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  phone: string;
  devOtp?: string;
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
