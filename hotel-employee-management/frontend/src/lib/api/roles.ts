import { apiClient } from './client';
import type { Role, ApiResponse } from '../types';

export async function getRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<ApiResponse<Role[]>>('/roles');
  return data.data ?? [];
}

export async function createRole(payload: { name: string; description?: string }) {
  const { data } = await apiClient.post<ApiResponse<Role>>('/roles', payload);
  return data.data!;
}

export async function updateRole(id: string, payload: { name?: string; description?: string }) {
  const { data } = await apiClient.put<ApiResponse<Role>>(`/roles/${id}`, payload);
  return data.data!;
}

export async function deleteRole(id: string) {
  await apiClient.delete(`/roles/${id}`);
}
