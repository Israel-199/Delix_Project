import { apiClient } from './client';
import type { Employee, PaginatedResponse, EmployeeStatus } from '../types';

export async function getEmployees(params?: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  status?: EmployeeStatus;
}) {
  const { data } = await apiClient.get<PaginatedResponse<Employee>>('/employees', { params });
  return data;
}

export async function getEmployee(id: string) {
  const { data } = await apiClient.get<{ success: boolean; data: Employee }>(`/employees/${id}`);
  return data.data;
}

export async function createEmployee(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<{ success: boolean; data: Employee }>('/employees', payload);
  return data.data;
}

export async function updateEmployee(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put<{ success: boolean; data: Employee }>(`/employees/${id}`, payload);
  return data.data;
}

export async function deleteEmployee(id: string) {
  await apiClient.delete(`/employees/${id}`);
}
