import { apiClient } from './api';
import type { DashboardSummary } from '@/models/api';
import type { LoanApplication } from '@/models/loan';

export const DashboardService = {
  /**
   * No dashboard-summary endpoint is confirmed to exist yet. This method
   * calls a sensible REST path (`GET /dashboard/summary`); swap the path or
   * the aggregation logic here once the real backend endpoint is known —
   * no other file needs to change.
   */
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return data;
  },

  async getRecentApplications(limit = 5): Promise<LoanApplication[]> {
    const { data } = await apiClient.get<LoanApplication[]>('/loan-applications', {
      params: { page: 0, size: limit, sort: 'applicationDate,desc' },
    });
    return data;
  },
};
