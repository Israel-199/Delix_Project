import { apiClient } from './client';
import type { AttendanceSummaryReport, DepartmentAttendanceReport, ApiResponse } from '../types';

export async function getAttendanceSummary(params?: { startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get<ApiResponse<AttendanceSummaryReport[]>>(
    '/reports/attendance-summary',
    { params }
  );
  return data.data ?? [];
}

export async function getDepartmentAttendance(params?: { startDate?: string; endDate?: string }) {
  const { data } = await apiClient.get<ApiResponse<DepartmentAttendanceReport[]>>(
    '/reports/department-attendance',
    { params }
  );
  return data.data ?? [];
}
