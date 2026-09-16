import { apiClient } from './client';
import type { Attendance, PaginatedResponse, AttendanceStatus } from '../types';

export async function getAttendance(params?: {
  page?: number;
  limit?: number;
  date?: string;
  employeeId?: string;
  status?: AttendanceStatus;
}) {
  const { data } = await apiClient.get<PaginatedResponse<Attendance>>('/attendance', { params });
  return data;
}

export async function createAttendance(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<{ success: boolean; data: Attendance }>('/attendance', payload);
  return data.data;
}

export async function updateAttendance(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put<{ success: boolean; data: Attendance }>(`/attendance/${id}`, payload);
  return data.data;
}

export async function deleteAttendance(id: string) {
  await apiClient.delete(`/attendance/${id}`);
}
