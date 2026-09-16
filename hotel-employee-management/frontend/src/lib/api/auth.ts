import { apiClient } from './client';
import type { Admin, ApiResponse } from '../types';

export async function login(email: string, password: string): Promise<Admin> {
  const { data } = await apiClient.post<ApiResponse<Admin>>('/auth/login', { email, password });
  return data.data!;
}

export async function getMe(): Promise<Admin | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<Admin>>('/auth/me');
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
