import { apiRequest } from './apiClient';

export const requestDriverOtp = (phone: string) =>
  apiRequest<{ success: boolean; devOtp?: string; phone: string }>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

export const verifyDriverOtp = (phone: string, otp: string) =>
  apiRequest<{
    success: boolean;
    token: string;
    user: { phone: string; name: string; role: string };
  }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp, role: 'DRIVER' }),
  });

export const fetchDriverProfile = (phone: string) =>
  apiRequest<{
    success: boolean;
    driver: {
      id: string;
      name?: string;
      phone?: string;
      profilePhotoUrl?: string | null;
      plateNumber: string;
      vehicleType: string;
      status: string;
      completedTrips: number;
    } | null;
  }>(`/drivers/profile?phone=${encodeURIComponent(phone)}`);

export const registerDriver = (payload: {
  phone: string;
  name: string;
  licenseNumber: string;
  licensePhotoUrl?: string;
  nationalId?: string;
  plateNumber: string;
  vehicleType: string;
  vehicleCargoType?: string;
  vehicleOwnerName?: string;
  librePhotoUrl?: string;
  insuranceInfo?: string;
  bankAccount?: string;
  address?: string;
}) =>
  apiRequest<{
    success: boolean;
    driver: {
      id: string;
      plateNumber: string;
      vehicleType: string;
      status: string;
    };
  }>('/drivers/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
