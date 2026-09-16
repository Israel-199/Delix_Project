import { apiClient } from './client';
import type { DashboardSummary, ApiResponse } from '../types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return data.data!;
}
