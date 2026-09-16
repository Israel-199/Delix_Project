import { apiClient } from './client';
import type { Shift, ApiResponse } from '../types';

export async function getShifts(): Promise<Shift[]> {
  const { data } = await apiClient.get<ApiResponse<Shift[]>>('/shifts');
  return data.data ?? [];
}

export async function createShift(payload: {
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
}) {
  const { data } = await apiClient.post<ApiResponse<Shift>>('/shifts', payload);
  return data.data!;
}

export async function updateShift(
  id: string,
  payload: { name?: string; startTime?: string; endTime?: string; description?: string }
) {
  const { data } = await apiClient.put<ApiResponse<Shift>>(`/shifts/${id}`, payload);
  return data.data!;
}

export async function deleteShift(id: string) {
  await apiClient.delete(`/shifts/${id}`);
}
