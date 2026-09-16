import { apiClient } from './client';
import type { Department, ApiResponse } from '../types';

export async function getDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<ApiResponse<Department[]>>('/departments');
  return data.data ?? [];
}

export async function createDepartment(payload: { name: string; description?: string }) {
  const { data } = await apiClient.post<ApiResponse<Department>>('/departments', payload);
  return data.data!;
}

export async function updateDepartment(id: string, payload: { name?: string; description?: string }) {
  const { data } = await apiClient.put<ApiResponse<Department>>(`/departments/${id}`, payload);
  return data.data!;
}

export async function deleteDepartment(id: string) {
  await apiClient.delete(`/departments/${id}`);
}
